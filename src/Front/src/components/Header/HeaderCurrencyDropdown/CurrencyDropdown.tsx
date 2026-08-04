import { useId, useMemo } from 'react';
import Select from 'react-select';

import { useUserSession, useHeaderNavigation } from 'providers/index';
import { CurrencyCodes, DisplayCurrencyCodes } from 'utils/currencies';
import { useAnalyticsTracking, useGetCurrencies } from 'hooks/index';

import { selectStyles } from './utils';
import { ANALYTICS_EVENTS } from 'constants/analytics';

type CurrencyDropdownProps = {
  selectCurrencyText?: string;
  confirmationEnabled: boolean;
};

type CurrencyOptions = {
  label: string;
  value: string;
};

const CUSTOM_CLASS = 'custom-dropdown-carrot-container';

export default function CurrencyDropdown({
  selectCurrencyText,
  confirmationEnabled,
}: CurrencyDropdownProps) {
  const { currencyCode, setPendingCurrencyCode, setCurrencyCode } = useUserSession();
  const { currencies, currenciesIsLoading } = useGetCurrencies();
  const { track } = useAnalyticsTracking();
  const { isCurrencyBannerOnPage } = useHeaderNavigation();
  const currencyDropdownUniqueId = useId();

  const changeCurrency = (e: { label: string; value: CurrencyCodes }) => {
    if (e.value !== currencyCode) {
      const shouldConfirmAction = confirmationEnabled && isCurrencyBannerOnPage;
      const setFn = shouldConfirmAction ? setPendingCurrencyCode : setCurrencyCode;
      track({
        event: ANALYTICS_EVENTS.CURRENCY_SELECTOR,
        currency: e.value,
      });
      setFn(e.value);
    }
  };

  const options = useMemo(
    () =>
      currencies.map((currency: string) => ({
        label: DisplayCurrencyCodes[currency] ?? currency,
        value: currency,
      })),
    [currencies]
  ) as CurrencyOptions[];

  if (currenciesIsLoading) {
    return null;
  }

  return (
    <div className="cursor-pointer">
      <Select
        instanceId={currencyDropdownUniqueId}
        aria-label="Use arrow and enter keys to select your currency"
        openMenuOnFocus
        tabSelectsValue={false}
        classNames={{
          control: () => 'bg-gray-90',
          indicatorsContainer: () => CUSTOM_CLASS,
        }}
        styles={selectStyles(selectCurrencyText)}
        value={options.find((option) => option.value === currencyCode)}
        isSearchable={false}
        onChange={changeCurrency}
        options={options}
      />
    </div>
  );
}
