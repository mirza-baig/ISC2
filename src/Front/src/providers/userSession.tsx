/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-empty-function */
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { LOCALSTORAGE_KEYS } from 'constants/index';
import { useLoggedUser, useLocalStorage, useGetCountryFromCoords } from 'hooks/index';
import {
  CAD_CURRENCY_FEATURE_FLAG,
  CurrencyCodes,
  getCurrencyByCountryCode,
  getCurrencySymbol,
  isCurrencyEnabled,
  toEnabledCurrency,
} from 'utils/currencies';

import { useFeatureFlag } from './featureFlags';

type UserSessionContextProps = {
  currencyCode: CurrencyCodes;
  currencySymbol: string;
  pendingCurrencyCode?: CurrencyCodes | undefined;
  userCountry?: string;
  geolocationCountry?: string;
  setCurrencyCode: (currencyCode: CurrencyCodes) => void;
  /** Updates currency without marking a manual user override (cart/geo/address sync). */
  syncCurrencyCode: (currencyCode: CurrencyCodes) => void;
  setPendingCurrencyCode: (currencyCode: CurrencyCodes | undefined) => void;
  cartId?: string;
  setCartId: (cartId: string) => void;
  setUserCountry: (country: string) => void;
  isCurrencyManualOverride?: boolean;
  setIsCurrencyManualOverride: (override: boolean) => void;
  isConsentAllocation?: boolean;
  setIsConsentAllocation: (consent: boolean) => void;
};

const UserSessionContext = createContext<UserSessionContextProps>({
  currencyCode: CurrencyCodes.USD,
  currencySymbol: getCurrencySymbol(CurrencyCodes.USD),
  pendingCurrencyCode: undefined,
  userCountry: undefined,
  geolocationCountry: undefined,
  setCurrencyCode: () => {},
  syncCurrencyCode: () => {},
  setPendingCurrencyCode: () => {},
  cartId: undefined,
  setCartId: () => {},
  setUserCountry: () => {},
  isCurrencyManualOverride: false,
  setIsCurrencyManualOverride: () => {},
  isConsentAllocation: false,
  setIsConsentAllocation: () => {},
});

// Same check as the `CurrencyCodes[code]` lookup it replaces (enum keys equal their values).
const isKnownCurrency = (code: CurrencyCodes) => Object.values(CurrencyCodes).includes(code);

type UserSessionProviderProps = {
  children: React.ReactNode;
};

const UserSessionProvider: React.FC<UserSessionProviderProps> = ({ children }) => {
  const [pendingCurrencyCode, setPendingCurrencyCode] = useState<CurrencyCodes | undefined>();

  const { externalID, user } = useLoggedUser();
  const { getCountryFromCoordsAsync } = useGetCountryFromCoords();
  const isCadEnabled = useFeatureFlag(CAD_CURRENCY_FEATURE_FLAG);

  const [userCountry, setUserCountry] = useLocalStorage<string>(LOCALSTORAGE_KEYS.USER_COUNTRY, '');
  // Keep in memory even after user logs in, in case location is a banned country
  const [geolocationCountry, setGeolocationCountry] = useLocalStorage<string>(
    LOCALSTORAGE_KEYS.GEOLOCATION_COUNTRY,
    ''
  );

  const [cartId, setCartId] = useLocalStorage<string>(LOCALSTORAGE_KEYS.ACTIVE_CART_ID, '');

  const [storedCurrencyCode, setCurrencyCode] = useLocalStorage<CurrencyCodes>(
    LOCALSTORAGE_KEYS.USER_CURRENCY
  );
  // A CAD value already in storage (from when the flag was on) reads as USD while CAD_Currency is
  // off. Storage itself is left alone, so re-enabling the flag restores the shopper's choice.
  const currencyCode = toEnabledCurrency(storedCurrencyCode, isCadEnabled);
  // Used if logged in user bypasses currency automatically set by geolocation
  const [isCurrencyManualOverride, setIsCurrencyManualOverride] = useLocalStorage<boolean>(
    LOCALSTORAGE_KEYS.CURRENCY_OVERRIDE
  );
  // Used when admin user provides consent on the allocation tab in dashboard
  const [isConsentAllocation, setIsConsentAllocation] = useLocalStorage<boolean>(
    LOCALSTORAGE_KEYS.ALLOCATION_CONSENT
  );

  const syncCurrencyCode = useCallback(
    (newCurrencyCode: CurrencyCodes) => {
      if (
        isKnownCurrency(newCurrencyCode) &&
        isCurrencyEnabled(newCurrencyCode, isCadEnabled) &&
        newCurrencyCode !== currencyCode
      ) {
        setCurrencyCode(newCurrencyCode);
      }
    },
    [currencyCode, isCadEnabled, setCurrencyCode]
  );

  const safelySetCurrencyCode = (newCurrencyCode: CurrencyCodes) => {
    if (isKnownCurrency(newCurrencyCode) && isCurrencyEnabled(newCurrencyCode, isCadEnabled)) {
      setCurrencyCode(newCurrencyCode);
    }

    setPendingCurrencyCode(undefined);
    setIsCurrencyManualOverride(Boolean(externalID));
  };

  const applyCountryFromUserAddress = useCallback(
    (countryCode: string) => {
      // Country follows the profile address. Currency must not auto-flip here — a cart with
      // line items owns currency (e.g. USD AMF), and empty-cart sync aligns currency separately.
      setUserCountry(countryCode);
    },
    [setUserCountry]
  );

  const getLocationFromBrowser = useCallback(async () => {
    const countryInfo = await getCountryFromCoordsAsync();
    setUserCountry(countryInfo.country);
    // Re-derived here because useGetCountryFromCoords has no flag access (it defaults CAD off).
    setCurrencyCode(getCurrencyByCountryCode(countryInfo.country, isCadEnabled));
    setGeolocationCountry(countryInfo.country);
  }, [isCadEnabled]);

  useEffect(() => {
    if (isCurrencyManualOverride) {
      return;
    }

    if (!user?.isSameAddress && user?.mailingAddress?.countryCode) {
      applyCountryFromUserAddress(user.mailingAddress.countryCode);
      return;
    }

    if (user?.billingAddress?.countryCode) {
      applyCountryFromUserAddress(user.billingAddress.countryCode);
      return;
    }

    if (!currencyCode || !CurrencyCodes[currencyCode] || !geolocationCountry) {
      const locationTimer = setTimeout(() => {
        getLocationFromBrowser();
      }, 3000);

      return () => clearTimeout(locationTimer);
    }
  }, [
    user,
    currencyCode,
    getLocationFromBrowser,
    isCurrencyManualOverride,
    applyCountryFromUserAddress,
  ]);

  return (
    <UserSessionContext.Provider
      value={{
        currencyCode: currencyCode ?? CurrencyCodes.USD,
        currencySymbol: getCurrencySymbol(currencyCode ?? CurrencyCodes.USD),
        setCurrencyCode: safelySetCurrencyCode,
        syncCurrencyCode,
        pendingCurrencyCode,
        setPendingCurrencyCode,
        userCountry,
        geolocationCountry,
        cartId,
        setCartId,
        setUserCountry,
        isCurrencyManualOverride,
        setIsCurrencyManualOverride,
        isConsentAllocation,
        setIsConsentAllocation,
      }}
    >
      {children}
    </UserSessionContext.Provider>
  );
};

const useUserSession = () => useContext(UserSessionContext);

export { UserSessionProvider, useUserSession };
