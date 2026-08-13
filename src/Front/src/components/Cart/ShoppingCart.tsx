import { Placeholder, ComponentRendering } from '@sitecore-jss/sitecore-jss-nextjs';
import { useEffect, useMemo, useRef, useState } from 'react';
import { signIn } from 'next-auth/react';
import { format, parse } from 'date-fns';

import { DangerIcon } from 'icons/index';
import { LoadingIndicator, RichTextUI } from 'ui/index';
import {
  useCartValidity,
  useLoggedUser,
  useRecalculateCart,
  useCartPreload,
  useGetAlgoliaSitecoreData,
} from 'hooks/index';
import { useCart, useCartFields, useLineItems, useModal, useUserSession } from 'providers/index';
import useAnalyticsTracking from 'hooks/useAnalyticsTracking';
import { getCartAttributes, useAnalyticsItems } from 'utils/cart';

import { CartLineItem } from './CartLineItem';
import { DonationModal } from './DonationModal';
import { CartWarningModal } from './CartWarningModal';
import EmptyCart from './EmptyCart';
import Donation from './Donation';
import CartError from './CartError';
import { ANALYTICS_EVENTS } from 'constants/analytics';
import { CurrencyCodes } from 'utils/index';

interface ShoppingCartProps {
  rendering: ComponentRendering;
}

const ShoppingCart = ({ rendering }: ShoppingCartProps) => {
  const { activeCart, isGettingCart } = useCart();
  const { fields, labels } = useCartFields();
  const { setModalContent } = useModal();
  const { recalculateCart } = useRecalculateCart();
  const { currencyCode, syncCurrencyCode } = useUserSession();
  const { isUserNotLoggedIn, isB2BAdminUser } = useLoggedUser();
  const { cartError } = useCartValidity({ isCheckout: false });
  const { algoliaIndex } = useLineItems();
  const { track } = useAnalyticsTracking();
  const eventTrackedRef = useRef(false);
  const mappedItems = useAnalyticsItems();
  const pendingRecalculationRef = useRef(false);

  const { isPreloading, hasPreloadWarning } = useCartPreload({ openCartOnSuccess: false });

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!activeCart?.computed.isEmpty && !pendingRecalculationRef.current) {
      recalculateCart();
      pendingRecalculationRef.current = true;
    }
  }, [activeCart?.computed.isEmpty, recalculateCart]);

  useEffect(() => {
    // Force user to be logged in if cart id param is defined
    if (activeCart.computed.isB2B && isUserNotLoggedIn) {
      const { pathname, search } = window.location;

      signIn('salesforce', { callbackUrl: `${pathname}${search}` });
    }
  }, [activeCart.computed.isB2B, isUserNotLoggedIn]);

  useEffect(() => {
    // Force currency to active cart value in case user changed the currency right before going to cart
    const cartCurrencyCode = activeCart.computed.currencyCode;
    if (cartCurrencyCode && !activeCart.computed.isEmpty && cartCurrencyCode !== currencyCode) {
      syncCurrencyCode(cartCurrencyCode as CurrencyCodes);
    }
  }, [
    activeCart.computed.currencyCode,
    activeCart.computed.isEmpty,
    currencyCode,
    syncCurrencyCode,
  ]);

  // One Algolia search for the whole cart, rather than one per line item.
  const productKeysList = useMemo(
    () => (activeCart.lineItems ?? []).map((lineItem) => lineItem.productKey),
    [activeCart.lineItems]
  );

  const { algoliaBulkData, algoliaDataIsLoading } = useGetAlgoliaSitecoreData({
    productKeysList,
    algoliaIndex,
  });

  const cartAttributes = useMemo(() => {
    if (activeCart.computed.isB2B) {
      const { quoteExpiryDate, tempOrderNumber, SFInvoiceNumber } = getCartAttributes(activeCart);

      if (!quoteExpiryDate) {
        return { tempOrderNumber, SFInvoiceNumber };
      }

      const parsedDate = parse(quoteExpiryDate, 'yyyy-MM-dd', new Date());

      return {
        tempOrderNumber,
        SFInvoiceNumber,
        quoteExpiryDate: format(parsedDate, 'MMMM dd, yyyy'),
      };
    }

    return {};
  }, [activeCart]);

  useEffect(() => {
    if (activeCart?.lineItems && activeCart?.lineItems?.length > 0 && !eventTrackedRef.current) {
      track({ ecommerce: null });
      track({
        event: ANALYTICS_EVENTS.VIEW_CART,
        ecommerce: {
          currency: activeCart?.computed?.currencyCode,
          value: Number(activeCart?.computed?.subtotal),
          items: mappedItems,
        },
      });

      eventTrackedRef.current = true;
    }

    if (activeCart?.lineItems?.length === 0) {
      eventTrackedRef.current = false;
    }
  }, [mappedItems, activeCart, track]);

  useEffect(() => {
    if (activeCart.computed.includesSubscription && !activeCart.computed.isB2B && !isB2BAdminUser) {
      setModalContent(<DonationModal fields={fields.optionalDonationPopupNotice.fields} />);
    }
  }, [
    activeCart.computed.includesSubscription,
    activeCart.computed.isB2B,
    isB2BAdminUser,
    fields.optionalDonationPopupNotice.fields,
    setModalContent,
  ]);

  useEffect(() => {
    if (!isPreloading && hasPreloadWarning && fields.cartWarningPopupNotice?.fields) {
      setModalContent(<CartWarningModal fields={fields.cartWarningPopupNotice.fields} />);
    }
  }, [isPreloading, hasPreloadWarning, fields.cartWarningPopupNotice, setModalContent]);

  if (cartError?.length) {
    return <CartError />;
  }

  if (activeCart?.computed.isFetchedAndEmpty && !isPreloading) {
    return <EmptyCart />;
  }

  return (
    <main className="max-width-container pt-10 md:pt-15">
      <h1 className="headline-l md:headline-xl">{fields.title.value}</h1>

      {activeCart.computed.isB2B && (
        <div className="flex flex-col gap-y-4 mt-6 md:mt-8">
          {cartAttributes.tempOrderNumber && (
            <label className="body-l font-semibold">
              {[labels.salesNumberLabel || 'Sales number', cartAttributes.tempOrderNumber].join(
                ' '
              )}
            </label>
          )}
          {cartAttributes.SFInvoiceNumber && (
            <label className="body-l font-semibold">
              {[
                labels.SFInvoiceNumberLabel || 'Invoice Number',
                cartAttributes.SFInvoiceNumber,
              ].join(' ')}
            </label>
          )}
          {cartAttributes.quoteExpiryDate && (
            <label className="body-m">
              {[labels.validUntilLabel || 'Valid until', cartAttributes.quoteExpiryDate].join(' ')}
            </label>
          )}
          <RichTextUI className="body-s" value={fields.normalCartSubtitle.value} />
        </div>
      )}

      <div className="flex flex-col-reverse gap-8 lg:flex-row lg:gap-9 mt-8 md:mt-15">
        <div className="w-full lg:w-auto lg:flex-1 flex flex-col gap-y-5">
          {isPreloading ? (
            <LoadingIndicator className="self-center" />
          ) : (
            <>
              {isMounted && isGettingCart && <LoadingIndicator className="self-center" />}

              {activeCart.computed.hasNotAvailableProducts && (
                <div className="bg-red-warning bg-opacity-5 border border-red-warning p-5 space-x-2 text-gray-90 body-s flex rounded-lg">
                  <DangerIcon size={20} className="!fill-red-warning" />
                  <span className="flex flex-1">{labels.removeProductsNotAvailableMessage}</span>
                </div>
              )}

              <section className="flex flex-col w-full lg:gap-y-5">
                {activeCart.lineItems?.map((lineItem) => (
                  <CartLineItem
                    key={lineItem.id}
                    lineItem={lineItem}
                    algoliaData={algoliaBulkData?.find(
                      (product) => product.objectID === lineItem.productKey
                    )}
                    algoliaDataIsLoading={algoliaDataIsLoading}
                  />
                ))}
              </section>
              {activeCart.computed.includesSubscription &&
                !(activeCart.computed.isB2B || isB2BAdminUser) && <Donation />}
            </>
          )}
        </div>

        <div className="w-full lg:w-462 xl:w-520 space-y-10">
          {isPreloading ? (
            <LoadingIndicator className="self-center" />
          ) : (
            <Placeholder
              name="cart-content-right-column"
              params={{
                showTaxes: Boolean(activeCart.computed.isB2B || activeCart.taxedPrice).toString(),
              }}
              rendering={rendering}
            />
          )}
        </div>
      </div>
    </main>
  );
};

export default ShoppingCart;
