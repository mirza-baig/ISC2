import { Control } from 'react-hook-form';

import { Country, ProfileFormSections, State } from 'types/index';
import { FormTextInput, FormCheckbox, FormDropdown } from 'ui/index';

import { AddressInformationLabels } from '../../profile.types';

export namespace BillingAddressForm {
  export type Props = {
    labels: AddressInformationLabels;
    control: Control<ProfileFormSections>;
    countries: Country[];
    states: State[];
    isSameAddress: boolean;
    onCountryChanged: (isBillingCountry: boolean, value: string) => void;
    isUpdatingUser: boolean;
    isPostalCodeRequired: boolean;
  };
}

export const BillingAddressForm = (props: BillingAddressForm.Props) => {
  return (
    <>
      <h5 className="body-m font-bold">{props.labels.billingAddressText}</h5>

      <FormCheckbox
        control={props.control}
        name="isSameAddress"
        label={props.labels.billingAsMailingCheckboxLabel}
        disabled={props.isUpdatingUser}
      />

      {!props.isSameAddress && (
        <>
          <FormTextInput
            control={props.control}
            name="billingAddress.street"
            label={props.labels.billingAddressText}
            tooltipText={props.labels.addressTooltip}
            disabled={props.isUpdatingUser}
            maxLength={255}
          />
          <FormDropdown
            control={props.control}
            options={props.countries}
            onChange={props.onCountryChanged.bind(null, true)}
            name="billingAddress.countryCode"
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
                name="billingAddress.stateCode"
                options={props.states}
                label={props.labels.stateProvinceLabel}
                tooltipText={props.labels.stateProvinceTooltip}
                valueProp="stateCode"
                textProp="stateName"
                disabled={props.isUpdatingUser}
                maxLength={40}
                isOptional={false}
              />
            )}
            <FormTextInput
              control={props.control}
              name="billingAddress.city"
              label={props.labels.cityLabel}
              tooltipText={props.labels.cityTooltip}
              disabled={props.isUpdatingUser}
              maxLength={40}
            />
            <FormTextInput
              control={props.control}
              name="billingAddress.postalCode"
              label={props.labels.zipCodeLabel}
              tooltipText={props.labels.zipCodeTooltip}
              disabled={props.isUpdatingUser}
              maxLength={20}
              isOptional={!props.isPostalCodeRequired}
            />
          </div>
        </>
      )}
    </>
  );
};
