import { Field, LinkField } from '@sitecore-jss/sitecore-jss-nextjs';
import { signIn } from 'next-auth/react';
import { useCallback } from 'react';
import { useLoggedUser, useAnalyticsTracking } from 'hooks/index';
import { TrackingItem } from 'types/index';
import { ANALYTICS_EVENTS } from 'constants/analytics';
import { useUserSession } from 'providers/userSession';

export namespace ProductCardButtons {
  export type Props = {
    loginBtnText?: Field<string>;
    secondaryCta?: LinkField;
    item_list_id?: string;
    item_list_name?: string;
    trackingItems?: TrackingItem[];
    productKey?: string | number;
  };
}

export const ProductCardButtons = ({
  loginBtnText,
  secondaryCta,
  item_list_id,
  item_list_name,
  trackingItems,
  productKey,
}: ProductCardButtons.Props) => {
  const { isUserNotLoggedIn } = useLoggedUser();
  const { track } = useAnalyticsTracking();
  const { currencyCode } = useUserSession();

  const isCtaVisible = Boolean(secondaryCta?.value?.href && secondaryCta?.value?.text);
  const isLoginBtnVisible = Boolean(isUserNotLoggedIn && loginBtnText?.value);

  const handleSecondaryCtaClick = useCallback(() => {
    if (secondaryCta?.value?.href) {
      const clickedItem = trackingItems?.find((item) => item.item_id === productKey);

      track({ ecommerce: null });
      track({
        event: ANALYTICS_EVENTS.SELECT_ITEM,
        ecommerce: {
          currency: currencyCode,
          item_list_id: item_list_id,
          item_list_name: item_list_name,
          items: [clickedItem],
        },
      });
    }
  }, [
    secondaryCta?.value?.href,
    trackingItems,
    track,
    currencyCode,
    item_list_id,
    item_list_name,
    productKey,
  ]);

  return (
    <>
      {(isLoginBtnVisible || isCtaVisible) && (
        <div className="mt-auto pt-6 text-center flex flex-col w-full">
          {isLoginBtnVisible && (
            <button
              className="secondary-cta text-xsm py-1.5 tracking-link px-2"
              onClick={() => signIn('salesforce')}
              aria-label={loginBtnText?.value}
            >
              {loginBtnText?.value}
            </button>
          )}

          {isCtaVisible && (
            <a
              href={secondaryCta?.value?.href}
              className="primary-cta text-xsm mt-4 tracking-link px-2"
              onClick={handleSecondaryCtaClick}
            >
              {secondaryCta?.value?.text}
            </a>
          )}
        </div>
      )}
    </>
  );
};
