export const ONETRUST_SDK_STUB_SRC = 'https://cdn.cookielaw.org/scripttemplates/otSDKStub.js';

export const GOOGLE_CONSENT_MODE_SCRIPT = `
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
            `;

export const buildOptanonWrapperScript = (gtmId?: string): string => `
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
                    gtmId
                      ? `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                  })(window,document,'script','dataLayer','${gtmId}');`
                      : ''
                  }
                }`;
