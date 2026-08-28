/* eslint-disable @typescript-eslint/no-empty-function */
import { BUSINESS_STEP_ONE_DEFAULT_LABELS, CHECKOUT_STEPS } from 'constants/checkout';
import { createContext, Dispatch, SetStateAction, useContext, useMemo, useState } from 'react';

import { useIsBusinessBuyer } from 'hooks/index';
import { useCart } from './cart';

import {
  CheckoutFields,
  CheckoutStep,
  ErrorLabels,
  QuoteDocumentLabels,
  ServiceLayerError,
  StepOneLabels,
  StepTwoLabels,
  TaxErrorPopupLabels,
} from 'types/index';
import { parseFieldsFromURLString } from 'utils/index';

type CheckoutContextProps = {
  fields: CheckoutFields;
  checkoutSteps: CheckoutStep[];
  stepOneLabels: StepOneLabels;
  stepTwoLabels: StepTwoLabels;
  quoteLabels: QuoteDocumentLabels;
  setQuoteLabels: Dispatch<SetStateAction<QuoteDocumentLabels>>;
  errorLabels: ErrorLabels;
  activeStep: CheckoutStep['id'];
  setActiveStep: Dispatch<SetStateAction<CheckoutStep['id']>>;
  errorState: ServiceLayerError[] | null;
  setErrorState: Dispatch<SetStateAction<ServiceLayerError[] | string | null>>;
  taxErrorLabels: TaxErrorPopupLabels;
  setTaxErrorLabels: Dispatch<SetStateAction<TaxErrorPopupLabels>>;
  hasPaymentError: boolean;
  setHasPaymentError: Dispatch<SetStateAction<boolean>>;
  hasInventoryError: boolean;
  setHasInventoryError: Dispatch<SetStateAction<boolean>>;
};

const CheckoutProcessContext = createContext<CheckoutContextProps>({
  fields: {} as CheckoutFields,
  checkoutSteps: [],
  stepOneLabels: {} as StepOneLabels,
  stepTwoLabels: {} as StepTwoLabels,
  quoteLabels: {} as QuoteDocumentLabels,
  setQuoteLabels: () => {},
  errorLabels: {} as ErrorLabels,
  activeStep: CHECKOUT_STEPS.PERSONAL_INFORMATION,
  setActiveStep: () => {},
  errorState: null,
  setErrorState: () => {},
  taxErrorLabels: {} as TaxErrorPopupLabels,
  setTaxErrorLabels: () => {},
  hasPaymentError: false,
  setHasPaymentError: () => {},
  hasInventoryError: false,
  setHasInventoryError: () => {},
});

type CheckoutProcessProviderProps = {
  fields: CheckoutFields;
  children: React.ReactNode;
};

const CheckoutProcessProvider: React.FC<CheckoutProcessProviderProps> = ({ fields, children }) => {
  const isBusinessBuyer = useIsBusinessBuyer();
  const { isFreeOrder } = useCart();

  const [activeStep, setActiveStep] = useState<CheckoutStep['id']>(
    CHECKOUT_STEPS.PERSONAL_INFORMATION
  );

  const [taxErrorLabels, setTaxErrorLabels] = useState<TaxErrorPopupLabels>({
    heading: null,
    description: null,
    caption: null,
    errorMessages: null,
    retryCtaLabel: null,
  });
  const stepOneLabels = useMemo(
    () => parseFieldsFromURLString<StepOneLabels>(fields.stepOneLabelsTooltipsAndMore),
    [fields.stepOneLabelsTooltipsAndMore]
  );

  const stepTwoLabels = useMemo(
    () => parseFieldsFromURLString<StepTwoLabels>(fields.stepTwoLabelsTooltipsAndMore),
    [fields.stepTwoLabelsTooltipsAndMore]
  );
  const [quoteLabels, setQuoteLabels] = useState<QuoteDocumentLabels>({});

  const errorLabels = useMemo(
    () => parseFieldsFromURLString<ErrorLabels>(fields.errorLabels),
    [fields.errorLabels]
  );

  // A business buyer's $0.00 cart goes straight from step one to the confirmation page,
  // so the payment step is not part of the flow. It stays listed if it is somehow the
  // active step (e.g. the total stopped being free), since the indicator needs it.
  const isPaymentStepSkipped =
    isBusinessBuyer && isFreeOrder && activeStep !== CHECKOUT_STEPS.PAYMENT_INFORMATION;

  const checkoutSteps: CheckoutStep[] = useMemo(
    () => [
      {
        id: CHECKOUT_STEPS.PERSONAL_INFORMATION,
        label: isBusinessBuyer
          ? stepOneLabels.businessStepTitle || BUSINESS_STEP_ONE_DEFAULT_LABELS.stepTitle
          : stepOneLabels.stepTitle,
      },
      ...(isPaymentStepSkipped
        ? []
        : [{ id: CHECKOUT_STEPS.PAYMENT_INFORMATION, label: stepTwoLabels.stepTitle }]),
    ],
    [
      isBusinessBuyer,
      isPaymentStepSkipped,
      stepOneLabels.businessStepTitle,
      stepOneLabels.stepTitle,
      stepTwoLabels.stepTitle,
    ]
  );

  const [errorState, setErrorState] = useState<ServiceLayerError[] | null>(null);
  const [hasPaymentError, setHasPaymentError] = useState<boolean>(false);
  const [hasInventoryError, setHasInventoryError] = useState<boolean>(false);

  return (
    <CheckoutProcessContext.Provider
      value={{
        fields,
        activeStep,
        checkoutSteps,
        setActiveStep,
        stepOneLabels,
        stepTwoLabels,
        quoteLabels,
        setQuoteLabels,
        errorLabels,
        errorState,
        setErrorState,
        taxErrorLabels,
        setTaxErrorLabels,
        hasPaymentError,
        setHasPaymentError,
        hasInventoryError,
        setHasInventoryError,
      }}
    >
      {children}
    </CheckoutProcessContext.Provider>
  );
};

const useCheckoutProcess = () => useContext(CheckoutProcessContext);

export { CheckoutProcessProvider, useCheckoutProcess };
