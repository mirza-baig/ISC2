import {
  Link,
  withDatasourceCheck,
  ComponentRendering,
  RouteData,
  useSitecoreContext,
} from '@sitecore-jss/sitecore-jss-nextjs';
import { ComponentProps } from 'lib/component-props';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { getCookie, setCookie } from 'cookies-next';
import { signIn } from 'next-auth/react';

import { UserLinksFields, HeaderUserLinks } from 'types/index';
import { useCart, useHeaderNavigation, useLayout } from 'src/providers';
import { useFeatureFlag } from 'providers/featureFlags';
import { useBreakpoint, useDisableScroll, useLoggedUser, useOnEventOutside } from 'hooks/index';
import { CartIcon, SearchIcon, UserIcon, ChevronDownIcon } from 'icons/index';
import { useAnalyticsTracking, useScrollDirection, useToggle } from 'hooks/index';

import HeaderUserMenu, { HeaderUserMenuFields } from './HeaderUserMenu';
import CurrencyDropdown from './HeaderCurrencyDropdown/CurrencyDropdown';
import {
  ANALYTICS_EVENTS,
  USER_ROLES,
  B2B_LISTING_TEMPLATE_NAME,
  B2B_FEATURE_FLAG,
} from 'constants/index';

interface Fields {
  id: string;
  props: UserLinksFields & { profileSummaryDataSource: { fields: HeaderUserMenuFields } };
  children?: HeaderUserLinks[];
}

export type SigninProps = ComponentProps & {
  rendering: ComponentRendering | RouteData;
  fields: Fields;
};

function HeaderSignin({ fields }: SigninProps): JSX.Element {
  const {
    user,
    isUserLoggedIn,
    isUserNotLoggedIn,
    isUserAssociate,
    isUserMember,
    isRegisterUser,
    sessionStatus,
  } = useLoggedUser();
  const breakpoint = useBreakpoint();

  const { track } = useAnalyticsTracking();
  const { toggleSearchOpen, isSearchOpen, setUserHeaderLinks, onUserLinkClick } =
    useHeaderNavigation();
  const { openMiniCart } = useLayout();

  const { scrollDirection } = useScrollDirection();
  const { isGettingCart, activeCart } = useCart();

  // The B2B Product Listing Page has its own on-page cart (a docked panel + collapsed floating
  // bubble, see SearchWrapper/B2BPlpCart) — the header's cart button would be a redundant/
  // conflicting second entry point there, so it's hidden on that page only.
  const { sitecoreContext } = useSitecoreContext();
  const isB2BFeatureEnabled = useFeatureFlag(B2B_FEATURE_FLAG);
  const isB2BListing =
    isB2BFeatureEnabled && sitecoreContext?.route?.templateName === B2B_LISTING_TEMPLATE_NAME;

  const [isMenuOpen, toggleMenu, setMenuOpen] = useToggle(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  useDisableScroll({ disable: isMenuOpen && breakpoint === 'max-sm' });

  useEffect(() => setIsMounted(true), []);

  const handleClickOutside = useCallback(
    (event: Event) => {
      if (breakpoint === 'max-sm') {
        return;
      }

      let target = event.target as HTMLElement | null;
      while (target !== null) {
        if (target.tagName === 'MENU') {
          return;
        }
        target = target.parentElement;
      }

      if (setMenuOpen) {
        setMenuOpen(false);
      }
    },
    [breakpoint, setMenuOpen]
  );

  useOnEventOutside(userMenuRef, ['mousedown', 'touchstart'], handleClickOutside);

  useEffect(() => {
    if (user) {
      document.cookie = `s-name=${user.firstName};domain=.isc2.org;path=/;SameSite=Strict`;
      document.cookie = `userType=${
        isRegisterUser
          ? 'user'
          : isUserMember
          ? USER_ROLES.MEMBER
          : isUserAssociate
          ? USER_ROLES.ASSOCIATE
          : USER_ROLES.CANDIDATE
      };domain=.isc2.org;path=/;SameSite=Strict`;
    } else {
      document.cookie =
        's-name= ;domain=.isc2.org;path=/;SameSite=Strict; expires = Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie =
        'userType= ; domain=.isc2.org;path=/;SameSite=Strict; expires = Thu, 01 Jan 1970 00:00:00 GMT';
    }

    const salesforceCookie = getCookie('i-name');
    const sNameCookie = getCookie('s-name');
    const initialLoginCheckCookie = getCookie('initialLoginCheck');

    if (!initialLoginCheckCookie) {
      const expires = new Date();
      expires.setTime(expires.getTime() + 24 * 60 * 60 * 1000); // 24 hours in milliseconds
      setCookie('initialLoginCheck', 'true', { path: '/', expires });

      if (salesforceCookie && !sNameCookie && isUserNotLoggedIn && sessionStatus !== 'loading') {
        signIn('salesforce');
      }
    }
  }, [isUserMember, isUserAssociate, isRegisterUser, user, isUserNotLoggedIn, sessionStatus]);

  useEffect(() => {
    if (scrollDirection === 'down') {
      setMenuOpen(false);
    }
  }, [scrollDirection, setMenuOpen]);

  useEffect(() => {
    setUserHeaderLinks(fields.props, fields.children);
  }, [fields.props, fields.children, setUserHeaderLinks]);

  const handleSearchClick = (): void => {
    setMenuOpen(false);
    track({
      event: ANALYTICS_EVENTS.VT_INTERRUPTION,
      interruption_type: 'search_cta_click',
    });

    toggleSearchOpen();
  };

  const handleCtaClick = (evt: React.MouseEvent): void => {
    setMenuOpen(false);
    const anchorElement = evt.currentTarget as HTMLAnchorElement;
    const anchorText = anchorElement.innerText.toLowerCase();
    const anchorHref = anchorElement.href.toLowerCase();

    track({
      event: ANALYTICS_EVENTS.GA_EVENT,
      type: 'engagement',
      bo2: true,
      bo3: true,
      subtype: 'cta_click',
      click_text: anchorText,
      click_url: anchorHref,
    });
  };

  const onCartIconPress = useCallback(() => {
    setMenuOpen(false);
    if (isGettingCart) {
      return;
    }

    track({
      event: ANALYTICS_EVENTS.GA_EVENT,
      type: 'lead',
      subtype: 'navigation_cart_click',
      bo2: true,
    });

    openMiniCart();
  }, [isGettingCart, openMiniCart, track, setMenuOpen]);

  const cartSize = useMemo(() => activeCart?.lineItems?.length, [activeCart.lineItems]);

  return (
    <>
      <div className="relative bg-gray-90 z-1 text-white-00 rounded-b-lg max-sm:w-full">
        <div className="flex items-center h-full justify-around max-sm:max-w-400 max-sm:mx-auto sm:justify-normal">
          <Link
            className="body-s py-2 rounded-bl-lg px-2"
            prefetch={false}
            field={fields?.props?.registerForExamLink}
            onClick={handleCtaClick}
          />
          <button
            aria-label="find"
            onClick={handleSearchClick}
            className={clsx('p-2 hidden sm:block', isSearchOpen && 'bg-isc2-green')}
          >
            <SearchIcon size={20} />
          </button>

          <span className="h-full" ref={userMenuRef}>
            <button
              aria-label={isUserLoggedIn ? 'My Account' : 'signin'}
              className={clsx(
                'flex justify-center h-full items-center py-1 px-2',
                isUserLoggedIn && isMenuOpen && 'bg-isc2-green space-x-2'
              )}
              onClick={() => {
                onUserLinkClick(toggleMenu);

                track({
                  event: ANALYTICS_EVENTS.GA_EVENT,
                  type: 'engagement',
                  subtype: 'cta_click',
                  click_text: 'log in',
                  click_url: process.env.NEXT_PUBLIC_SALESFORCE_AUTHURL || '',
                  bo3: true,
                });
              }}
            >
              {!isUserLoggedIn && <UserIcon size={20} />}
              {isUserLoggedIn && (
                <div className="flex items-center gap-1">
                  <span className="body-s">
                    {fields?.children?.[0]?.children?.[0]?.fields?.userSectionName?.value}
                  </span>
                  <ChevronDownIcon size={15} />
                </div>
              )}
            </button>
          </span>

          {isMounted && (
            // id used by the B2B PLP's mobile cart bubble to anchor next to this control
            // (SearchWrapper.tsx) — safe to keep on every page, only read on the B2B listing page.
            <div id="header-currency-dropdown">
              <CurrencyDropdown
                selectCurrencyText={fields?.props?.selectCurrencyText?.value?.toString()}
                confirmationEnabled={fields?.props?.enableCurrencyConfirmation?.value}
              />
            </div>
          )}

          {!isB2BListing && (
            <button
              role="button"
              aria-label="cart"
              className="text-xs flex relative justify-evenly py-2 !m-0 px-2 disabled:cursor-progress disabled:opacity-35"
              onClick={onCartIconPress}
              disabled={!isMounted || isGettingCart}
            >
              <CartIcon size={20} />
              {Boolean(cartSize) && (
                <span className="text-xs absolute top-5 right-1.5 rounded-full bg-gray-60">
                  {cartSize}
                </span>
              )}
            </button>
          )}
        </div>
      </div>
      {isMenuOpen && (
        <HeaderUserMenu
          fields={fields.props.profileSummaryDataSource.fields}
          setMenuOpen={setMenuOpen}
        />
      )}
    </>
  );
}

export default withDatasourceCheck()<SigninProps>(HeaderSignin);
