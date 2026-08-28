import {
  mapAccountContactRelationsToAccounts,
  mergeLiveAndMockAccounts,
} from './mapFromAccountContactRelations';
import { BUYER_SCENARIO_ACCOUNTS } from './scenarios';
import {
  DEFAULT_BUYER_MOCK_SCENARIO,
  isBuyerMockScenario,
  type AuthorizedBuyerAccount,
  type AuthorizedBuyerResponse,
  type BuyerMockScenario,
} from './types';

export const BUYER_MOCK_SCENARIO_SESSION_KEY = 'buyer-mock-scenario-isc2';
export const BUYER_MOCK_RACE_DEPLETE_KEY = 'buyer-mock-race-deplete-isc2';

let raceDepleteMarked = false;

const persistRaceDeplete = (value: boolean) => {
  raceDepleteMarked = value;

  try {
    if (value) {
      sessionStorage.setItem(BUYER_MOCK_RACE_DEPLETE_KEY, '1');
    } else {
      sessionStorage.removeItem(BUYER_MOCK_RACE_DEPLETE_KEY);
    }
  } catch {
    // Tests / SSR have no sessionStorage.
  }
};

/** QA: `?buyerScenario=race` then Confirm purchase. Next race-scenario read has $0 prepaid/credit. */
export const markBuyerMockRaceDeplete = () => {
  persistRaceDeplete(true);
};

export const clearBuyerMockRaceDeplete = () => {
  persistRaceDeplete(false);
};

export const depleteMockBalancesForRace = (
  account: AuthorizedBuyerAccount
): AuthorizedBuyerAccount => ({
  ...account,
  prepaid: account.prepaid ? { ...account.prepaid, balance: 0 } : account.prepaid,
  credit: {
    ...account.credit,
    availableCredit: 0,
    creditBalance: account.credit.creditLimit,
  },
});

const shouldDepleteMockBalancesForRace = (scenario: BuyerMockScenario) => {
  if (scenario !== 'race') {
    return false;
  }

  if (raceDepleteMarked) {
    return true;
  }

  try {
    return sessionStorage.getItem(BUYER_MOCK_RACE_DEPLETE_KEY) === '1';
  } catch {
    return false;
  }
};

/**
   logout clears this scenario.
 */
const resolveScenarioFromQuery = (): BuyerMockScenario | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const value = new URLSearchParams(window.location.search).get('buyerScenario');
    if (value && isBuyerMockScenario(value)) {
      sessionStorage.setItem(BUYER_MOCK_SCENARIO_SESSION_KEY, value);
      return value;
    }

    const stored = sessionStorage.getItem(BUYER_MOCK_SCENARIO_SESSION_KEY);
    if (stored && isBuyerMockScenario(stored)) {
      return stored;
    }
  } catch {
    // Ignore malformed URL / non-browser edge cases.
  }

  return null;
};

const resolveScenarioFromEnv = (): BuyerMockScenario | null => {
  const value = process.env.NEXT_PUBLIC_BUYER_MOCK_SCENARIO;
  if (value && isBuyerMockScenario(value)) {
    return value;
  }

  return null;
};

/** Query param wins, then env, then default (`many`). */
export const resolveBuyerMockScenario = (explicitScenario?: BuyerMockScenario): BuyerMockScenario =>
  explicitScenario ??
  resolveScenarioFromQuery() ??
  resolveScenarioFromEnv() ??
  DEFAULT_BUYER_MOCK_SCENARIO;

export type GetAuthorizedBuyerAccountsOptions = {
  /** Force a scenario (tests / Storybook). Otherwise query → env → default. */
  scenario?: BuyerMockScenario;
  /** Contact email for live `getAccountData`. Required to merge Salesforce orgs. */
  email?: string;
  /** Skip the live Mule call (unit tests). */
  includeLiveAccounts?: boolean;
};

const fetchLiveAuthorizedBuyerAccounts = async (
  buyerId: string,
  email?: string
): Promise<AuthorizedBuyerAccount[]> => {
  if (typeof window === 'undefined' || !buyerId || !email) {
    return [];
  }

  try {
    const response = await fetch(
      `/api/salesforce/user/getAccountData?externalID=${encodeURIComponent(
        buyerId
      )}&email=${encodeURIComponent(email)}`
    );

    if (!response.ok) {
      return [];
    }

    const payload = await response.json();
    const relations = payload?.data?.salesforceGetAccountData?.accountContactRelations;

    return mapAccountContactRelationsToAccounts(relations);
  } catch (error) {
    console.error('Failed to load live authorized buyer accounts', error);

    return [];
  }
};

/**
 * Live Salesforce orgs from `getAccountData`, then the mock playbook.
 * Live first so QA can pick Test OTP / hold accounts from the same payload they inspect.
 */
export const getAuthorizedBuyerAccounts = async (
  buyerId: string,
  options?: GetAuthorizedBuyerAccountsOptions
): Promise<AuthorizedBuyerResponse> => {
  const scenario = resolveBuyerMockScenario(options?.scenario);
  const mockAccounts = BUYER_SCENARIO_ACCOUNTS[scenario].map((account) =>
    shouldDepleteMockBalancesForRace(scenario)
      ? depleteMockBalancesForRace({ ...account })
      : { ...account }
  );
  const includeLiveAccounts = options?.includeLiveAccounts !== false;
  const liveAccounts = includeLiveAccounts
    ? await fetchLiveAuthorizedBuyerAccounts(buyerId, options?.email)
    : [];

  return {
    buyerId: buyerId || '003xx0000123456',
    accounts: mergeLiveAndMockAccounts(liveAccounts, mockAccounts),
  };
};
