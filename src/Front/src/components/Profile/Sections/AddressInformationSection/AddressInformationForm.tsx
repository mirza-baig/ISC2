import { FieldConditions, useConditionalForm } from 'rhf-conditional-logic';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useMemo, useState } from 'react';

import { ProfileFormSections, AddressInformationSchema, AddressInformation } from 'types/index';
import { getAddressInformationFromUser } from 'utils/index';
import { useGetAllCountries, useGetAllStates, useLoggedUser, useUpdateUserData } from 'hooks/index';

import { BillingAddressForm } from './BillingAddressForm';
import { MailingAddressForm } from './MailingAddressForm';
import { ProfileSectionFooter } from '../../Base/ProfileSectionFooter';
import { AddressInformationLabels, ProfileSectionProps } from '../../profile.types';
import { POSTAL_CODES_PATTERNS } from 'constants/postalCodesPatterns';

export namespace AddressInformationSection {
  export type Props = ProfileSectionProps & {
    labels: AddressInformationLabels;
    onSuccessfulEdit: () => void;
    onErrorEdit: () => void;
  };
}

const FORM_CONDITIONS: FieldConditions<ProfileFormSections> = {
  billingAddress: (getValues) => getValues('isSameAddress') === false,
};

export const AddressInformationForm = (props: AddressInformationSection.Props) => {
  const { user } = useLoggedUser();
  const { allCountries } = useGetAllCountries();
  const { allStates } = useGetAllStates();

  const onSuccessCallback = useCallback(() => {
    props.onSuccessfulEdit();
    props.cancelEditMode();
  }, [props]);

  const { updateUser, isUpdatingUser } = useUpdateUserData({
    onSuccess: onSuccessCallback,
    onError: props.onErrorEdit,
  });

  const {
    control,
    watch,
    setValue,
    getValues,
    handleSubmit,
    formState: { isValid },
  } = useConditionalForm<ProfileFormSections>({
    mode: 'onSubmit',
    conditions: FORM_CONDITIONS,
    defaultValues: getAddressInformationFromUser(user)!,
    resolver: zodResolver(AddressInformationSchema),
  });

  const isSameAddress = watch('isSameAddress');
  const billingCountry = watch('billingAddress.countryCode') ?? '';
  const mailingCountry = watch('mailingAddress.countryCode') ?? '';

  const [isBillingPostalCodeRequired, setIsBillingPostalCodeRequired] = useState<boolean>(
    Boolean(
      POSTAL_CODES_PATTERNS[user?.billingAddress.countryCode as keyof typeof POSTAL_CODES_PATTERNS]
    ) ?? false
  );

  const [isMailingPostalCodeRequired, setIsMailingPostalCodeRequired] = useState<boolean>(
    Boolean(
      POSTAL_CODES_PATTERNS[user?.mailingAddress.countryCode as keyof typeof POSTAL_CODES_PATTERNS]
    ) ?? false
  );

  const [previousBillingStates, setPreviousBillingStates] = useState<Record<string, string>>({});
  const [previousMailingStates, setPreviousMailingStates] = useState<Record<string, string>>({});

  const billingStates = useMemo(
    () => (billingCountry && allStates?.[billingCountry]) || [],
    [allStates, billingCountry]
  );

  const mailingStates = useMemo(
    () => (mailingCountry && allStates?.[mailingCountry]) || [],
    [allStates, mailingCountry]
  );

  const onCountryChanged = useCallback(
    async (isBillingCountry: boolean, countryCode: string) => {
      const previousCountryCode = isBillingCountry ? billingCountry : mailingCountry;
      const countryInfo = allStates![countryCode];

      if (isBillingCountry) {
        const currentStateValue = getValues('billingAddress.stateCode');

        if (previousCountryCode && currentStateValue) {
          setPreviousBillingStates((prev) => ({
            ...prev,
            [previousCountryCode]: currentStateValue,
          }));
        }

        setIsBillingPostalCodeRequired(
          Boolean(POSTAL_CODES_PATTERNS[countryCode as keyof typeof POSTAL_CODES_PATTERNS])
        );

        const savedState = previousBillingStates[countryCode];

        if (savedState && countryInfo?.some((s) => s.stateCode === savedState)) {
          return setValue('billingAddress.stateCode', savedState);
        }

        if (countryInfo?.length) {
          return setValue('billingAddress.stateCode', countryInfo[0].stateCode);
        }

        setValue('billingAddress.stateCode', '');
      } else {
        const currentStateValue = getValues('mailingAddress.stateCode');

        if (previousCountryCode && currentStateValue) {
          setPreviousMailingStates((prev) => ({
            ...prev,
            [previousCountryCode]: currentStateValue,
          }));
        }

        setIsMailingPostalCodeRequired(
          Boolean(POSTAL_CODES_PATTERNS[countryCode as keyof typeof POSTAL_CODES_PATTERNS])
        );

        const savedState = previousMailingStates[countryCode];

        if (savedState && countryInfo?.some((s) => s.stateCode === savedState)) {
          return setValue('mailingAddress.stateCode', savedState);
        }

        if (countryInfo?.length) {
          return setValue('mailingAddress.stateCode', countryInfo[0].stateCode);
        }

        setValue('mailingAddress.stateCode', '');
      }
    },
    [
      allStates,
      setValue,
      getValues,
      billingCountry,
      mailingCountry,
      previousBillingStates,
      previousMailingStates,
    ]
  );

  const onFormSubmit = useCallback(
    (data: AddressInformation) => {
      if (!isValid || isUpdatingUser) {
        return;
      }

      const { mailingAddress, isSameAddress, billingAddress } = data;
      const newBillingAddress = isSameAddress ? mailingAddress : billingAddress;

      updateUser({
        mailingAddress,
        billingAddress: newBillingAddress,
      });
    },
    [isUpdatingUser, isValid, updateUser]
  );

  return (
    <form className="flex flex-col space-y-5 !mt-8" onSubmit={handleSubmit(onFormSubmit)}>
      <MailingAddressForm
        labels={props.labels}
        control={control}
        countries={allCountries!}
        states={mailingStates}
        onCountryChanged={onCountryChanged}
        isUpdatingUser={isUpdatingUser}
        isPostalCodeRequired={isMailingPostalCodeRequired}
      />

      <BillingAddressForm
        labels={props.labels}
        control={control}
        countries={allCountries!}
        states={billingStates}
        isSameAddress={isSameAddress}
        onCountryChanged={onCountryChanged}
        isUpdatingUser={isUpdatingUser}
        isPostalCodeRequired={isBillingPostalCodeRequired}
      />

      <ProfileSectionFooter {...props} isSubmitting={isUpdatingUser} />
    </form>
  );
};
