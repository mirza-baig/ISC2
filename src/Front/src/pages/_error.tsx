/* eslint-disable @next/next/next-script-for-ga, @next/next/no-sync-scripts */
import { NextPage } from 'next';
import Head from 'next/head';

interface ErrorPageProps {
  statusCode?: number | null | undefined;
}

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;
const ONETRUST_ID = process.env.NEXT_PUBLIC_ONETRUST_ENVIRONMENT;

/**
 * Rendered for 500 errors on both server and client. Used only in Production mode.
 * @link https://nextjs.org/docs/advanced-features/custom-error-page#more-advanced-error-page-customizing
 */
const ErrorPage: NextPage<ErrorPageProps> = ({ statusCode }) => (
  <>
    <Head>
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

      <title>Error</title>
    </Head>
    <div style={{ padding: 10 }}>
      <h1>An error occurred</h1>
      <p>
        {statusCode
          ? `A server-side ${statusCode} error occurred.`
          : 'A client-side error occurred.'}
      </p>
      <a href="/">Go to the Home page</a>
    </div>
  </>
);

ErrorPage.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;

  return { statusCode };
};

export default ErrorPage;
