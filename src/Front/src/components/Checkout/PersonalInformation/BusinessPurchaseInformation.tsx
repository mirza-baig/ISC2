import { Control } from 'react-hook-form';
 
import { Country, PersonalInformation, State, StepOneLabels } from 'types/index';
import { FormCheckbox, FormDateInput, FormFileInput, FormTextInput } from 'ui/index';
import {
  CUSTOMER_ORDER_REFERENCE_MAX_LENGTH,
  PO_NUMBER_MAX_LENGTH,
} from 'constants/index';
import BusinessAddressFields, { getBillingAddressLabels, getMailingAddressLabels } from './BusinessAddressFields';
 
 
type BusinessPurchaseInformationProps = {
  control: Control<PersonalInformation>;
  stepOneLabels: StepOneLabels;
  termsAndConditionsLabel: string;
  countries?: Country[] | null;
  billingStates: State[];
  mailingStates: State[];
  isSameAddress: boolean;
  isSubmitting: boolean;
  isPoRequired: boolean;
  isPoAttachmentRequired: boolean;
  isCourseDeliveryDateRequired: boolean;
  isBillingPostalCodeRequired: boolean;
  isMailingPostalCodeRequired: boolean;
  onBillingCountryChanged: (countryCode: string) => void;
};
 
/**
 * Checkout step one for business buyers.
 *
 * Read-only fields come from the buyer's contact (name, email) and the active business
 * account (company name, shipping address). The billing address stays editable so an
 * expense card's billing details can be matched, and PO / order reference / course
 * delivery date collect the purchase details the account requires.
 */
export default function BusinessPurchaseInformation({
  control,
  stepOneLabels,
  termsAndConditionsLabel,
  countries,
  billingStates,
  mailingStates,
  isSameAddress,
  isSubmitting,
  isPoRequired,
  isPoAttachmentRequired,
  isCourseDeliveryDateRequired,
  isBillingPostalCodeRequired,
  isMailingPostalCodeRequired,
  onBillingCountryChanged,
}: Readonly<BusinessPurchaseInformationProps>) {
  return (
    <>
      <div className="grid lg:grid-cols-2 gap-x-8 gap-y-4">
        <div className="flex flex-col gap-y-4">
          <p className="text-black body-m">
            {stepOneLabels.companyInformationTitle || ''}
          </p>
 
          <FormTextInput
            name="employer"
            control={control}
            label={stepOneLabels.companyNameLabel}
            maxLength={80}
            disabled
          />
 
          <FormTextInput
            name="poNumber"
            control={control}
            label={stepOneLabels.poNumberLabel || ''}
            maxLength={PO_NUMBER_MAX_LENGTH}
            disabled={isSubmitting}
            isOptional={!isPoRequired}
          />
 
          <FormFileInput
            name="poAttachment"
            control={control}
            label={
              stepOneLabels.poAttachmentLabel || ''
            }
            disabled={isSubmitting}
            isOptional={!isPoAttachmentRequired}
          />
 
          <FormTextInput
            isOptional
            showTooltipWhenOptional
            name="customerOrderReference"
            control={control}
            label={
              stepOneLabels.customerOrderReferenceLabel || ''
            }
            tooltipText={
              stepOneLabels.customerOrderReferenceTooltip || ''
            }
            maxLength={CUSTOMER_ORDER_REFERENCE_MAX_LENGTH}
            disabled={isSubmitting}
          />
 
          {isCourseDeliveryDateRequired && (
            <FormDateInput
              name="courseDeliveryDate"
              control={control}
              label={
                stepOneLabels.courseDeliveryDateLabel || ''
              }
              tooltipText={
                stepOneLabels.courseDeliveryDateTooltip || ''
              }
              disabled={isSubmitting}
            />
          )}
        </div>
 
        <div className="flex flex-col gap-y-4">
          <p className="text-black body-m">
            {stepOneLabels.contactInformationTitle || ''}
          </p>
 
          <div className="grid sm:grid-cols-2 gap-4">
            <FormTextInput
              name="firstName"
              control={control}
              label={stepOneLabels.firstNameLabel}
              maxLength={40}
              disabled
            />
            <FormTextInput
              name="lastName"
              control={control}
              label={stepOneLabels.lastNameLabel}
              maxLength={80}
              disabled
            />
          </div>
 
          <FormTextInput
            name="email"
            control={control}
            label={stepOneLabels.emailAddressLabel}
            maxLength={80}
            disabled
          />
 
          <FormTextInput
            isOptional
            type="number"
            name="phoneNumber"
            control={control}
            label={stepOneLabels.phoneNumberLabel}
            maxLength={15}
            disabled={isSubmitting}
          />
        </div>
      </div>
 
      <div className="flex flex-col gap-y-4 mt-6">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <p className="text-black body-m">{stepOneLabels.mailingAddressTitle}</p>
 
          <FormCheckbox
            control={control}
            name="isSameAddress"
            label={stepOneLabels.shippingAddressCheckboxLabel}
            disabled={isSubmitting}
          />
        </div>
 
        <BusinessAddressFields
          disabled
          control={control}
          prefix="mailingAddress"
          labels={getMailingAddressLabels(stepOneLabels)}
          countries={countries}
          states={mailingStates}
          isPostalCodeRequired={isMailingPostalCodeRequired}
        />
      </div>
 
      {!isSameAddress && (
        <div className="flex flex-col gap-y-4 mt-6">
          <p className="text-black body-m">{stepOneLabels.billingAddressTitle}</p>
 
          <BusinessAddressFields
            control={control}
            prefix="billingAddress"
            labels={getBillingAddressLabels(stepOneLabels)}
            countries={countries}
            states={billingStates}
            disabled={isSubmitting}
            isPostalCodeRequired={isBillingPostalCodeRequired}
            onCountryChanged={onBillingCountryChanged}
          />
        </div>
      )}
 
      <div className="my-5">
        <FormCheckbox
          name="agreeTerms"
          control={control}
          label={termsAndConditionsLabel}
          disabled={isSubmitting}
        />
      </div>
    </>
  );
}