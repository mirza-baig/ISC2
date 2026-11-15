/**
 * @jest-environment jsdom
 */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

import useActiveBusinessAccount from 'hooks/user/useActiveBusinessAccount';

let mockIsB2BFeatureEnabled = false;
let mockQueryEnabled: boolean | undefined;

jest.mock('@tanstack/react-query', () => ({
  useQuery: (options: { enabled?: boolean }) => {
    mockQueryEnabled = options.enabled;
    return { data: undefined, refetch: jest.fn() };
  },
}));
jest.mock('providers/featureFlags', () => ({
  useFeatureFlag: () => mockIsB2BFeatureEnabled,
}));
jest.mock('providers/index', () => ({
  useCart: () => ({ activeCart: { lineItems: [] } }),
  useShopperContext: () => ({
    shopperContext: { type: 'organization', organization: { id: 'acct-1', name: 'Acme' } },
  }),
}));
jest.mock('hooks/useLoggedUser', () => ({
  __esModule: true,
  default: () => ({ externalID: 'ext-1', email: 'buyer@example.com' }),
}));
jest.mock('lib/authorizedBuyer', () => ({
  getAuthorizedBuyerAccounts: jest.fn(),
  isAccountFlagSet: (value?: boolean | string | null) => value === true,
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

const Harness = () => {
  useActiveBusinessAccount();
  return null;
};

const renderHarness = () => {
  act(() => {
    root.render(<Harness />);
  });
};

describe('useActiveBusinessAccount', () => {
  beforeEach(() => {
    mockQueryEnabled = undefined;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('does not fetch accounts for a stored organization when the B2B flag is off', () => {
    mockIsB2BFeatureEnabled = false;
    renderHarness();

    expect(mockQueryEnabled).toBe(false);
  });

  it('fetches accounts for the selected organization when the B2B flag is on', () => {
    mockIsB2BFeatureEnabled = true;
    renderHarness();

    expect(mockQueryEnabled).toBe(true);
  });
});
