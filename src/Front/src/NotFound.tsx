/* eslint-disable @next/next/next-script-for-ga, @next/next/no-sync-scripts */
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;
const ONETRUST_ID = process.env.NEXT_PUBLIC_ONETRUST_ENVIRONMENT;
const pageNotFoundUrl = `${process.env.NEXT_PUBLIC_PAGE_NOT_FOUND_URL}`;
/**
 * Rendered in case if we have 404 error
 */
const NotFound = (): JSX.Element => {
  const router = useRouter();
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (window.location.pathname.toLowerCase() != pageNotFoundUrl.toLowerCase()) {
        router.replace(pageNotFoundUrl);
      }
    }
  });
  return (
    <>
      <Head>
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

        <title>404: NotFound</title>
      </Head>
    </>
  );
};
export default NotFound;
