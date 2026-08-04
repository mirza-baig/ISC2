/* eslint-disable @next/next/next-script-for-ga, @next/next/no-sync-scripts */
import React, { useEffect, useMemo, useRef } from 'react';
import clsx from 'clsx';
import Head from 'next/head';
import { ComponentRendering, Field, Placeholder } from '@sitecore-jss/sitecore-jss-nextjs';
import camelCase from 'camelcase';
import { useRouter } from 'next/router';
import useAnalyticsTracking from 'hooks/useAnalyticsTracking';
import { useLoggedUser } from 'hooks/index';
import { useUserSession } from 'providers/index';
import { getUserFlag } from 'utils/userRoles';

import Scripts from 'src/Scripts';
import InPageNavigation from 'components/InPageNavigation';
import Modal from 'components/Modal/Modal';
import ShopperContextModal from 'components/ShopperContext/ShopperContextModal';
import { useScrollDirection, useSession } from 'hooks/index';
import { LayoutProvider, useHeaderNavigation } from 'providers/index';
import { RouteFields } from 'types/index';
import { formatUnixDate, isOldUserExternalId } from 'utils/index';
import { LayoutPropsExtended } from 'types/index';
import config from 'temp/config';
import { ACCOUNT_TYPE, ANALYTICS_EVENTS, LOGIN_STATUS, USER_ROLES } from './constants';

// Prefix public assets with a public URL to enable compatibility with Sitecore Experience Editor.
// If you're not supporting the Experience Editor, you can remove this.
const publicUrl = config.publicUrl;

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;
const ONETRUST_ID = process.env.NEXT_PUBLIC_ONETRUST_ENVIRONMENT;

const Layout = ({ layoutData, headLinks }: LayoutPropsExtended): JSX.Element => {
  const { route } = layoutData.sitecore;
  const fields = route?.fields as RouteFields;
  const { session, isSessionLoading } = useSession();

  const isPageEditing = layoutData.sitecore.context.pageEditing;
  const sortDate = formatUnixDate(fields?.articleDate);
  const mainClassPageEditing = isPageEditing ? 'editing-mode' : 'prod-mode';

  const ogTitle = fields?.ogTitle?.value?.toString()
    ? fields?.ogTitle?.value?.toString()
    : fields?.pageTitle?.value?.toString();

  const ogDescription = fields?.ogDescription?.value?.toString()
    ? fields?.ogDescription?.value?.toString()
    : fields?.pageDescription?.value?.toString();

  const enableInPageNavigation = fields?.enableInPageNavigation?.value;

  const { scrollDirection } = useScrollDirection();
  const { closeAllNavigation } = useHeaderNavigation();
  const noIndex = fields?.noIndex?.value ? 'noIndex,' : 'index,';
  const noFollow = fields?.noFollow?.value ? 'noFollow' : 'follow';
  const thumbnailImage = fields?.thumbnailImage?.value?.src ?? fields?.badgeLogoImage?.value?.src;
  const productType = fields?.formType?.fields?.Value?.value as string;
  const isStickyHeader = !['Cart', 'Checkout', 'Order Details'].includes(route?.name || '');

  const router = useRouter();
  const { track } = useAnalyticsTracking();
  const { currencyCode, userCountry } = useUserSession();
  const { isUserLoggedIn, externalID, isB2BAdminUser, isGettingUser } = useLoggedUser();
  const userFlag = getUserFlag(session);
  const hasTrackedPage = useRef({});
  const hasTrackedUserInfo = useRef({});

  useEffect(() => {
    if (layoutData.sitecore.route?.displayName) {
      closeAllNavigation();
    }
  }, [layoutData.sitecore.route?.displayName, closeAllNavigation]);

  const skipToContentButtonLabel = useMemo(() => {
    const rootPlaceholders = route?.placeholders;
    const headerDynaicPlaceholder = rootPlaceholders?.header?.find(
      (component: ComponentRendering) =>
        component.componentName === 'PartialDesignDynamicPlaceholder'
    ) as ComponentRendering;
    const headerContainer = headerDynaicPlaceholder?.placeholders?.['sxa-header']?.find(
      (component: ComponentRendering) => component.componentName === 'HeaderContainer'
    ) as ComponentRendering;
    const navigation = headerContainer?.placeholders?.['container-header-navigation']?.find(
      (component: ComponentRendering) => component.componentName === 'HeaderNavigation'
    ) as ComponentRendering;

    return navigation?.fields?.skipToContentButtonLabel as Field<string> | undefined;
  }, [route?.placeholders]);

  useEffect(() => {
    const handleRouteChange = (url: string) => {
      const pageViewTracking = {
        event: ANALYTICS_EVENTS.PAGE_VIEW,
        page: url,
      };

      if (JSON.stringify(pageViewTracking) !== hasTrackedPage.current) {
        hasTrackedPage.current = JSON.stringify(pageViewTracking);
        hasTrackedUserInfo.current = JSON.stringify({});
        track(pageViewTracking);
      }

      if (!isGettingUser && !isSessionLoading) {
        const userInfoTracking = {
          event: ANALYTICS_EVENTS.USER_INFO,
          currency: currencyCode,
          country: userCountry,
          login_status: isUserLoggedIn ? LOGIN_STATUS.LOGGED_IN : LOGIN_STATUS.LOGGED_OUT,
          ...(userFlag !== USER_ROLES.GUEST && { user_type: userFlag }),
          ...(isUserLoggedIn &&
            (isB2BAdminUser
              ? { account_type: ACCOUNT_TYPE.B2B }
              : { account_type: ACCOUNT_TYPE.B2C })),
        };

        if (JSON.stringify(userInfoTracking) !== hasTrackedUserInfo.current) {
          hasTrackedUserInfo.current = JSON.stringify(userInfoTracking);
          track(userInfoTracking);
        }
      }
    };

    handleRouteChange(router.asPath);

    if (externalID && isOldUserExternalId(externalID)) {
      router.push('/api/auth/federated-sign-out');
      return;
    }
  }, [
    track,
    router,
    currencyCode,
    userCountry,
    isUserLoggedIn,
    externalID,
    userFlag,
    isB2BAdminUser,
    isGettingUser,
    isSessionLoading,
  ]);

  useEffect(() => {
    if (scrollDirection === 'down') {
      closeAllNavigation();
    }
  }, [scrollDirection, closeAllNavigation]);

  return (
    <LayoutProvider fields={fields} isEditing={isPageEditing}>
      <Scripts />
      <Head>
        <title>{fields?.pageTitle?.value?.toString() || 'Page'}</title>
        <meta name="description" content={fields?.pageDescription?.value?.toString()} />
        <meta property="og:title" content={ogTitle} />
        <meta property="og:description" content={ogDescription} />
        {fields?.ogImage?.value?.src && (
          <meta property="og:image" content={fields?.ogImage?.value?.src} />
        )}
        <meta property="og:url" content={layoutData.sitecore.context?.canonicalUrl} />
        <meta name="twitter:card" content="summary"></meta>
        <meta name="twitter:site" content="@ISC2"></meta>
        <meta name="twitter:title" content={ogTitle} />
        <meta name="twitter:description" content={ogDescription} />
        {fields?.ogImage?.value?.src && (
          <meta name="twitter:image" content={fields?.ogImage?.value?.src} />
        )}
        <meta name="twitter:url" content={layoutData.sitecore.context?.canonicalUrl} />
        <meta name="templatename" content={camelCase(route?.templateName ?? '')} />
        <meta name="sortDate" content={sortDate.toString()} />
        {fields?.articleDate?.value && (
          <meta name="createdDate" content={fields?.articleDate?.value?.toLocaleString()} />
        )}
        {thumbnailImage && <meta property="thumbnailImage" content={thumbnailImage} />}
        <meta name="robots" content={`${noIndex} ${noFollow}`} />
        <link rel="icon" href={`${publicUrl}/favicon.ico`} />
        <link rel="canonical" href={layoutData.sitecore.context?.canonicalUrl}></link>

        {headLinks.map((headLink) => (
          <link rel={headLink.rel} key={headLink.href} href={headLink.href} />
        ))}

        {fields?.type?.value && (
          <meta name="genericType" content={fields?.type?.value?.toString()}></meta>
        )}

        {GTM_ID && (
          <script
            id="google_consent_mode"
            dangerouslySetInnerHTML={{
              __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){ dataLayer.push(arguments); }

              gtag('consent', 'default', {
                ad_storage: 'denied',
                analytics_storage: 'denied',
                functionality_storage:'denied',
                personalization_storage: 'denied',
                security_storage: 'granted',
                ad_user_data: 'denied',
                ad_personalization: 'denied',
              });

              gtag('consent', 'default', {
                analytics_storage: 'granted',
                functionality_storage: 'granted',
                personalization_storage: 'granted',
                security_storage: 'granted',
                region: ['CA']
              });

              gtag('consent', 'default', {
                ad_storage: 'denied',
                analytics_storage: 'denied',
                functionality_storage: 'denied',
                personalization_storage: 'denied',
                ad_user_data: 'denied',
                ad_personalization: 'denied',
                security_storage: 'granted',
                region: ['CA-QC']
              });

              gtag('consent', 'default', {
                ad_storage: 'granted',
                analytics_storage: 'granted',
                functionality_storage: 'granted',
                personalization_storage: 'granted',
                security_storage: 'granted',
                ad_user_data: 'granted',
                ad_personalization: 'granted',
                region: ['US']
              });
            `,
            }}
          />
        )}

        {ONETRUST_ID && (
          <>
            <script
              src="https://cdn.cookielaw.org/scripttemplates/otSDKStub.js"
              type="text/javascript"
              charSet="UTF-8"
              data-domain-script={ONETRUST_ID}
            />
            <script
              id="onetrust_optanon"
              dangerouslySetInnerHTML={{
                __html: `
                  function OptanonWrapper() {
                    pushCmpReadyEvent();
                    loadGTM();
                  }

                  function pushCmpReadyEvent() {
                    try {
                      const domainData = OneTrust?.GetDomainData?.();
                      const consentModel = domainData?.ConsentModel?.Name || null;
                      const consentCountry = domainData?.ConsentIntegrationData?.consentPayload?.dsDataElements?.Country || null;

                      window.dataLayer = window.dataLayer || [];
                      window.dataLayer.push({
                        event: 'cmp_ready',
                        consent_model: consentModel,
                        consent_country: consentCountry
                      });
                    } catch (e) {
                      console.warn('Failed to push cmp_ready event', e);

                      window.dataLayer = window.dataLayer || [];
                      window.dataLayer.push({
                        event: 'cmp_ready',
                        consent_model: null,
                        consent_country: null
                      });
                    }
                  }

                  function loadGTM() {
                    if (window.GTM_LOADED) {
                      return;
                    }
                    window.GTM_LOADED = true;

                    ${
                      GTM_ID
                        ? `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                      new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                      'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                    })(window,document,'script','dataLayer','${GTM_ID}');`
                        : ''
                    }
                  }`,
              }}
            />
          </>
        )}

        {fields?.jsonLd?.value && (
          <script type="application/ld+json">{fields?.jsonLd?.value?.toString()}</script>
        )}
        {fields?.productKey?.value && (
          <meta name="productKey" content={fields?.productKey?.value} />
        )}
        {fields?.sku?.value && <meta name="SKU" content={fields?.sku?.value} />}
        {productType && <meta name="productType" content={productType} />}
        {fields?.pageLanguage?.value && (
          <meta name="pageLanguage" content={fields?.pageLanguage?.value?.toString()}></meta>
        )}
      </Head>
      {route && <Placeholder name="body-scripts" rendering={route} />}

      <div className={mainClassPageEditing}>
        {skipToContentButtonLabel?.value && (
          <a
            href="#content"
            className="absolute left-0 -top-3 rounded-lg primary-cta bpy-2 px-4 z-[9999] transform -translate-y-full focus:translate-y-0 transition focus:top-3"
          >
            {skipToContentButtonLabel?.value}
          </a>
        )}
        <div className="alert-notification">
          {route && <Placeholder name="alert-notification" rendering={route} />}
        </div>
        <Modal />
        <ShopperContextModal />
        <header
          className={clsx(
            isStickyHeader && 'sticky w-full z-header duration-500 transition-all',
            isStickyHeader && scrollDirection === 'down' ? '!-top-32' : '!top-0'
          )}
        >
          {route && <Placeholder name="header" rendering={route} />}
        </header>
        <main id="content">
          {route && <Placeholder name="main-content-top" rendering={route} />}

          {route && <Placeholder name="main-content" rendering={route} layoutFields={fields} />}

          <div className="md:flex">
            <section id="left-content" className="relative">
              {enableInPageNavigation && <InPageNavigation />}
              {route && <Placeholder name="main-content-left" rendering={route} />}
            </section>

            <section id="right-content">
              {route && <Placeholder name="main-content-right" rendering={route} />}
            </section>
          </div>
        </main>
        <footer>
          <div id="footer">{route && <Placeholder name="footer" rendering={route} />}</div>
        </footer>
      </div>
    </LayoutProvider>
  );
};

export default Layout;
