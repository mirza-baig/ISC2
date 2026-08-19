/* eslint-disable @typescript-eslint/no-empty-function */
import { Engage, init } from '@sitecore/engage';
import { getCookie } from 'cookies-next';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type PersonalizeContextProps = {
  engage?: Engage;
  pageView: () => void;
  personalize: (friendlyId: string) => Promise<unknown>;
};

const PersonalizeContext = createContext<PersonalizeContextProps>({
  engage: undefined,
  pageView: () => {},
  personalize: async () => {},
});

type PersonalizeProviderProps = {
  children: React.ReactNode;
};

const CHANNEL = 'WEB';
const CURRENCY = 'USD';
const LANGUAGE = 'EN';

const PersonalizeProvider: React.FC<PersonalizeProviderProps> = ({ children }) => {
  const [engage, setEngage] = useState<Engage>();

  const cookiesAccepted = useMemo(() => {
    if (process.env.NODE_ENV === 'development') {
      return true;
    }

    const cookieValue = getCookie('OptanonConsent');

    if (typeof cookieValue === 'string') {
      const params = new URLSearchParams(cookieValue);
      const groups = params.get('groups');

      if (groups) {
        const values = groups.split(',');

        return values.includes('C0003:1');
      }
    }

    return false;
  }, []);

  const loadEngage = useCallback(async () => {
    const engageClient = await init({
      clientKey: process.env.NEXT_PUBLIC_ENGAGE_CLIENT_KEY!,
      targetURL: process.env.NEXT_PUBLIC_ENGAGE_TARGET_URL!,
      pointOfSale: process.env.NEXT_PUBLIC_ENGAGE_TARGET_POS!,
      forceServerCookieMode: true,
      includeUTMParameters: true,
      webPersonalization: true,
    });

    setEngage(engageClient);
  }, []);

  const pageView = useCallback(() => {
    if (engage) {
      engage.pageView({
        channel: CHANNEL,
        currency: CURRENCY,
      });
    }
  }, [engage]);

  const personalize = useCallback(
    async (friendlyId: string) => {
      if (engage && cookiesAccepted) {
        return engage.personalize({
          friendlyId,
          channel: CHANNEL,
          currency: CURRENCY,
          language: LANGUAGE,
        });
      }
    },
    [engage, cookiesAccepted]
  );

  useEffect(() => {
    if (!engage) {
      loadEngage();
    }
  }, [loadEngage, engage]);

  return (
    <PersonalizeContext.Provider
      value={{
        engage,
        pageView,
        personalize,
      }}
    >
      {children}
    </PersonalizeContext.Provider>
  );
};

const usePersonalize = () => useContext(PersonalizeContext);

export { PersonalizeProvider, usePersonalize };
