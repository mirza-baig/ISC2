import { SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FieldConditions, useConditionalForm } from 'rhf-conditional-logic';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAnalyticsTracking, useLoggedUser } from 'hooks/index';
import { useAnalyticsItems } from 'utils/cart';

import { PersonalInformationSchema, type PersonalInformation } from 'types/index';
import {
  useActiveBusinessAccount,
  useGetAllCountries,
  useGetAllStates,
  useIsBusinessBuyer,
  useIsCpqStyleCheckout,
  useOnCartPersonalInformationComplete,
} from 'hooks/index';
import { FormFieldsProvider, useCart, useCheckoutProcess } from 'providers/index';
import { Button, FormTextInput, FormDropdown, FormCheckbox, RichTextUI } from 'ui/index';
import { ANALYTICS_EVENTS } from 'constants/index';
import { formatAnalyticsCouponCodes } from 'utils/analytics';
import { isPostalCodeRequiredForCountry } from 'utils/cart';
import BusinessPurchaseInformation from './BusinessPurchaseInformation';

const FORM_CONDITIONS: FieldConditions<PersonalInformation> = {
  // A business buyer's mailing address mirrors the account's read-only shipping address,
  // so it is never validated: an incomplete account record must not block checkout.
  mailingAddress: (getValues) =>
    getValues('isSameAddress') === false &&
    !getValues('isB2Bcart') &&
    !getValues('isBusinessBuyer'),
};

type FormProps = {
  initialData: PersonalInformation;
  onStepComplete: (data: PersonalInformation) => void;
};

export default function PersonalInformationForm({ initialData, onStepComplete }: FormProps) {
  const { user } = useLoggedUser();
  const { stepOneLabels, fields } = useCheckoutProcess();
  const { activeCart } = useCart();
  const isCpqStyleCheckout = useIsCpqStyleCheckout();
  const isBusinessBuyer = useIsBusinessBuyer();

  const {
    accountName,
    shippingAddress: accountShippingAddress,
    isPoRequired,
    isPoAttachmentRequired,
    isCourseDeliveryDateRequired,
  } = useActiveBusinessAccount();

  const { allCountries } = useGetAllCountries();
  const { allStates } = useGetAllStates();
  const { track } = useAnalyticsTracking();
  const mappedItems = useAnalyticsItems();

  const [isBillingPostalCodeRequired, setIsBillingPostalCodeRequired] = useState<boolean>(
    isPostalCodeRequiredForCountry(user?.billingAddress.countryCode)
  );

  const [isMailingPostalCodeRequired, setIsMailingPostalCodeRequired] = useState<boolean>(
    isPostalCodeRequiredForCountry(user?.mailingAddress.countryCode)
  );

  const [previousBillingStates, setPreviousBillingStates] = useState<Record<string, string>>({});
  const [previousMailingStates, setPreviousMailingStates] = useState<Record<string, string>>({});

  const { onCartPersonalInformationComplete, isSettingInfo } = useOnCartPersonalInformationComplete(
    {
      initialData,
      callbacks: {
        onSuccess: onStepComplete,
      },
    }
  );

  const {
    handleSubmit,
    watch,
    control,
    setValue,
    getValues,
    formState: { isValid },
  } = useConditionalForm<PersonalInformation>({
    mode: 'onSubmit',
    conditions: FORM_CONDITIONS,
    defaultValues: initialData,
    resolver: zodResolver(PersonalInformationSchema),
  });

  const isSameAddress = watch('isSameAddress');
  const billingCountry = watch('billingAddress.countryCode') ?? '';
  const mailingCountry = watch('mailingAddress.countryCode') ?? '';

  // CPQ checkout (cartType CPQ or cart opened via ?cartId=): billing only; ignore profile mailing/billing split
  const hideMailingAddress = isCpqStyleCheckout;

  useEffect(() => {
    setValue('isB2Bcart', isCpqStyleCheckout);
    if (!isCpqStyleCheckout) {
      return;
    }
    setValue('isSameAddress', true);
    const billing = getValues('billingAddress');
    if (billing?.street) {
      setValue('mailingAddress', { ...billing });
    }
  }, [isCpqStyleCheckout, setValue, getValues]);

  // Business buyer data load: the account drives the company name, the read-only
  // shipping address and which purchase fields the schema requires.
  useEffect(() => {
    if (!isBusinessBuyer) {
      return;
    }

    setValue('isBusinessBuyer', true);
    setValue('isPoRequired', isPoRequired);
    setValue('isPoAttachmentRequired', isPoAttachmentRequired);
    setValue('isCourseDeliveryDateRequired', isCourseDeliveryDateRequired);

    if (accountName) {
      setValue('employer', accountName);
    }

    if (accountShippingAddress) {
      setValue('mailingAddress', accountShippingAddress);
      setIsMailingPostalCodeRequired(
        isPostalCodeRequiredForCountry(accountShippingAddress.countryCode)
      );
    }
  }, [
    isBusinessBuyer,
    accountName,
    accountShippingAddress,
    isPoRequired,
    isPoAttachmentRequired,
    isCourseDeliveryDateRequired,
    setValue,
  ]);

  // "Same Billing Address" keeps billing in step with the read-only shipping address, so
  // tax and payment still see a complete billing address the buyer never had to retype.
  useEffect(() => {
    if (!isBusinessBuyer || !isSameAddress) {
      return;
    }

    const mailing = getValues('mailingAddress');

    if (mailing?.street) {
      setValue('billingAddress', { ...mailing });
      setIsBillingPostalCodeRequired(isPostalCodeRequiredForCountry(mailing.countryCode));
    }
  }, [isBusinessBuyer, isSameAddress, accountShippingAddress, getValues, setValue]);

  const billingStates = useMemo(
    () => allStates?.[billingCountry] ?? [],
    [allStates, billingCountry]
  );

  const mailingStates = useMemo(
    () => allStates?.[mailingCountry] ?? [],
    [allStates, mailingCountry]
  );

  const onCountryChanged = useCallback(
    (isBillingCountry: boolean, countryCode: string) => {
      const target = isBillingCountry ? 'billingAddress.stateCode' : 'mailingAddress.stateCode';
      const previousCountryCode = isBillingCountry ? billingCountry : mailingCountry;
      const currentStateValue = getValues(target);
      const countryInfo = allStates?.[countryCode];

      if (previousCountryCode && currentStateValue) {
        if (isBillingCountry) {
          setPreviousBillingStates((prev) => ({
            ...prev,
            [previousCountryCode]: currentStateValue,
          }));
        } else {
          setPreviousMailingStates((prev) => ({
            ...prev,
            [previousCountryCode]: currentStateValue,
          }));
        }
      }

      if (isBillingCountry) {
        setIsBillingPostalCodeRequired(isPostalCodeRequiredForCountry(countryCode));
      } else {
        setIsMailingPostalCodeRequired(isPostalCodeRequiredForCountry(countryCode));
      }

      const previousStateMap = isBillingCountry ? previousBillingStates : previousMailingStates;
      const savedState = previousStateMap[countryCode];

      if (savedState && countryInfo?.some((s) => s.stateCode === savedState)) {
        return setValue(target, savedState);
      }

      if (countryInfo?.length) {
        return setValue(target, countryInfo[0].stateCode);
      }

      setValue(target, '');
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

  const onFormSubmitted: SubmitHandler<PersonalInformation> = (data) => {
    if (!isValid || isSettingInfo) {
      return;
    }

    const coupon = formatAnalyticsCouponCodes(activeCart?.discountCodes);

    track({ ecommerce: null });
    track({
      event: ANALYTICS_EVENTS.ADD_SHIPPING_INFO,
      ecommerce: {
        currency: activeCart?.computed?.currencyCode,
        value: Number(activeCart?.computed?.subtotal),
        items: mappedItems,
        ...(coupon !== undefined && { coupon }),
      },
    });

    onCartPersonalInformationComplete(data);
  };

  return (
    <FormFieldsProvider
      requiredText={stepOneLabels.requiredFieldNotice}
      requiredErrorMessage={stepOneLabels.requiredErrorMessage}
      incorrectPostalCodeMessage={stepOneLabels.incorrectPostalCodeMessage}
      emailFormatErrorMessage={stepOneLabels.emailFormatErrorMessage}
    >
      <form className="flex flex-col gap-y-4" onSubmit={handleSubmit(onFormSubmitted)}>
        {isBusinessBuyer ? (
          <BusinessPurchaseInformation
            control={control}
            stepOneLabels={stepOneLabels}
            termsAndConditionsLabel={fields.termsAndConditionsLabel.value}
            countries={allCountries}
            billingStates={billingStates}
            mailingStates={mailingStates}
            isSameAddress={isSameAddress}
            isSubmitting={isSettingInfo}
            isPoRequired={isPoRequired}
            isPoAttachmentRequired={isPoAttachmentRequired}
            isCourseDeliveryDateRequired={isCourseDeliveryDateRequired}
            isBillingPostalCodeRequired={isBillingPostalCodeRequired}
            isMailingPostalCodeRequired={isMailingPostalCodeRequired}
            onBillingCountryChanged={onCountryChanged.bind(null, true)}
          />
        ) : (
          <>
            <p className="text-black body-m">{stepOneLabels.billingAddressTitle}</p>
            <div className="grid sm:grid-cols-2 gap-4">
              <FormTextInput
                name="firstName"
                control={control}
                label={stepOneLabels.firstNameLabel}
                tooltipText={stepOneLabels.firstNameTooltip}
                maxLength={40}
                disabled={!activeCart.computed.isB2B}
              />
              <FormTextInput
                name="lastName"
                control={control}
                label={stepOneLabels.lastNameLabel}
                tooltipText={stepOneLabels.lastNameTooltip}
                maxLength={80}
                disabled={!activeCart.computed.isB2B}
              />
            </div>

            <FormTextInput
              isOptional
              name="employer"
              control={control}
              label={stepOneLabels.companyNameLabel}
              tooltipText={stepOneLabels.companyNameLabel}
              disabled={isSettingInfo}
              maxLength={80}
            />

            <FormTextInput
              name="billingAddress.street"
              control={control}
              label={stepOneLabels.addressLineOneLabel}
              tooltipText={stepOneLabels.addressLineOneTooltip}
              disabled={isSettingInfo}
              maxLength={255}
            />

            <FormDropdown
              control={control}
              name="billingAddress.countryCode"
              options={allCountries}
              valueProp="countryCode"
              textProp="countryName"
              onChange={onCountryChanged.bind(null, true)}
              label={stepOneLabels.countryLabel}
              tooltipText={stepOneLabels.countryTooltip}
              disabled={isSettingInfo}
              maxLength={80}
            />

            <div className="grid sm:grid-cols-2 gap-4">
              {billingStates.length > 0 && (
                <FormDropdown
                  control={control}
                  name="billingAddress.stateCode"
                  options={billingStates}
                  valueProp="stateCode"
                  textProp="stateName"
                  label={stepOneLabels.stateLabel}
                  tooltipText={stepOneLabels.stateTooltip}
                  disabled={isSettingInfo}
                  maxLength={40}
                  isOptional={false}
                />
              )}

              <FormTextInput
                name="billingAddress.city"
                control={control}
                label={stepOneLabels.cityLabel}
                tooltipText={stepOneLabels.cityTooltip}
                disabled={isSettingInfo}
                maxLength={40}
              />

              <FormTextInput
                name="billingAddress.postalCode"
                control={control}
                label={stepOneLabels.zipCodeLabel}
                tooltipText={stepOneLabels.zipCodeTooltip}
                disabled={isSettingInfo}
                maxLength={20}
                isOptional={!isBillingPostalCodeRequired}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <FormTextInput
                name="email"
                control={control}
                label={stepOneLabels.emailAddressLabel}
                tooltipText={stepOneLabels.emailAddressTooltip}
                maxLength={80}
                disabled
              />

              <FormTextInput
                type="number"
                name="phoneNumber"
                control={control}
                label={stepOneLabels.phoneNumberLabel}
                maxLength={15}
                disabled={isSettingInfo || activeCart.computed.isB2B}
                isOptional
              />
            </div>

            <div className="space-y-5 my-5">
              <FormCheckbox
                name="agreeTerms"
                control={control}
                label={fields.termsAndConditionsLabel.value}
                disabled={isSettingInfo}
              />

              {!hideMailingAddress && (
                <FormCheckbox
                  control={control}
                  name="isSameAddress"
                  label={stepOneLabels.shippingAddressCheckboxLabel}
                  disabled={isSettingInfo}
                />
              )}
            </div>

            {!hideMailingAddress && !isSameAddress && (
              <div className="flex flex-col gap-y-4">
                <p className="text-black body-m">{stepOneLabels.mailingAddressTitle}</p>
                <FormTextInput
                  control={control}
                  name="mailingAddress.street"
                  label={stepOneLabels.shippingAddressLineOneLabel}
                  tooltipText={stepOneLabels.shippingAddressLineOneTooltip}
                  disabled={isSettingInfo || activeCart.computed.isB2B}
                  maxLength={255}
                />

                <FormDropdown
                  control={control}
                  name="mailingAddress.countryCode"
                  options={allCountries}
                  valueProp="countryCode"
                  textProp="countryName"
                  onChange={onCountryChanged.bind(null, false)}
                  label={stepOneLabels.shippingCountryLabel}
                  tooltipText={stepOneLabels.shippingCountryTooltip}
                  disabled={isSettingInfo || activeCart.computed.isB2B}
                  maxLength={80}
                />

                <div className="grid sm:grid-cols-2 gap-4">
                  {mailingStates.length > 0 && (
                    <FormDropdown
                      control={control}
                      name="mailingAddress.stateCode"
                      options={mailingStates}
                      valueProp="stateCode"
                      textProp="stateName"
                      label={stepOneLabels.shippingStateLabel}
                      tooltipText={stepOneLabels.shippingStateTooltip}
                      disabled={isSettingInfo || activeCart.computed.isB2B}
                      maxLength={40}
                      isOptional={false}
                    />
                  )}
                  <FormTextInput
                    control={control}
                    name="mailingAddress.city"
                    label={stepOneLabels.shippingCityLabel}
                    tooltipText={stepOneLabels.shippingCityTooltip}
                    disabled={isSettingInfo || activeCart.computed.isB2B}
                    maxLength={40}
                  />

                  <FormTextInput
                    control={control}
                    name="mailingAddress.postalCode"
                    label={stepOneLabels.shippingZipCodeLabel}
                    tooltipText={stepOneLabels.shippingZipCodeTooltip}
                    disabled={isSettingInfo || activeCart.computed.isB2B}
                    maxLength={20}
                    isOptional={!isMailingPostalCodeRequired}
                  />
                </div>
              </div>
            )}
          </>
        )}

        <Button
          type="submit"
          variant="primary"
          className="sm:self-end"
          isLoading={isSettingInfo}
          label={stepOneLabels.nextStepCtaLabel}
        />
      </form>

      <RichTextUI value={fields.bottomNotice.value} className="body-s mt-8" />
    </FormFieldsProvider>
  );
}
