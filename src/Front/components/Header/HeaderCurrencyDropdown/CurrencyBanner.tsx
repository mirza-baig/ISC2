import { Field } from '@sitecore-jss/sitecore-jss-nextjs';
import CloseIcon from 'icons/CloseIcon';
import { useHeaderNavigation } from 'providers/header';
import { useUserSession } from 'providers/userSession';
import { RefObject, useEffect, useRef, useState } from 'react';
import { DisplayCurrencyCodes } from 'utils/currencies';

type CurrencyKey = keyof typeof DisplayCurrencyCodes;

type CurrencyBannerProps = {
  fields: {
    bannerText: Field<string>;
    confirmButtonText: Field<string>;
    revertButtonText: Field<string>;
  };
};

export default function CurrencyBanner({ fields }: CurrencyBannerProps) {
  const { bannerText, confirmButtonText, revertButtonText } = fields;
  const [showPopup, setShowPopup] = useState<boolean>(false);
  const { setCurrencyCode, pendingCurrencyCode, userCountry, setPendingCurrencyCode } =
    useUserSession();
  const { setIsCurrencyBannerOnPage } = useHeaderNavigation();

  const confirmRef = useRef<HTMLButtonElement>(null);
  const pendingDisplayCurrency =
    DisplayCurrencyCodes[pendingCurrencyCode as CurrencyKey] ?? pendingCurrencyCode;

  useEffect(() => {
    if (pendingCurrencyCode) {
      setShowPopup(true);
    }
  }, [pendingCurrencyCode]);

  useEffect(() => {
    if (showPopup) {
      focusButton(confirmRef);
    }
  }, [showPopup]);

  const focusButton = (ref: RefObject<HTMLButtonElement | null>) => {
    if (ref.current) {
      ref.current.focus();
    }
  };

  const changeCurrency = () => {
    if (pendingCurrencyCode) {
      setCurrencyCode(pendingCurrencyCode);
    }

    setShowPopup(false);
  };

  const closePopup = () => {
    setShowPopup(false);
    setPendingCurrencyCode(undefined);
  };

  useEffect(() => {
    setIsCurrencyBannerOnPage(true);

    return () => {
      setIsCurrencyBannerOnPage(false);
    };
  }, [setIsCurrencyBannerOnPage]);

  if (!showPopup) {
    return null;
  }

  return (
    <div className="currency-pop-up w-full small:max-w-none px-5 py-5 sm:py-3 bg-black flex align-center flex-col sm:flex-row justify-end gap-6 fixed sm:static bottom-0 sm:bottom-auto z-50 sm:z-0">
      {bannerText?.value && (
        <p className="text-normal text-white flex items-center pr-8 sm:pr-0">
          {bannerText.value
            .replace('{pendingCurrency}', pendingDisplayCurrency)
            .replace('{country}', userCountry ?? 'US')}
        </p>
      )}
      <div className="flex gap-4">
        <button
          ref={confirmRef}
          className="text-xsm cta primary-cta !py-2 !px-4"
          onClick={changeCurrency}
          aria-label={confirmButtonText?.value}
        >
          {confirmButtonText?.value}
        </button>
        <button
          className="text-xsm cta primary-cta !py-2 !px-4"
          onClick={closePopup}
          aria-label={revertButtonText?.value}
        >
          {revertButtonText?.value}
        </button>
      </div>

      <button
        className="cursor-pointer absolute sm:static top-5 sm:top-auto right-5 sm:right-auto"
        onClick={closePopup}
        aria-label="Close"
      >
        <CloseIcon size={20} />
      </button>
    </div>
  );
}
