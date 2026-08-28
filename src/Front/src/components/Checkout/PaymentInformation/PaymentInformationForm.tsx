/* eslint-disable @typescript-eslint/no-explicit-any */
import { PaymentElement, useElements } from '@stripe/react-stripe-js';
import {
  BraintreePayPalButtons,
  OnApproveBraintreeActions,
  OnApproveBraintreeData,
} from '@paypal/react-paypal-js';
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  useBusinessPaymentEligibility,
  useConfirmPayment,
  useEnsureBusinessCartTax,
  useGetPaymentIntent,
  useIsBusinessBuyer,
  useRecalculateCart,
} from 'hooks/index';
import { useCart, useCheckoutProcess, useModal, usePersonalize } from 'providers/index';
import { Button } from 'ui/index';

import { ProductsNotAvailableModal } from './ProductsNotAvailableModal';
import { PaymentMethodSection } from './PaymentMethodSection';
import {
  BUSINESS_PAYMENT_METHODS,
  BUSINESS_STEP_TWO_DEFAULT_LABELS,
  CHECKOUT_STEPS,
  isBusinessAccountPaymentMethod,
  PAYMENT_METHODS,
} from 'constants/index';
import { ConfirmPaymentPayload, Cart, PersonalInformation, StepTwoLabels } from 'types/index';
import { addComputedFieldsToLineItems, sendEngageB2BPaymentConfirmationEvents } from 'utils/index';

const SHOW_BUSINESS_PAYMENT_TEST_DETAILS = true;

const businessPaymentCopy = (stepTwoLabels: StepTwoLabels) => ({
  prepaidAccount:
    stepTwoLabels.prepaidAccountLabel || BUSINESS_STEP_TWO_DEFAULT_LABELS.prepaidAccountLabel,
  prepaidAccountDescription:
    stepTwoLabels.prepaidAccountDescription ||
    BUSINESS_STEP_TWO_DEFAULT_LABELS.prepaidAccountDescription,
  preapprovedCredit:
    stepTwoLabels.preapprovedCreditLabel || BUSINESS_STEP_TWO_DEFAULT_LABELS.preapprovedCreditLabel,
  preapprovedCreditDescription:
    stepTwoLabels.preapprovedCreditDescription ||
    BUSINESS_STEP_TWO_DEFAULT_LABELS.preapprovedCreditDescription,
  creditCard:
    stepTwoLabels.creditCardOptionLabel || BUSINESS_STEP_TWO_DEFAULT_LABELS.creditCardOptionLabel,
  paymentMethodSelect:
    stepTwoLabels.paymentMethodSelectLabel ||
    BUSINESS_STEP_TWO_DEFAULT_LABELS.paymentMethodSelectLabel,
  prepaidAvailableBalance:
    stepTwoLabels.prepaidAvailableBalanceLabel ||
    BUSINESS_STEP_TWO_DEFAULT_LABELS.prepaidAvailableBalanceLabel,
  creditAvailableBalance:
    stepTwoLabels.creditAvailableBalanceLabel ||
    BUSINESS_STEP_TWO_DEFAULT_LABELS.creditAvailableBalanceLabel,
  prepaidDiscount:
    stepTwoLabels.prepaidDiscountLabel || BUSINESS_STEP_TWO_DEFAULT_LABELS.prepaidDiscountLabel,
  prepaidAmountDue:
    stepTwoLabels.prepaidAmountDueLabel || BUSINESS_STEP_TWO_DEFAULT_LABELS.prepaidAmountDueLabel,
  stalePayment:
    stepTwoLabels.staleBusinessPaymentMessage ||
    BUSINESS_STEP_TWO_DEFAULT_LABELS.staleBusinessPaymentMessage,
});

type Props = {
  personalInformation?: PersonalInformation;
};

type CheckoutPaymentMethod = PAYMENT_METHODS | BUSINESS_PAYMENT_METHODS;

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
  const isBusinessBuyer = useIsBusinessBuyer();
  const { ensureTaxedCart, hasTaxedTotal, isEnsuringTax } = useEnsureBusinessCartTax();
  const {
    isPrepaidEligible,
    isCreditEligible,
    prepaidBalance,
    creditLimit,
    availableCredit,
    prepaidDiscount,
    prepaidAmountDue,
    recheckMethod,
  } = useBusinessPaymentEligibility();

  const [paymentMethod, setPaymentMethod] = useState<CheckoutPaymentMethod>();
  const [isStripeFormComplete, setIsStripeFormComplete] = useState(false);
  const [isOrderSubmitted, setIsOrderSubmitted] = useState<boolean>(false);
  const [staleBusinessPaymentMessage, setStaleBusinessPaymentMessage] = useState<string>();

  const copy = businessPaymentCopy(stepTwoLabels);

  const defaultBillingCountry = personalInformation?.billingAddress?.countryCode || 'US';
  const currencySymbol = activeCart.computed.currencySymbol;
  const isBusinessMethodSelected = isBusinessAccountPaymentMethod(paymentMethod);
  const showBusinessPaymentDropdown = isBusinessBuyer && !isFreeOrder;

  const paymentMethodOptions = useMemo(() => {
    if (!showBusinessPaymentDropdown) {
      return [];
    }

    const options: { value: CheckoutPaymentMethod; label: string }[] = [];

    if (!isStripeInfoIncomplete) {
      options.push({ value: PAYMENT_METHODS.STRIPE, label: copy.creditCard });
    }

    if (isPrepaidEligible) {
      options.push({
        value: BUSINESS_PAYMENT_METHODS.PREPAID_ACCOUNT,
        label: copy.prepaidAccount,
      });
    }

    if (isCreditEligible) {
      options.push({
        value: BUSINESS_PAYMENT_METHODS.PREAPPROVED_CREDIT,
        label: copy.preapprovedCredit,
      });
    }

    if (!isPaypalInfoIncomplete) {
      options.push({
        value: PAYMENT_METHODS.PAYPAL,
        label: stepTwoLabels.paypalRadioButtonLabel,
      });
    }

    return options;
  }, [
    copy,
    isCreditEligible,
    isPaypalInfoIncomplete,
    isPrepaidEligible,
    isStripeInfoIncomplete,
    showBusinessPaymentDropdown,
    stepTwoLabels.paypalRadioButtonLabel,
  ]);

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

  const selectPaymentMethod = useCallback(
    (method: CheckoutPaymentMethod) => {
      setHasPaymentError(false);
      setStaleBusinessPaymentMessage(undefined);
      setPaymentMethod(method);
    },
    [setHasPaymentError]
  );

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
      setStaleBusinessPaymentMessage(undefined);
      setPaymentMethod(PAYMENT_METHODS.FREE);
      setIsOrderSubmitted(true);

      validateOrder({ paymentMethod: PAYMENT_METHODS.FREE });
    },
    [setHasPaymentError, validateOrder]
  );

  const onBusinessFormSubmit = useCallback(
    async (ev: FormEvent) => {
      ev.preventDefault();
      setHasPaymentError(false);
      setStaleBusinessPaymentMessage(undefined);

      if (isConfirmingPayment || isFreeOrder || !isBusinessAccountPaymentMethod(paymentMethod)) {
        setHasPaymentError(true);
        setIsOrderSubmitted(false);
        return;
      }

      setIsOrderSubmitted(true);

      const stillEligible = await recheckMethod(paymentMethod);

      if (!stillEligible) {
        setHasPaymentError(true);
        setStaleBusinessPaymentMessage(copy.stalePayment);
        setIsOrderSubmitted(false);
        setPaymentMethod(undefined);
        return;
      }

      validateOrder({ paymentMethod });
    },
    [
      isConfirmingPayment,
      isFreeOrder,
      paymentMethod,
      recheckMethod,
      copy.stalePayment,
      setHasPaymentError,
      validateOrder,
    ]
  );

  const onStripeFormSubmit = useCallback(
    async (ev: FormEvent) => {
      ev.preventDefault();
      setHasPaymentError(false);
      setStaleBusinessPaymentMessage(undefined);
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
    setStaleBusinessPaymentMessage(undefined);
    if (isConfirmingPayment) {
      return;
    }

    clearStripeData();
    setPaymentMethod(PAYMENT_METHODS.PAYPAL);
  }, [setHasPaymentError, isConfirmingPayment, clearStripeData]);

  const onFormSubmit = isFreeOrder
    ? onFreeOrderFormSubmit
    : isBusinessMethodSelected
    ? onBusinessFormSubmit
    : onStripeFormSubmit;

  const isBusy = isRecalculating || isEnsuringTax || isConfirmingPayment || isOrderSubmitted;
  const didEnsureTaxRef = useRef(false);

  useEffect(() => {
    if (!isBusinessBuyer || hasTaxedTotal || isEnsuringTax || !personalInformation) {
      return;
    }

    if (didEnsureTaxRef.current) {
      return;
    }

    didEnsureTaxRef.current = true;
    ensureTaxedCart(personalInformation);
  }, [ensureTaxedCart, hasTaxedTotal, isBusinessBuyer, isEnsuringTax, personalInformation]);

  useEffect(() => {
    const prepaidGone =
      paymentMethod === BUSINESS_PAYMENT_METHODS.PREPAID_ACCOUNT && !isPrepaidEligible;
    const creditGone =
      paymentMethod === BUSINESS_PAYMENT_METHODS.PREAPPROVED_CREDIT && !isCreditEligible;

    if (!prepaidGone && !creditGone) {
      return;
    }

    setHasPaymentError(true);
    setStaleBusinessPaymentMessage(copy.stalePayment);
    setPaymentMethod(undefined);
  }, [copy.stalePayment, isCreditEligible, isPrepaidEligible, paymentMethod, setHasPaymentError]);

  useEffect(() => {
    if (!showBusinessPaymentDropdown || paymentMethodOptions.length === 0) {
      return;
    }

    const isCurrentAvailable = paymentMethodOptions.some(
      (option) => option.value === paymentMethod
    );

    if (!isCurrentAvailable) {
      setPaymentMethod(paymentMethodOptions[0].value);
    }
  }, [paymentMethod, paymentMethodOptions, showBusinessPaymentDropdown]);

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

  const stripePaymentFields = !isFreeOrder && !isStripeInfoIncomplete && (
    <PaymentElement
      className="bg-gray-10 p-5"
      onFocus={() => {
        selectPaymentMethod(PAYMENT_METHODS.STRIPE);
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
  );

  const paypalPaymentFields = !isFreeOrder && !isPaypalInfoIncomplete && (
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
  );

  return (
    <form className="w-full space-y-5" onSubmit={onFormSubmit}>
      <label className="headline-s">{stepTwoLabels.stepTitle}</label>

      {staleBusinessPaymentMessage && (
        <p className="body-s text-red-warning m-0">{staleBusinessPaymentMessage}</p>
      )}

      {showBusinessPaymentDropdown ? (
        <>
          <div className="w-full">
            <label className="body-s text-black mb-1 block" htmlFor="business-payment-method">
              {copy.paymentMethodSelect}
            </label>
            <select
              id="business-payment-method"
              className="border border-black h-13 rounded-lg w-full text-gray-70 px-3 body-s outline-isc2-green focus:ring-isc2-green focus:border-isc2-green"
              value={paymentMethod || ''}
              disabled={isBusy}
              onChange={(event) => {
                const nextMethod = event.target.value as CheckoutPaymentMethod;
                clearStripeData();
                selectPaymentMethod(nextMethod);
              }}
            >
              {paymentMethodOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {paymentMethod === PAYMENT_METHODS.STRIPE && stripePaymentFields}

          {paymentMethod === BUSINESS_PAYMENT_METHODS.PREPAID_ACCOUNT && isPrepaidEligible && (
            <div className="space-y-2">
              <p className="body-s text-gray-70 m-0">{copy.prepaidAccountDescription}</p>
              {SHOW_BUSINESS_PAYMENT_TEST_DETAILS && (
                <BusinessPrepaidTestDetails
                  balance={prepaidBalance}
                  currencySymbol={currencySymbol}
                  discount={prepaidDiscount}
                  amountDue={prepaidAmountDue}
                />
              )}
            </div>
          )}

          {paymentMethod === BUSINESS_PAYMENT_METHODS.PREAPPROVED_CREDIT && isCreditEligible && (
            <div className="space-y-2">
              <p className="body-s text-gray-70 m-0">{copy.preapprovedCreditDescription}</p>
              {SHOW_BUSINESS_PAYMENT_TEST_DETAILS && (
                <BusinessCreditTestDetails
                  creditLimit={creditLimit}
                  availableCredit={availableCredit}
                  currencySymbol={currencySymbol}
                />
              )}
            </div>
          )}

          {paymentMethod === PAYMENT_METHODS.PAYPAL && paypalPaymentFields}
        </>
      ) : (
        <>
          {isPrepaidEligible && (
            <BusinessAccountPaymentMethod
              title={copy.prepaidAccount}
              balanceLabel={copy.prepaidAvailableBalance}
              balance={prepaidBalance}
              currencySymbol={currencySymbol}
              isActive={paymentMethod === BUSINESS_PAYMENT_METHODS.PREPAID_ACCOUNT}
              discount={prepaidDiscount}
              discountLabel={copy.prepaidDiscount}
              amountDue={prepaidAmountDue}
              amountDueLabel={copy.prepaidAmountDue}
              onSelect={() => {
                clearStripeData();
                selectPaymentMethod(BUSINESS_PAYMENT_METHODS.PREPAID_ACCOUNT);
              }}
            />
          )}

          {isCreditEligible && (
            <BusinessAccountPaymentMethod
              title={copy.preapprovedCredit}
              balanceLabel={copy.creditAvailableBalance}
              balance={availableCredit}
              currencySymbol={currencySymbol}
              isActive={paymentMethod === BUSINESS_PAYMENT_METHODS.PREAPPROVED_CREDIT}
              onSelect={() => {
                clearStripeData();
                selectPaymentMethod(BUSINESS_PAYMENT_METHODS.PREAPPROVED_CREDIT);
              }}
            />
          )}

          {!isFreeOrder && !isStripeInfoIncomplete && (
            <PaymentMethodSection
              title={stepTwoLabels.stripeRadioButtonLabel}
              isActive={paymentMethod === PAYMENT_METHODS.STRIPE}
            >
              {stripePaymentFields}
            </PaymentMethodSection>
          )}

          {!isFreeOrder && !isPaypalInfoIncomplete && (
            <PaymentMethodSection
              title={stepTwoLabels.paypalRadioButtonLabel}
              isActive={paymentMethod === PAYMENT_METHODS.PAYPAL}
            >
              {paypalPaymentFields}
            </PaymentMethodSection>
          )}
        </>
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
          disabled={isBusy}
          onClick={onGoBackButtonClick}
          label={stepTwoLabels.previousStepCtaLabel}
        />

        {paymentMethod !== PAYMENT_METHODS.PAYPAL && (
          <Button
            type="submit"
            variant="primary"
            disabled={
              isBusy || (!isBusinessMethodSelected && !isFreeOrder && isGettingPaymentIntent)
            }
            isLoading={
              isBusy || (!isBusinessMethodSelected && !isFreeOrder && isGettingPaymentIntent)
            }
            label={fields.confirmPurchaseCta.value.text!}
          />
        )}
      </footer>
    </form>
  );
}

type BusinessAccountPaymentDetailsProps = {
  balanceLabel: string;
  balance?: number;
  currencySymbol?: string;
  discount?: number;
  discountLabel?: string;
  amountDue?: number;
  amountDueLabel?: string;
};

const formatAccountBalance = (balance: number | null | undefined, currencySymbol?: string) => {
  if (typeof balance !== 'number' || !Number.isFinite(balance)) {
    return '—';
  }

  const amount = balance.toFixed(2);

  return currencySymbol ? `${currencySymbol} ${amount}` : amount;
};

/** Temporary checkout test block. Hidden when SHOW_BUSINESS_PAYMENT_TEST_DETAILS is false. */
function BusinessCreditTestDetails({
  creditLimit,
  availableCredit,
  currencySymbol,
}: Readonly<{
  creditLimit?: number;
  availableCredit?: number;
  currencySymbol?: string;
}>) {
  return (
    <div className="space-y-1">
      <p className="body-s text-gray-70 m-0">
        Credit limit: {formatAccountBalance(creditLimit, currencySymbol)}
      </p>
      <p className="body-s text-gray-70 m-0">
        Available credit: {formatAccountBalance(availableCredit, currencySymbol)}
      </p>
    </div>
  );
}

/** Temporary checkout test block. Hidden when SHOW_BUSINESS_PAYMENT_TEST_DETAILS is false. */
function BusinessPrepaidTestDetails({
  balance,
  currencySymbol,
  discount,
  amountDue,
}: Readonly<{
  balance?: number;
  currencySymbol?: string;
  discount?: number;
  amountDue?: number;
}>) {
  const discountPercent =
    typeof discount === 'number' && Number.isFinite(discount) && discount > 0 ? discount : 0;

  return (
    <div className="space-y-1">
      <p className="body-s text-gray-70 m-0">
        Available prepaid balance: {formatAccountBalance(balance, currencySymbol)}
      </p>
      <p className="body-s text-gray-70 m-0">Discount: {discountPercent}%</p>
      <p className="body-s text-gray-70 m-0">
        Amount due with prepaid: {formatAccountBalance(amountDue, currencySymbol)}
      </p>
    </div>
  );
}

function BusinessAccountPaymentDetails({
  balanceLabel,
  balance,
  currencySymbol,
  discount,
  discountLabel,
  amountDue,
  amountDueLabel,
}: Readonly<BusinessAccountPaymentDetailsProps>) {
  const formattedBalance = formatAccountBalance(balance, currencySymbol);
  const formattedAmountDue = formatAccountBalance(amountDue, currencySymbol);
  const showDiscount = typeof discount === 'number' && Number.isFinite(discount) && discount > 0;

  return (
    <div className="space-y-1">
      <p className="body-s text-gray-70 m-0">
        {balanceLabel}: {formattedBalance}
      </p>
      {showDiscount && discountLabel && (
        <p className="body-s text-gray-70 m-0">
          {discountLabel}: {discount}%
        </p>
      )}
      {showDiscount && amountDueLabel && (
        <p className="body-s text-gray-70 m-0">
          {amountDueLabel}: {formattedAmountDue}
        </p>
      )}
    </div>
  );
}

type BusinessAccountPaymentMethodProps = BusinessAccountPaymentDetailsProps & {
  title: string;
  isActive: boolean;
  onSelect: () => void;
};

function BusinessAccountPaymentMethod({
  title,
  isActive,
  onSelect,
  ...details
}: Readonly<BusinessAccountPaymentMethodProps>) {
  return (
    <PaymentMethodSection title={title} isActive={isActive}>
      <button type="button" className="w-full text-left" onClick={onSelect}>
        <BusinessAccountPaymentDetails {...details} />
      </button>
    </PaymentMethodSection>
  );
}
