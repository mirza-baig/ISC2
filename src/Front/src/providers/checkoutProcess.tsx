/* eslint-disable @typescript-eslint/no-empty-function */
import {
  BUSINESS_STEP_ONE_DEFAULT_LABELS,
  CHECKOUT_STEPS,
  type CheckoutPaymentMethod,
} from 'constants/checkout';
import {
  createContext,
  Dispatch,
  MutableRefObject,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useIsBusinessBuyer, useLoggedUser } from 'hooks/index';

import {
  CheckoutFields,
  CheckoutStep,
  ErrorLabels,
  PersonalInformation,
  QuoteDocumentLabels,
  ServiceLayerError,
  StepOneLabels,
  StepTwoLabels,
  TaxErrorPopupLabels,
} from 'types/index';
import { parseFieldsFromURLString, storeCheckoutBillingAddress } from 'utils/index';

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
  selectedPaymentMethod?: CheckoutPaymentMethod;
  setSelectedPaymentMethod: Dispatch<SetStateAction<CheckoutPaymentMethod | undefined>>;
  /** Step one data, completed or seeded from the profile. Lives here so it outlives a
   * remount of the step components (a refreshed payment intent re-keys their providers). */
  personalInformation?: PersonalInformation;
  setPersonalInformation: (data: PersonalInformation) => void;
  /** Values typed into step one but not submitted yet, snapshotted on unmount. */
  personalInformationDraft: MutableRefObject<PersonalInformation | undefined>;
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
  selectedPaymentMethod: undefined,
  setSelectedPaymentMethod: () => {},
  personalInformation: undefined,
  setPersonalInformation: () => {},
  personalInformationDraft: { current: undefined },
});

type CheckoutProcessProviderProps = {
  fields: CheckoutFields;
  children: React.ReactNode;
};

const CheckoutProcessProvider: React.FC<CheckoutProcessProviderProps> = ({ fields, children }) => {
  const isBusinessBuyer = useIsBusinessBuyer();
  const { userPersonalInformation } = useLoggedUser();

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

  const checkoutSteps: CheckoutStep[] = useMemo(
    () => [
      {
        id: CHECKOUT_STEPS.PERSONAL_INFORMATION,
        label: isBusinessBuyer
          ? stepOneLabels.businessStepTitle || BUSINESS_STEP_ONE_DEFAULT_LABELS.stepTitle
          : stepOneLabels.stepTitle,
      },
      { id: CHECKOUT_STEPS.PAYMENT_INFORMATION, label: stepTwoLabels.stepTitle },
    ],
    [
      isBusinessBuyer,
      stepOneLabels.businessStepTitle,
      stepOneLabels.stepTitle,
      stepTwoLabels.stepTitle,
    ]
  );

  const [activeStep, setActiveStep] = useState<CheckoutStep['id']>(checkoutSteps[0].id);
  const [errorState, setErrorState] = useState<ServiceLayerError[] | null>(null);
  const [personalInformation, setPersonalInformationState] = useState<
    PersonalInformation | undefined
  >(userPersonalInformation);
  const personalInformationDraft = useRef<PersonalInformation | undefined>(undefined);

  // The profile lands after this provider mounts, so seed step one when it arrives — but
  // never overwrite information the buyer has already gone through the step with.
  useEffect(() => {
    if (!userPersonalInformation) {
      return;
    }

    setPersonalInformationState((current) => current ?? userPersonalInformation);
  }, [userPersonalInformation]);

  const setPersonalInformation = useCallback((data: PersonalInformation) => {
    personalInformationDraft.current = data;
    setPersonalInformationState(data);
    // Kept for the confirmation screen: the receipt falls back to it when the order comes
    // back from commercetools without an address.
    storeCheckoutBillingAddress(data.billingAddress);
  }, []);
  const [hasPaymentError, setHasPaymentError] = useState<boolean>(false);
  const [hasInventoryError, setHasInventoryError] = useState<boolean>(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    CheckoutPaymentMethod | undefined
  >();

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
        selectedPaymentMethod,
        setSelectedPaymentMethod,
        personalInformation,
        setPersonalInformation,
        personalInformationDraft,
      }}
    >
      {children}
    </CheckoutProcessContext.Provider>
  );
};

const useCheckoutProcess = () => useContext(CheckoutProcessContext);

export { CheckoutProcessProvider, useCheckoutProcess };
