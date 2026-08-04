import { Control } from 'react-hook-form';
 
import { Country, PersonalInformation, State, StepOneLabels } from 'types/index';
import { FormDropdown, FormTextInput } from 'ui/index';
 
type AddressPrefix = 'billingAddress' | 'mailingAddress';
 
type AddressLabels = {
  addressLineOneLabel: string;
  addressLineOneTooltip: string;
  addressLineTwoLabel: string;
  cityLabel: string;
  cityTooltip: string;
  stateLabel: string;
  stateTooltip: string;
  countryLabel: string;
  countryTooltip: string;
  zipCodeLabel: string;
  zipCodeTooltip: string;
};
 
type BusinessAddressFieldsProps = {
  control: Control<PersonalInformation>;
  prefix: AddressPrefix;
  labels: AddressLabels;
  countries?: Country[] | null;
  states: State[];
  disabled?: boolean;
  isPostalCodeRequired?: boolean;
  onCountryChanged?: (countryCode: string) => void;
};
 
/**
 * Address block in the order the business buyer purchase information design uses:
 * Address 1 / Address 2, City / State, Country / Zip Code.
 */
export default function BusinessAddressFields({
  control,
  prefix,
  labels,
  countries,
  states,
  disabled,
  isPostalCodeRequired,
  onCountryChanged,
}: BusinessAddressFieldsProps) {
  return (
    <div className="flex flex-col gap-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <FormTextInput
          control={control}
          name={`${prefix}.street`}
          label={labels.addressLineOneLabel}
          tooltipText={labels.addressLineOneTooltip}
          disabled={disabled}
          maxLength={255}
        />
 
        <FormTextInput
          isOptional
          control={control}
          name={`${prefix}.streetTwo`}
          label={labels.addressLineTwoLabel}
          disabled={disabled}
          maxLength={255}
        />
      </div>
 
      <div className="grid sm:grid-cols-2 gap-4">
        <FormTextInput
          control={control}
          name={`${prefix}.city`}
          label={labels.cityLabel}
          tooltipText={labels.cityTooltip}
          disabled={disabled}
          maxLength={40}
        />
 
        {states.length > 0 && (
          <FormDropdown
            control={control}
            name={`${prefix}.stateCode`}
            options={states}
            valueProp="stateCode"
            textProp="stateName"
            label={labels.stateLabel}
            tooltipText={labels.stateTooltip}
            disabled={disabled}
            maxLength={40}
            isOptional={false}
          />
        )}
      </div>
 
      <div className="grid sm:grid-cols-2 gap-4">
        <FormDropdown
          control={control}
          name={`${prefix}.countryCode`}
          options={countries}
          valueProp="countryCode"
          textProp="countryName"
          onChange={onCountryChanged}
          label={labels.countryLabel}
          tooltipText={labels.countryTooltip}
          disabled={disabled}
          maxLength={80}
        />
 
        <FormTextInput
          control={control}
          name={`${prefix}.postalCode`}
          label={labels.zipCodeLabel}
          tooltipText={labels.zipCodeTooltip}
          disabled={disabled}
          maxLength={20}
          isOptional={!isPostalCodeRequired}
        />
      </div>
    </div>
  );
}
 
export const getMailingAddressLabels = (stepOneLabels: StepOneLabels): AddressLabels => ({
  addressLineOneLabel: stepOneLabels.shippingAddressLineOneLabel,
  addressLineOneTooltip: stepOneLabels.shippingAddressLineOneTooltip,
  addressLineTwoLabel: stepOneLabels.shippingAddressLineTwoLabel,
  cityLabel: stepOneLabels.shippingCityLabel,
  cityTooltip: stepOneLabels.shippingCityTooltip,
  stateLabel: stepOneLabels.shippingStateLabel,
  stateTooltip: stepOneLabels.shippingStateTooltip,
  countryLabel: stepOneLabels.shippingCountryLabel,
  countryTooltip: stepOneLabels.shippingCountryTooltip,
  zipCodeLabel: stepOneLabels.shippingZipCodeLabel,
  zipCodeTooltip: stepOneLabels.shippingZipCodeTooltip,
});
 
export const getBillingAddressLabels = (stepOneLabels: StepOneLabels): AddressLabels => ({
  addressLineOneLabel: stepOneLabels.addressLineOneLabel,
  addressLineOneTooltip: stepOneLabels.addressLineOneTooltip,
  addressLineTwoLabel: stepOneLabels.addressLineTwoLabel,
  cityLabel: stepOneLabels.cityLabel,
  cityTooltip: stepOneLabels.cityTooltip,
  stateLabel: stepOneLabels.stateLabel,
  stateTooltip: stepOneLabels.stateTooltip,
  countryLabel: stepOneLabels.countryLabel,
  countryTooltip: stepOneLabels.countryTooltip,
  zipCodeLabel: stepOneLabels.zipCodeLabel,
  zipCodeTooltip: stepOneLabels.zipCodeTooltip,
});