import { BUYER_SCENARIO_ACCOUNTS } from './scenarios';
import {
  DEFAULT_BUYER_MOCK_SCENARIO,
  isBuyerMockScenario,
  type AuthorizedBuyerResponse,
  type BuyerMockScenario,
} from './types';

export const BUYER_MOCK_SCENARIO_SESSION_KEY = 'buyer-mock-scenario-isc2';

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
};

/**
 * Temporary Authorized Buyer fetch.
 * Swap the body for a CloudHub/MuleSoft call when the service is available;
 * keep the return type stable.
 */
export const getAuthorizedBuyerAccounts = async (
  buyerId: string,
  options?: GetAuthorizedBuyerAccountsOptions
): Promise<AuthorizedBuyerResponse> => {
  const scenario = resolveBuyerMockScenario(options?.scenario);
  const accounts = BUYER_SCENARIO_ACCOUNTS[scenario];

  return {
    buyerId: buyerId || '003xx0000123456',
    accounts: accounts.map((account) => ({ ...account })),
  };
};
