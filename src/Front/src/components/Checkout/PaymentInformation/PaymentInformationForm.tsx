/* eslint-disable @typescript-eslint/no-explicit-any */
import { PaymentElement, useElements } from '@stripe/react-stripe-js';
import {
  BraintreePayPalButtons,
  OnApproveBraintreeActions,
  OnApproveBraintreeData,
} from '@paypal/react-paypal-js';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import {
  useConfirmPayment,
  useDownloadQuote,
  useGetPaymentIntent,
  useRecalculateCart,
} from 'hooks/index';
import {
  useCart,
  useCheckoutProcess,
  useModal,
  usePersonalize,
  useShopperContext,
} from 'providers/index';
import { Button } from 'ui/index';
import { DownloadIcon } from 'icons/index';

import { ProductsNotAvailableModal } from './ProductsNotAvailableModal';
import { PaymentMethodSection } from './PaymentMethodSection';
import {
  CHECKOUT_STEP_TWO_ACTIONS_ANCHOR_ID,
  CHECKOUT_STEPS,
  PAYMENT_METHODS,
  QUOTE_DOCUMENT_DEFAULT_LABELS,
} from 'constants/index';
import { ConfirmPaymentPayload, Cart, PersonalInformation } from 'types/index';
import {
  addComputedFieldsToLineItems,
  buildQuoteData,
  sendEngageB2BPaymentConfirmationEvents,
} from 'utils/index';

type Props = {
  personalInformation?: PersonalInformation;
};

/** Associates the portaled Confirm Purchase button with this form via the HTML `form`
 *  attribute — a `type="submit"` button only submits its nearest DOM-ancestor form, and
 *  a portal moves it out of that ancestry, so this is required, not just tidy. */
const PAYMENT_FORM_ID = 'payment-information-form';

export default function PaymentInformationForm({ personalInformation }: Props) {
  const elements = useElements();

  const { isPaypalInfoIncomplete, isStripeInfoIncomplete, isGettingPaymentIntent } =
    useGetPaymentIntent();
  const { confirmPayment, isConfirmingPayment } = useConfirmPayment();
  const {
    stepTwoLabels,
    quoteLabels,
    fields,
    setActiveStep,
    setHasPaymentError,
    hasInventoryError,
  } = useCheckoutProcess();
  const { isRecalculating } = useRecalculateCart();
  const { setModalContent } = useModal();
  const { activeCart, isFreeOrder } = useCart();
  const { engage } = usePersonalize();
  const { shopperContext } = useShopperContext();
  const { downloadQuote, isGeneratingQuote } = useDownloadQuote();

  const [paymentMethod, setPaymentMethod] = useState<PAYMENT_METHODS>();
  const [isStripeFormComplete, setIsStripeFormComplete] = useState(false);
  const [isOrderSubmitted, setIsOrderSubmitted] = useState<boolean>(false);
  const [actionsAnchor, setActionsAnchor] = useState<HTMLElement | null>(null);

  // OrderSummary (a separately-placed, Sitecore-composed component) renders the anchor
  // this portals into. It can still be showing its own loading state on first render, so
  // this watches for the anchor to appear rather than assuming one effect pass finds it.
  useEffect(() => {
    const existing = document.getElementById(CHECKOUT_STEP_TWO_ACTIONS_ANCHOR_ID);

    if (existing) {
      setActionsAnchor(existing);
      return;
    }

    const observer = new MutationObserver(() => {
      const anchor = document.getElementById(CHECKOUT_STEP_TWO_ACTIONS_ANCHOR_ID);

      if (anchor) {
        setActionsAnchor(anchor);
        observer.disconnect();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

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

        sendEngageB2BPaymentConfirmationEvents(cartWithComputedFields.lineItems, currency, engage);
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

  // Built fresh from the live cart on every click, so editing products/quantities and
  // downloading again always reflects the current cart — nothing to invalidate.
  const onDownloadQuoteClick = useCallback(() => {
    const quoteData = buildQuoteData({
      cart: activeCart,
      personalInformation,
      organizationName: shopperContext?.organization?.name || personalInformation?.employer,
    });

    downloadQuote({ data: quoteData, labels: quoteLabels });
  }, [activeCart, personalInformation, shopperContext, downloadQuote, quoteLabels]);

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
      id={PAYMENT_FORM_ID}
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
      </footer>

      {/*
        Download Quote / Confirm Purchase render under the order summary box, per the
        prototype, via a portal into the anchor OrderSummary renders on this step — see
        PAYMENT_FORM_ID above for why Confirm Purchase still works once moved out of
        this form's DOM subtree. Both stay full-width so they read as the same length
        stacked, matching CartButtons' primary/secondary pairing on the Cart page.
      */}
      {actionsAnchor &&
        createPortal(
          <>
            {/*
              Not offered for free B2B orders — that path skips Payment Information
              entirely (see isPaymentStepSkipped in providers/checkoutProcess), and
              there is no tax/payment context yet to quote against.
            */}
            {!isFreeOrder && (
              <Button
                type="button"
                variant="secondary"
                disabled={isGeneratingQuote}
                isLoading={isGeneratingQuote}
                onClick={onDownloadQuoteClick}
                label={
                  quoteLabels.downloadQuoteCtaLabel ||
                  QUOTE_DOCUMENT_DEFAULT_LABELS.downloadQuoteCtaLabel
                }
                Icon={<DownloadIcon size={15} />}
                className="w-full justify-center"
              />
            )}

            {paymentMethod !== PAYMENT_METHODS.PAYPAL && (
              <Button
                type="submit"
                form={PAYMENT_FORM_ID}
                variant="primary"
                disabled={
                  isRecalculating ||
                  isConfirmingPayment ||
                  isOrderSubmitted ||
                  isGettingPaymentIntent
                }
                isLoading={
                  isRecalculating ||
                  isConfirmingPayment ||
                  isOrderSubmitted ||
                  isGettingPaymentIntent
                }
                label={fields.confirmPurchaseCta.value.text!}
                className="w-full justify-center"
              />
            )}
          </>,
          actionsAnchor
        )}
    </form>
  );
}
