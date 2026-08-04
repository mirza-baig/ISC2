import { Field, ImageField, LinkField, RichTextField } from '@sitecore-jss/sitecore-jss-nextjs';
import { CHECKOUT_STEPS, PAYMENT_METHODS } from 'constants/index';
 
export type PaymentIntent = {
  intentPaymentId: string;
  stripeClientSecret: string;
  stripePublishableKey: string;
  braintreeClientSecret?: string;
  branintreePaypalClientId?: string;
};
 
export type CheckoutStep = {
  id: CHECKOUT_STEPS.PERSONAL_INFORMATION | CHECKOUT_STEPS.PAYMENT_INFORMATION;
  label: string;
};
 
export type StepOneLabels = {
  pageHeadline: string;
  stepTitle: string;
  requiredFieldNotice: string;
  requiredErrorMessage: string;
  incorrectPostalCodeMessage: string;
  emailFormatErrorMessage: string;
  firstNameLabel: string;
  firstNameTooltip: string;
  lastNameLabel: string;
  lastNameTooltip: string;
  companyNameLabel: string;
  addressLineOneLabel: string;
  addressLineOneTooltip: string;
  addressLineTwoLabel: string;
  countryLabel: string;
  countryTooltip: string;
  stateLabel: string;
  stateTooltip: string;
  cityLabel: string;
  cityTooltip: string;
  zipCodeLabel: string;
  zipCodeTooltip: string;
  emailAddressLabel: string;
  emailAddressTooltip: string;
  phoneNumberLabel: string;
  nextStepCtaLabel: string;
  shippingAddressCheckboxLabel: string;
  shippingAddressLineOneLabel: string;
  shippingAddressLineOneTooltip: string;
  shippingAddressLineTwoLabel: string;
  shippingCountryLabel: string;
  shippingCountryTooltip: string;
  shippingStateLabel: string;
  shippingStateTooltip: string;
  shippingCityLabel: string;
  shippingCityTooltip: string;
  shippingZipCodeLabel: string;
  shippingZipCodeTooltip: string;
  mailingAddressTitle: string;
  billingAddressTitle: string;
  /**
   * Business buyer copy. Optional because the keys are added to the Sitecore field per
   * environment; BUSINESS_STEP_ONE_DEFAULT_LABELS supplies the value until they are.
   */
  businessPageHeadline?: string;
  businessStepTitle?: string;
  companyInformationTitle?: string;
  contactInformationTitle?: string;
  poNumberLabel?: string;
  poAttachmentLabel?: string;
  customerOrderReferenceLabel?: string;
  customerOrderReferenceTooltip?: string;
  courseDeliveryDateLabel?: string;
  courseDeliveryDateTooltip?: string;
};
 
export type StepTwoLabels = {
  stepTitle: string;
  stepHeadline: string;
  stripeRadioButtonLabel: string;
  paypalRadioButtonLabel: string;
  previousStepCtaLabel: string;
  confirmPurchaseButtonLabel: string;
  productsNotAvailableModalHeading: string;
  productsNotAvailableModalDescription: string;
  productsNotAvailableModalButtonLabel: string;
  freeOrderLabel: string;
};
 
export type ErrorLabels = {
  title: string;
  subTitle: string;
  tryAgainListTitle: string;
};
 
export type TaxErrorPopupLabels = {
  heading: Field<string> | null;
  description: Field<string> | null;
  caption: Field<string> | null;
  errorMessages: Field<string> | null;
  retryCtaLabel: Field<string> | null;
};
 
export type CheckoutFields = {
  bottomNotice: Field<string>;
  confirmPurchaseCta: LinkField;
  stepOneLabelsTooltipsAndMore: Field<string>;
  stepTwoLabelsTooltipsAndMore: Field<string>;
  termsAndConditionsLabel: Field<string>;
  alertIcon: ImageField;
  errorLabels: Field<string>;
  tryAgainList: RichTextField;
};
 
export type ConfirmPaymentPayload =
  | {
      paymentMethod:
        | PAYMENT_METHODS.FREE
        | PAYMENT_METHODS.STRIPE
        | PAYMENT_METHODS.KLARNA
        | PAYMENT_METHODS.IDEAL
        | PAYMENT_METHODS.BLIK;
    }
  | { paymentMethod: PAYMENT_METHODS.PAYPAL; paymentMethodNonce: string };
 
export type PaymentConfirmationPayload =
  | { intentPaymentId: string; cartID?: string }
  | { paymentMethodNonce: string; cartID?: string };
 
export type PaymentResponse =
  | { status: 'succeeded'; orderPayload: PaymentConfirmationPayload }
  | { status: 'failed'; orderPayload?: PaymentConfirmationPayload };
