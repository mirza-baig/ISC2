import { Control } from 'react-hook-form';

import { Country, ProfileFormSections, State } from 'types/index';
import { FormTextInput, FormDropdown } from 'ui/index';

import { AddressInformationLabels } from '../../profile.types';

export namespace MailingAddressForm {
  export type Props = {
    labels: AddressInformationLabels;
    control: Control<ProfileFormSections>;
    countries: Country[];
    states: State[];
    onCountryChanged: (isBillingCountry: boolean, value: string) => void;
    isUpdatingUser: boolean;
    isPostalCodeRequired: boolean;
  };
}

export const MailingAddressForm = (props: MailingAddressForm.Props) => {
  return (
    <>
      <h5 className="body-m font-bold">{props.labels.mailingAddressText}</h5>

      <FormTextInput
        control={props.control}
        name="mailingAddress.street"
        label={props.labels.addressLabel}
        tooltipText={props.labels.addressTooltip}
        disabled={props.isUpdatingUser}
        maxLength={255}
      />

      <FormDropdown
        control={props.control}
        options={props.countries}
        onChange={props.onCountryChanged.bind(null, false)}
        name="mailingAddress.countryCode"
        valueProp="countryCode"
        textProp="countryName"
        label={props.labels.countryLabel}
        tooltipText={props.labels.countryTooltip}
        disabled={props.isUpdatingUser}
        maxLength={80}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
        {props.states.length > 0 && (
          <FormDropdown
            control={props.control}
            name="mailingAddress.stateCode"
            options={props.states}
            valueProp="stateCode"
            textProp="stateName"
            label={props.labels.stateProvinceLabel}
            tooltipText={props.labels.stateProvinceTooltip}
            disabled={props.isUpdatingUser}
            maxLength={40}
            isOptional={false}
          />
        )}

        <FormTextInput
          control={props.control}
          name="mailingAddress.city"
          label={props.labels.cityLabel}
          tooltipText={props.labels.cityTooltip}
          disabled={props.isUpdatingUser}
          maxLength={40}
        />

        <FormTextInput
          control={props.control}
          name="mailingAddress.postalCode"
          label={props.labels.zipCodeLabel}
          tooltipText={props.labels.zipCodeTooltip}
          disabled={props.isUpdatingUser}
          maxLength={20}
          isOptional={!props.isPostalCodeRequired}
        />
      </div>
    </>
  );
};
