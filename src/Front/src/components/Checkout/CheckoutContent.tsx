/* eslint-disable @typescript-eslint/no-unused-vars */
import { ComponentRendering, Placeholder } from '@sitecore-jss/sitecore-jss-nextjs';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useRef } from 'react';

import {
  useGetAllCountries,
  useGetAllStates,
  useLoggedUser,
  useRecalculateCart,
  useGetPaymentIntent,
  useUpdateTax,
  useCartValidity,
  useAnalyticsTracking,
  useIsCpqStyleCheckout,
  useHandleStripeReturn,
  useIsBusinessBuyer,
} from 'hooks/index';
import {
  LineItemsProvider,
  useCart,
  useCheckoutProcess,
  useModal,
  usePersonalize,
} from 'providers/index';
import {
  AlgoliaSettings,
  ServiceLayerError,
  CartWithComputedData,
  Cart,
  CartLineItem,
} from 'types/index';
import { LoadingIndicator } from 'ui/index';
import { ANALYTICS_EVENTS, TAX } from 'constants/index';

import CheckoutProcess from './CheckoutProcess';
import CheckoutTitle from './CheckoutTitle';
import CheckoutStepsIndicator from './CheckoutStepsIndicator';
import CheckoutError from './CheckoutError';
import { TaxErrorModal } from './TaxErrorModal';
import PaypalProvider from './PaymentProviders/Paypal';
import StripeProvider from './PaymentProviders/Stripe';
import {
  useAnalyticsItems,
  addComputedFieldsToLineItems,
  parsePriceFromMoney,
  isTaxAddressDefined,
  getAddressDiagnostics,
} from 'utils/index';
import { formatAnalyticsCouponCodes } from 'utils/analytics';

const sendEngageBeginCheckoutEvent = (
  cartLineItems: CartLineItem[],
  currency: string,
  engage: {
    event: (
      type: string,
      eventData: Record<string, unknown>,
      extensionData?: Record<string, unknown>
    ) => Promise<unknown>;
  } | null
) => {
  if (!engage) {
    return;
  }

  if (!cartLineItems || cartLineItems.length === 0) {
    return;
  }

  const totalValue = cartLineItems.reduce((sum, lineItem) => {
    const originalPrice = parsePriceFromMoney(lineItem.price.value, 1) as number;
    const discountedPrice = lineItem.price.discounted?.value
      ? (parsePriceFromMoney(lineItem.price.discounted.value, 1) as number)
      : null;
    const itemPrice = discountedPrice || originalPrice;
    return sum + itemPrice * lineItem.quantity;
  }, 0);

  const eventData = {
    channel: 'WEB',
    currency: currency,
    pointOfSale: process.env.NEXT_PUBLIC_ENGAGE_TARGET_POS || 'WEB',
    value: totalValue,
    product: cartLineItems.map((lineItem) => {
      return {
        item_id: lineItem.variant.sku,
      };
    }),
  };

  const extensionData = {
    source: 'beginCheckout',
    timestamp: new Date().toISOString(),
  };

  try {
    engage.event(ANALYTICS_EVENTS.BEGIN_CHECKOUT_CDP, eventData, extensionData);
  } catch (e: unknown) {
    /* empty */
  }
};

const hasTaxesError = (errors: ServiceLayerError[]): boolean =>
  errors.some((error) => error.message?.toLowerCase().includes(TAX));

type CheckoutContentProps = {
  rendering: ComponentRendering;
  algoliaSettings?: AlgoliaSettings;
};

export default function CheckoutContent({ algoliaSettings, rendering }: CheckoutContentProps) {
  const isPendingSetup = useRef(true);
  const isDisableCheckPending = useRef(true);

  const router = useRouter();
  const { errorState, taxErrorLabels } = useCheckoutProcess();
  const { activeCart, getCartSuccess, cartError, isFreeOrder } = useCart();
  const isCpqStyleCheckout = useIsCpqStyleCheckout();
  const isBusinessBuyer = useIsBusinessBuyer();
  const { externalID, user } = useLoggedUser();
  const { engage } = usePersonalize();

  const isPaymentReturnUrl = useMemo(() => {
    const [, queryString = ''] = router.asPath.split('?');
    const params = new URLSearchParams(queryString);

    return Boolean(params.get('redirect_status') && params.get('payment_intent'));
  }, [router.asPath]);

  const { paymentIntent, getPaymentIntent } = useGetPaymentIntent();
  const { isHandlingStripeReturn, isCompletingStripeReturn } = useHandleStripeReturn();
  const isProcessingPaymentReturn =
    isPaymentReturnUrl || isHandlingStripeReturn || isCompletingStripeReturn;

  const { setModalContent } = useModal();

  const { isGettingAllCountries } = useGetAllCountries({ enabled: !isProcessingPaymentReturn });
  const { isGettingAllStates } = useGetAllStates({ enabled: !isProcessingPaymentReturn });
  const { setTaxesAsync, taxesError } = useUpdateTax();
  const { recalculateCartAsync, recalculateCartError } = useRecalculateCart();
  const { cartError: cartValidationsErrors } = useCartValidity({ isCheckout: true });

  const eventTrackedRef = useRef(false);
  const { track } = useAnalyticsTracking();
  const mappedItems = useAnalyticsItems();

  const isCheckoutDisabled = useCallback(
    (cart: CartWithComputedData) =>
      cart.computed.isCheckoutDisabled || cart.computed.hasNotAvailableProducts,
    []
  );

  const getCartForCheckoutSession = useCallback(async () => {
    if (isCpqStyleCheckout) {
      return activeCart;
    }

    const recalculatedCart = await recalculateCartAsync();

    if (!isTaxAddressDefined(recalculatedCart?.shippingAddress)) {
      return recalculatedCart;
    }

    return setTaxesAsync({ cartId: recalculatedCart?.id })
      .then((cartWithTaxes) => cartWithTaxes)
      .catch(() => recalculatedCart);
  }, [activeCart, isCpqStyleCheckout, recalculateCartAsync, setTaxesAsync]);

  const setupCheckout = useCallback(async () => {
    const cartToUse = await getCartForCheckoutSession();

    if (cartToUse) {
      getPaymentIntent({ cart: cartToUse });
    }
  }, [getCartForCheckoutSession, getPaymentIntent]);

  useEffect(() => {
    if (!isPendingSetup.current) {
      return;
    }

    if (isHandlingStripeReturn) {
      isPendingSetup.current = false;
      return;
    }

    if (
      !activeCart.computed.isEmpty &&
      activeCart.customerEmail === user?.email &&
      !paymentIntent
    ) {
      setupCheckout();
      isPendingSetup.current = false;
    }
  }, [
    paymentIntent,
    user,
    setupCheckout,
    activeCart.computed.isEmpty,
    activeCart.customerEmail,
    isHandlingStripeReturn,
  ]);

  useEffect(() => {
    if (getCartSuccess && isDisableCheckPending.current) {
      if (isCheckoutDisabled(activeCart)) {
        router.replace('/');
      }

      isDisableCheckPending.current = false;
    }
  }, [getCartSuccess, activeCart, router, isCheckoutDisabled]);

  const checkoutErrors = useMemo(() => {
    const cartErrors = cartError ? [{ message: cartError.message }] : [];
    const taxesErrors = taxesError ? [{ message: taxesError.message }] : [];

    return [
      ...(errorState || []),
      ...((recalculateCartError || []) as ServiceLayerError[]),
      ...(cartValidationsErrors || []),
      ...taxesErrors,
      ...cartErrors,
    ];
  }, [cartError, taxesError, errorState, recalculateCartError, cartValidationsErrors]);

  const checkoutHasTaxesError = useMemo(
    () => hasTaxesError(checkoutErrors) || !!taxesError,
    [checkoutErrors, taxesError]
  );

  useEffect(() => {
    if (checkoutHasTaxesError) {
      const taxErrorLogPayload = {
        checkoutErrors,
        taxesError,
        cart: {
          id: activeCart?.id,
          version: activeCart?.version,
          customerId: activeCart?.customerId,
          customerEmailMatchesUserEmail:
            Boolean(activeCart?.customerEmail && user?.email) &&
            activeCart.customerEmail?.toLowerCase() === user?.email?.toLowerCase(),
          shippingAddressDiagnostics: getAddressDiagnostics(activeCart?.shippingAddress),
        },
        user: {
          externalID,
          customerId: user?.customerId,
          isSameAddress: user?.isSameAddress,
          mailingAddressDiagnostics: getAddressDiagnostics(user?.mailingAddress),
          billingAddressDiagnostics: getAddressDiagnostics(user?.billingAddress),
        },
        modalConfigured: {
          hasHeading: Boolean(taxErrorLabels?.heading?.value),
          hasDescription: Boolean(taxErrorLabels?.description?.value),
          hasCaption: Boolean(taxErrorLabels?.caption?.value),
          hasErrorMessages: Boolean(taxErrorLabels?.errorMessages?.value),
          hasRetryCtaLabel: Boolean(taxErrorLabels?.retryCtaLabel?.value),
        },
        location: window.location.href,
        timestamp: new Date().toISOString(),
      };

      console.error('[TAX-UPDATE-DEBUG] Showing tax calculation error modal', {
        ...taxErrorLogPayload,
      });

      void fetch('/api/client-log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          event: 'checkout_tax_calculation_error',
          level: 'error',
          payload: taxErrorLogPayload,
        }),
      }).catch((err) => {
        console.error('[TAX-UPDATE-DEBUG] Failed to send tax calculation error log', err);
      });

      setModalContent(<TaxErrorModal fields={{ ...taxErrorLabels }} />);
    }
  }, [
    activeCart?.id,
    activeCart?.version,
    activeCart?.customerId,
    activeCart?.customerEmail,
    activeCart?.shippingAddress,
    checkoutErrors,
    checkoutHasTaxesError,
    externalID,
    taxesError,
    taxErrorLabels,
    setModalContent,
    user?.billingAddress,
    user?.customerId,
    user?.isSameAddress,
    user?.mailingAddress,
    user?.email,
  ]);

  useEffect(() => {
    if (activeCart?.lineItems && activeCart?.lineItems?.length > 0 && !eventTrackedRef.current) {
      const coupon = formatAnalyticsCouponCodes(activeCart?.discountCodes);

      track({ ecommerce: null });
      track({
        event: ANALYTICS_EVENTS.BEGIN_CHECKOUT,
        ecommerce: {
          currency: activeCart?.computed?.currencyCode,
          value: Number(activeCart?.computed?.subtotal),
          items: mappedItems,
          ...(coupon !== undefined && { coupon }),
        },
      });

      if (engage && activeCart.id) {
        const cartWithComputedFields = addComputedFieldsToLineItems(activeCart as Cart);
        sendEngageBeginCheckoutEvent(
          cartWithComputedFields.lineItems,
          activeCart?.computed?.currencyCode || 'USD',
          engage
        );
      }

      eventTrackedRef.current = true;
    }

    if (activeCart?.lineItems?.length === 0) {
      eventTrackedRef.current = false;
    }
  }, [activeCart, mappedItems, track, engage]);

  if (isProcessingPaymentReturn) {
    return (
      <main className="py-10 md:py-15 max-width-container flex justify-center">
        <LoadingIndicator />
      </main>
    );
  }

  if (checkoutErrors.length && !checkoutHasTaxesError) {
    return <CheckoutError />;
  }

  return (
    <main className="py-10 md:py-15 max-width-container">
      <CheckoutTitle />

      <div
        className={
          isBusinessBuyer
            ? 'flex flex-col gap-8 md:flex-row md:items-start md:gap-9'
            : 'flex flex-col-reverse gap-8 lg:flex-row lg:gap-9'
        }
      >
        <div
          className={
            isBusinessBuyer
              ? 'w-full md:flex-1 flex flex-col gap-y-5'
              : 'max-lg:w-full lg:flex-1 flex flex-col gap-y-5'
          }
        >
          <CheckoutStepsIndicator />

          {!user ||
            isGettingAllCountries ||
            isGettingAllStates ||
            !getCartSuccess ||
            (!paymentIntent && !isFreeOrder && <LoadingIndicator className="self-center" />)}

          {user && activeCart.totalPrice && (paymentIntent || isFreeOrder) && (
            <PaypalProvider>
              <StripeProvider>
                <CheckoutProcess />
              </StripeProvider>
            </PaypalProvider>
          )}
        </div>

        <LineItemsProvider algoliaSettings={algoliaSettings!}>
          <div
            className={
              isBusinessBuyer
                ? 'w-full md:w-462 xl:w-520 space-y-10 md:sticky md:top-8'
                : 'w-full lg:w-462 xl:w-520 space-y-10'
            }
          >
            <Placeholder
              name="checkout-content-right-column"
              rendering={rendering}
              params={{ showTaxes: 'true' }}
            />
          </div>
        </LineItemsProvider>
      </div>
    </main>
  );
}
