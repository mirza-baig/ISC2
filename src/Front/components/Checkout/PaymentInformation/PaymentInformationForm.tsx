/* eslint-disable @typescript-eslint/no-explicit-any */
import { PaymentElement, useElements } from '@stripe/react-stripe-js';
import {
  BraintreePayPalButtons,
  OnApproveBraintreeActions,
  OnApproveBraintreeData,
} from '@paypal/react-paypal-js';
import { FormEvent, useCallback, useEffect, useState } from 'react';

import { useConfirmPayment, useGetPaymentIntent, useRecalculateCart } from 'hooks/index';
import { useCart, useCheckoutProcess, useModal, usePersonalize } from 'providers/index';
import { Button } from 'ui/index';

import { ProductsNotAvailableModal } from './ProductsNotAvailableModal';
import { PaymentMethodSection } from './PaymentMethodSection';
import { CHECKOUT_STEPS, PAYMENT_METHODS, ANALYTICS_EVENTS } from 'constants/index';
import { ConfirmPaymentPayload, Cart, CartLineItem, PersonalInformation } from 'types/index';
import { parsePriceFromMoney, addComputedFieldsToLineItems } from 'utils/index';

const sendEngageAddToCartForB2B = (
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

  cartLineItems.forEach((lineItem) => {
    const originalPrice = parsePriceFromMoney(lineItem.price.value, 1) as number;
    const discountedPrice = lineItem.price.discounted?.value
      ? (parsePriceFromMoney(lineItem.price.discounted.value, 1) as number)
      : null;

    const eventData = {
      channel: 'WEB',
      currency: currency,
      pointOfSale: process.env.NEXT_PUBLIC_ENGAGE_TARGET_POS || 'WEB',
      product: {
        name: lineItem.name,
        type: lineItem.productType?.name || 'Product',
        item_id: lineItem.variant.sku,
        productId: lineItem.productKey,
        referenceId: lineItem.productKey,
        orderedAt: new Date().toISOString(),
        quantity: lineItem.quantity,
        price: discountedPrice || originalPrice,
        originalPrice: originalPrice,
        currency: currency,
      },
    };

    const extensionData = {
      source: 'b2bPaymentConfirmation',
      userType: 'B2B User',
      isB2BTransaction: true,
      timestamp: new Date().toISOString(),
    };

    try {
      engage.event(ANALYTICS_EVENTS.ADD_TO_CART_CDP, eventData, extensionData);
    } catch (e: unknown) {
      console.error('Error sending B2B add to cart CDP event:', e);
    }
  });
};

const sendEngageBeginCheckoutForB2B = (
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
    source: 'b2bPaymentConfirmation',
    userType: 'B2B User',
    isB2BTransaction: true,
    timestamp: new Date().toISOString(),
  };

  try {
    engage.event(ANALYTICS_EVENTS.BEGIN_CHECKOUT_CDP, eventData, extensionData);
  } catch (e: unknown) {
    console.error('Error sending B2B begin checkout CDP event:', e);
  }
};

type Props = {
  personalInformation?: PersonalInformation;
};

export default function PaymentInformationForm({ personalInformation }: Props) {
  const elements = useElements();

  const { isPaypalInfoIncomplete, isStripeInfoIncomplete, isGettingPaymentIntent } =
    useGetPaymentIntent();
  const { confirmPayment, isConfirmingPayment } = useConfirmPayment();
  const { stepTwoLabels, fields, setActiveStep, setHasPaymentError, hasInventoryError } =
    useCheckoutProcess();
  const { isRecalculating } = useRecalculateCart();
  const { setModalContent } = useModal();
  const { activeCart, isFreeOrder } = useCart();
  const { engage } = usePersonalize();

  const [paymentMethod, setPaymentMethod] = useState<PAYMENT_METHODS>();
  const [isStripeFormComplete, setIsStripeFormComplete] = useState(false);
  const [isOrderSubmitted, setIsOrderSubmitted] = useState<boolean>(false);

  const defaultBillingCountry = personalInformation?.billingAddress?.countryCode || 'US';
  const onGoBackButtonClick = useCallback(() => {
    if (isConfirmingPayment) {
      return;
    }

    setActiveStep(CHECKOUT_STEPS.PERSONAL_INFORMATION);
  }, [isConfirmingPayment, setActiveStep]);

  const clearStripeData = useCallback(() => {
    const element = elements?.getElement('payment');

    if (element) {
      element.clear();
    }
  }, [elements]);

  const validateOrder = useCallback(
    async ({ paymentMethod }: ConfirmPaymentPayload) => {
      if (paymentMethod === PAYMENT_METHODS.PAYPAL) {
        setIsOrderSubmitted(false);
        return;
      }

      if (activeCart.computed.isB2B && engage && activeCart.lineItems) {
        const cartWithComputedFields = addComputedFieldsToLineItems(activeCart as Cart);
        const currency = activeCart.computed.currencyCode || 'USD';

        sendEngageAddToCartForB2B(cartWithComputedFields.lineItems, currency, engage);
        sendEngageBeginCheckoutForB2B(cartWithComputedFields.lineItems, currency, engage);
      }

      confirmPayment({ paymentMethod });
    },
    [confirmPayment, activeCart, engage]
  );

  const onFreeOrderFormSubmit = useCallback(
    async (ev: FormEvent) => {
      ev.preventDefault();
      setHasPaymentError(false);
      setPaymentMethod(PAYMENT_METHODS.FREE);
      setIsOrderSubmitted(true);

      validateOrder({ paymentMethod: PAYMENT_METHODS.FREE });
    },
    [setHasPaymentError, validateOrder]
  );

  const onStripeFormSubmit = useCallback(
    async (ev: FormEvent) => {
      ev.preventDefault();
      setHasPaymentError(false);
      setIsOrderSubmitted(true);

      if (isConfirmingPayment || !isStripeFormComplete || isFreeOrder) {
        setHasPaymentError(true);
        setIsOrderSubmitted(false);
        return;
      }

      validateOrder({ paymentMethod: PAYMENT_METHODS.STRIPE });
    },
    [isConfirmingPayment, isStripeFormComplete, isFreeOrder, validateOrder, setHasPaymentError]
  );

  const onPaypalPaymentApprove = useCallback(
    async (data: OnApproveBraintreeData, actions: OnApproveBraintreeActions) => {
      if (isConfirmingPayment) {
        return;
      }

      const tokenizedPayment = await actions.braintree.tokenizePayment(data);

      confirmPayment({
        paymentMethod: PAYMENT_METHODS.PAYPAL,
        paymentMethodNonce: tokenizedPayment.nonce,
      });
    },
    [confirmPayment, isConfirmingPayment]
  );

  const onPaypalButtonClick = useCallback(async () => {
    setHasPaymentError(false);
    if (isConfirmingPayment) {
      return;
    }

    clearStripeData();
    setPaymentMethod(PAYMENT_METHODS.PAYPAL);
  }, [setHasPaymentError, isConfirmingPayment, clearStripeData]);

  useEffect(() => {
    const paymentElement = elements?.getElement('payment');

    if (paymentElement) {
      paymentElement.on('change', (ev) => setIsStripeFormComplete(ev.complete));
    }

    return () => {
      if (paymentElement) {
        paymentElement.off('change');
      }
    };
  }, [elements]);

  useEffect(() => {
    // Bypass inventory validation if B2B cart
    if (activeCart.computed.isB2B) {
      return;
    }

    if (hasInventoryError) {
      setActiveStep(CHECKOUT_STEPS.PERSONAL_INFORMATION);
      setModalContent(
        <ProductsNotAvailableModal
          heading={stepTwoLabels.productsNotAvailableModalHeading}
          description={stepTwoLabels.productsNotAvailableModalDescription}
          ctaLabel={stepTwoLabels.productsNotAvailableModalButtonLabel}
        />
      );
    }
  }, [
    activeCart.computed.isB2B,
    hasInventoryError,
    setActiveStep,
    setModalContent,
    stepTwoLabels.productsNotAvailableModalButtonLabel,
    stepTwoLabels.productsNotAvailableModalDescription,
    stepTwoLabels.productsNotAvailableModalHeading,
  ]);

  return (
    <form
      className="w-full space-y-5"
      onSubmit={isFreeOrder ? onFreeOrderFormSubmit : onStripeFormSubmit}
    >
      <label className="headline-s">{stepTwoLabels.stepTitle}</label>

      {!isFreeOrder && !isStripeInfoIncomplete && (
        <PaymentMethodSection
          title={stepTwoLabels.stripeRadioButtonLabel}
          isActive={paymentMethod === PAYMENT_METHODS.STRIPE}
        >
          <PaymentElement
            className="bg-gray-10 p-5"
            onFocus={() => {
              setHasPaymentError(false);
              setPaymentMethod(PAYMENT_METHODS.STRIPE);
            }}
            options={{
              layout: 'tabs',
              defaultValues: {
                billingDetails: {
                  address: {
                    country: defaultBillingCountry,
                  },
                },
              },
              fields: {
                billingDetails: {
                  name: 'auto',
                },
              },
            }}
          />
        </PaymentMethodSection>
      )}

      {!isFreeOrder && !isPaypalInfoIncomplete && (
        <PaymentMethodSection
          title={stepTwoLabels.paypalRadioButtonLabel}
          isActive={paymentMethod === PAYMENT_METHODS.PAYPAL}
        >
          <BraintreePayPalButtons
            className="w-full md:max-w-350"
            fundingSource="paypal"
            onClick={onPaypalButtonClick}
            onApprove={onPaypalPaymentApprove}
            style={{
              disableMaxWidth: true,
            }}
            createOrder={(_data, actions) =>
              actions.braintree.createPayment({
                flow: 'checkout',
                amount: activeCart.computed.totalPrice,
                currency: activeCart.computed.currencyCode!.toUpperCase(),
                requestBillingAgreement: true,
                intent: 'capture',
              })
            }
          />
        </PaymentMethodSection>
      )}

      {isFreeOrder && (
        <PaymentMethodSection title="" isActive={false}>
          {stepTwoLabels.freeOrderLabel}
        </PaymentMethodSection>
      )}

      <footer className="flex flex-wrap justify-between max-sm:flex-col-reverse max-sm:gap-y-4">
        <Button
          type="button"
          variant="secondary"
          disabled={isRecalculating || isConfirmingPayment || isOrderSubmitted}
          onClick={onGoBackButtonClick}
          label={stepTwoLabels.previousStepCtaLabel}
        />

        {paymentMethod !== PAYMENT_METHODS.PAYPAL && (
          <Button
            type="submit"
            variant="primary"
            disabled={
              isRecalculating || isConfirmingPayment || isOrderSubmitted || isGettingPaymentIntent
            }
            isLoading={
              isRecalculating || isConfirmingPayment || isOrderSubmitted || isGettingPaymentIntent
            }
            label={fields.confirmPurchaseCta.value.text!}
          />
        )}
      </footer>
    </form>
  );
}
