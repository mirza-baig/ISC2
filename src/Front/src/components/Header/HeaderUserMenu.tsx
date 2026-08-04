import { Field, ImageField, Link } from '@sitecore-jss/sitecore-jss-nextjs';
import clsx from 'clsx';
import { useCallback, useState } from 'react';
import { useRouter } from 'next/router';
import { CloseIcon } from 'icons/index';
import { parseFieldsFromURLString } from 'utils/index';
import { LoadingIndicator, UserDataSummary } from 'ui/index';
import { useHeaderNavigation } from 'providers/header';
import { useModal } from 'providers/modal';
import { useShopperContext } from 'providers/shopperContext';
import useLoggedUser from 'hooks/useLoggedUser';
import { SESSION_STORAGE_KEYS, SESSION_LOCALSTORAGE_KEYS } from 'constants/sessionTimeout';
import ChangeBuyerModal, { LOG_OUT_CHANGE_BUYER_LABEL } from './ChangeBuyerModal';

export type HeaderUserMenuLabels = UserDataSummary.Labels & {
  signOutLabel: string;
};

export interface HeaderUserMenuFields {
  closeUploadModalIcon: ImageField;
  defaultProfilePic: ImageField;
  deletePhotoIcon: ImageField;
  labelsTitlesAndMore: Field<string>;
  uploadPhotoIcon: Field<string>;
}

export interface HeaderUserMenuProps {
  className?: string;
  setMenuOpen?: (value: boolean) => void;
  fields: HeaderUserMenuFields;
}

const LINK_CLASS_NAME = 'body-m block relative py-3 sm:py-0';

export default function HeaderUserMenu({ className, setMenuOpen, fields }: HeaderUserMenuProps) {
  const router = useRouter();
  const { isUserLoggedIn, isB2BAdminUser } = useLoggedUser();
  const { shopperContext } = useShopperContext();
  const { userRoleMenuLinks, userLinksForRole } = useHeaderNavigation();
  const { setModalContent } = useModal();
  const [isUserSigningOut, setIsUserSigningOut] = useState<boolean>(false);

  const labels = parseFieldsFromURLString<HeaderUserMenuLabels>(fields.labelsTitlesAndMore);
  const showChangeBuyerLogout = isB2BAdminUser && shopperContext?.type === 'organization';
  const signOutLabel = showChangeBuyerLogout ? LOG_OUT_CHANGE_BUYER_LABEL : labels.signOutLabel;

  const onSignOut = useCallback(() => {
    setIsUserSigningOut(true);
    sessionStorage.removeItem(SESSION_STORAGE_KEYS.SESSION_ACTIVE);
    localStorage.removeItem(SESSION_LOCALSTORAGE_KEYS.LAST_ACTIVITY);
    router.push('/api/auth/federated-sign-out');
  }, [router]);

  const onChangeBuyerClick = useCallback(() => {
    if (setMenuOpen) {
      setMenuOpen(false);
    }

    setModalContent(<ChangeBuyerModal onSignOutStarted={() => setIsUserSigningOut(true)} />, {
      dismissOnClickOutside: true,
    });
  }, [setMenuOpen, setModalContent]);

  if (!userLinksForRole) {
    return null;
  }

  return (
    <menu
      className={clsx(
        'flex flex-col text-black-100 whitespace-nowrap margin-0 min-w-full sm:px-4',
        'fixed top-0 left-0 w-full h-full sm:w-auto sm:h-auto sm:absolute sm:top-full sm:right-0',
        className
      )}
    >
      <div className="sm:p-8 relative px-7 pt-10 pb-6 h-full overflow-auto sm:overflow-visible bg-white-00 sm:rounded-lg sm:drop-shadow-lg backdrop-filter backdrop-blur-md bg-opacity-90">
        <section className={clsx('flex flex-col sm:space-y-4 items-start body-m relative')}>
          <div className="relative w-full py-6 pr-10 sm:py-0">
            <button
              className="absolute top-0 right-0 w-20 h-full flex justify-end items-center sm:hidden"
              onClick={() => {
                if (setMenuOpen) {
                  setMenuOpen(false);
                }
              }}
              aria-label="Close"
            >
              <CloseIcon size={32} />
            </button>
          </div>
          <UserDataSummary className="mb-6 sm:hidden" labels={labels} />
          {userRoleMenuLinks.userLinks.map((item, index) => {
            if (item?.fields?.link?.value?.href) {
              return (
                <span className="block relative w-full body-m" key={`${index}-${item.id}`}>
                  <Link
                    key={item.id}
                    field={item?.fields?.link?.value}
                    prefetch={false}
                    className={LINK_CLASS_NAME}
                    onClick={() => {
                      if (setMenuOpen) {
                        setMenuOpen(false);
                      }
                    }}
                  />
                </span>
              );
            }

            return null;
          })}
          {isUserLoggedIn && !isUserSigningOut && (
            <button
              className={LINK_CLASS_NAME}
              onClick={showChangeBuyerLogout ? onChangeBuyerClick : onSignOut}
              aria-label={signOutLabel}
            >
              {signOutLabel}
            </button>
          )}
          {isUserSigningOut && <LoadingIndicator className="!py-0 w-6" />}
        </section>
      </div>
    </menu>
  );
}
