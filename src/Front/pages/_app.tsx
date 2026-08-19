import type { AppProps } from 'next/app';
import { I18nProvider } from 'next-localization';
import { SitecorePageProps } from 'lib/page-props';
import { Open_Sans } from 'next/font/google';
import { SessionProvider } from 'next-auth/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRef } from 'react';
import Bootstrap from 'src/Bootstrap';
import { useGlobalCSS } from 'hooks/useGlobalCSS';
import { FeatureFlagsProvider } from 'providers/featureFlags';

import {
  PersonalizeProvider,
  ModalProvider,
  UserSessionProvider,
  HeaderNavigationProvider,
  SearchProvider,
  StandalonePricesProvider,
  IdleTimeoutProvider,
  ShopperContextProvider,
} from 'providers/index';

import 'styles/globals.css';
import 'swiper/css';

const openSans = Open_Sans({
  subsets: ['latin'],
  variable: '--font-open-sans',
});

function App({ Component, pageProps: { session, ...pageProps } }: AppProps<SitecorePageProps>) {
  const { dictionary, ...rest } = pageProps;

  const queryClient = useRef(new QueryClient());

  // Load global CSS
  useGlobalCSS();

  return (
    <>
      <Bootstrap {...pageProps} />

      {/*
        // Use the next-localization (w/ rosetta) library to provide our translation dictionary to the app.
        // Note Next.js does not (currently) provide anything for translation, only i18n routing.
        // If your app is not multilingual, next-localization and references to it can be removed.
      */}

      <QueryClientProvider client={queryClient.current}>
        <SessionProvider session={session} refetchInterval={15 * 60}>
          <IdleTimeoutProvider>
            <UserSessionProvider>
              <ShopperContextProvider>
                <StandalonePricesProvider>
                  <HeaderNavigationProvider>
                    <SearchProvider>
                      <PersonalizeProvider>
                        <ModalProvider>
                          <FeatureFlagsProvider flags={pageProps.featureFlags}>
                            <I18nProvider lngDict={dictionary} locale={pageProps.locale}>
                              <div className={`${openSans.variable} font-sans flex flex-col`}>
                                <Component {...rest} />
                              </div>
                            </I18nProvider>
                          </FeatureFlagsProvider>
                        </ModalProvider>
                      </PersonalizeProvider>
                    </SearchProvider>
                  </HeaderNavigationProvider>
                </StandalonePricesProvider>
              </ShopperContextProvider>
            </UserSessionProvider>
          </IdleTimeoutProvider>
        </SessionProvider>
      </QueryClientProvider>
    </>
  );
}

export default App;
