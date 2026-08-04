import { initServer } from '@sitecore/engage';
import { ISettingsParamsServer } from '@sitecore/engage/types/lib/settings/settings';

const engageSettings: ISettingsParamsServer = {
  clientKey: process.env.NEXT_PUBLIC_ENGAGE_CLIENT_KEY!,
  targetURL: process.env.NEXT_PUBLIC_ENGAGE_TARGET_URL!,
  pointOfSale: process.env.NEXT_PUBLIC_ENGAGE_TARGET_POS!,
  cookieExpiryDays: 365,
  forceServerCookieMode: true,
};

export const engageServer = initServer(engageSettings);
