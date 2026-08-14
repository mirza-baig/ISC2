import { useCallback, useState } from 'react';
import clsx from 'clsx';
import { useRouter } from 'next/router';
import { Link, Field } from '@sitecore-jss/sitecore-jss-nextjs';

import { useHeaderNavigation, useShopperContext } from 'providers/index';
import { useModal } from 'providers/modal';
import { parseFieldsFromURLString } from 'utils/index';
import { ChevronRightIcon } from 'icons/index';
import { useLoggedUser } from 'hooks/index';
import { LoadingIndicator } from 'ui/index';
import { SESSION_STORAGE_KEYS, SESSION_LOCALSTORAGE_KEYS } from 'constants/sessionTimeout';
import ChangeBuyerModal, { LOG_OUT_CHANGE_BUYER_LABEL } from 'components/Header/ChangeBuyerModal';

interface MyAccountMenuProps {
  fields: {
    props: {
      profileSummaryDataSource: {
        fields: {
          labelsTitlesAndMore: Field<string>;
        };
      };
    };
  };
}

const MyAccountMenu = ({ fields }: MyAccountMenuProps) => {
  const router = useRouter();
  const { userRoleMenuLinks } = useHeaderNavigation();
  const { isUserLoggedIn, isB2BAdminUser } = useLoggedUser();
  const { shopperContext } = useShopperContext();
  const { setModalContent } = useModal();
  const [isUserSigningOut, setIsUserSigningOut] = useState<boolean>(false);

  const labels = parseFieldsFromURLString<{ signOutLabel: string }>(
    fields?.props?.profileSummaryDataSource?.fields?.labelsTitlesAndMore
  );
  const showChangeBuyerLogout = isB2BAdminUser && shopperContext?.type === 'organization';
  const signOutLabel = showChangeBuyerLogout ? LOG_OUT_CHANGE_BUYER_LABEL : labels?.signOutLabel;

  const onSignOut = useCallback(() => {
    setIsUserSigningOut(true);
    sessionStorage.removeItem(SESSION_STORAGE_KEYS.SESSION_ACTIVE);
    localStorage.removeItem(SESSION_LOCALSTORAGE_KEYS.LAST_ACTIVITY);
    window.location.assign('/api/auth/federated-sign-out');
  }, []);

  const onChangeBuyerClick = useCallback(() => {
    setModalContent(<ChangeBuyerModal onSignOutStarted={() => setIsUserSigningOut(true)} />, {
      dismissOnClickOutside: true,
    });
  }, [setModalContent]);

  const isActiveMenuOption = (href?: string): boolean => {
    const pathCleanedFromQuery = router.asPath.split('?')[0];
    const pathCleanedFromHash = pathCleanedFromQuery.split('#')[0];

    return pathCleanedFromHash === href;
  };

  return (
    <>
      <div id="allocation-sort-portal" className="hidden lg:block" />
      <ul className="px-5 flex lg:block -mx-10 lg:mx-0 overflow-x-auto scrollbar-hide border-b border-t border-gray-50 lg:border-0 mb-6 lg:mb-0">
        {userRoleMenuLinks.userLinks.map((item, index) => (
          <li
            key={`${index}-${item.id}`}
            className={clsx(
              'lg:relative lg:border-b border-gray-50',
              isActiveMenuOption(item.fields.link.value.href) && 'border-isc2-green lg:border-b-2'
            )}
          >
            <Link
              key={item.id}
              field={item?.fields?.link?.value}
              className={clsx(
                'max-w-fit lg:w-full block mx-3 lg:pr-3 py-7 lg:py-6 text-black-100 body-m text-xsm duration-500 transition-font-weight text-nowrap',
                isActiveMenuOption(item.fields.link.value.href)
                  ? 'text-isc2-green font-semibold lg:font-extrabold border-isc2-green border-b-4 lg:border-0'
                  : 'hover:underline hover:font-extrabold'
              )}
            >
              {item.fields.link.value.text}
              <span className="hidden lg:block absolute right-0 top-1/2 -translate-y-1/2">
                <ChevronRightIcon size={16} />
              </span>
            </Link>
          </li>
        ))}
        {isUserLoggedIn && !isUserSigningOut && (
          <li className="relative">
            <button
              className="w-full block pr-3 py-7 lg:py-6 text-black-100 body-m text-left hover:underline hover:font-extrabold duration-500 transition-font-weight body-m text-xsm text-nowrap mx-3"
              onClick={showChangeBuyerLogout ? onChangeBuyerClick : onSignOut}
              aria-label={signOutLabel}
            >
              {signOutLabel}
            </button>
          </li>
        )}
        {isUserSigningOut && (
          <li className="relative min-w-40">
            <LoadingIndicator className="!py-6 mx-5 md:mx-2 w-7" />
          </li>
        )}
      </ul>
    </>
  );
};

export default MyAccountMenu;
