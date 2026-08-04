/* eslint-disable @typescript-eslint/no-empty-function */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { useLoggedUser, useSession } from 'hooks/index';

export type ShoppingContextType = 'myself' | 'organization';

export type ShopperOrganization = {
  id: string;
  name: string;
  // From Authorized Buyer account; mocked until MuleSoft is wired.
  creditHold?: boolean;
  accountType?: string;
  currency?: string;
  pricingTier?: string;
};

export type ShopperContextSelection = {
  type: ShoppingContextType;
  organization: ShopperOrganization | null;
};

type StoredShopperContext = ShopperContextSelection & {
  userId: string;
};

type ShopperContextProps = {
  shopperContext: ShopperContextSelection | null;
  setShopperContext: (selection: ShopperContextSelection) => void;
  clearShopperContext: () => void;
};

const STORAGE_KEY = 'b2b-shopper-context';

const ShopperContext = createContext<ShopperContextProps>({
  shopperContext: null,
  setShopperContext: () => {},
  clearShopperContext: () => {},
});

const readStoredContext = (userId?: string): ShopperContextSelection | null => {
  if (typeof window === 'undefined' || !userId) {
    return null;
  }

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as StoredShopperContext;
    if (parsed.userId !== userId) {
      return null;
    }

    return {
      type: parsed.type,
      organization: parsed.organization ?? null,
    };
  } catch {
    return null;
  }
};

const writeStoredContext = (userId: string, selection: ShopperContextSelection) => {
  if (typeof window === 'undefined') {
    return;
  }

  const payload: StoredShopperContext = {
    userId,
    type: selection.type,
    organization: selection.organization,
  };

  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
};

const removeStoredContext = () => {
  if (typeof window === 'undefined') {
    return;
  }

  sessionStorage.removeItem(STORAGE_KEY);
};

type ShopperContextProviderProps = {
  children: ReactNode;
};

const ShopperContextProvider = ({ children }: ShopperContextProviderProps) => {
  const { session, isSessionLoading } = useSession();
  const { externalID, isUserLoggedIn } = useLoggedUser();
  const [shopperContext, setShopperContextState] = useState<ShopperContextSelection | null>(null);

  useEffect(() => {
    if (!isUserLoggedIn) {
      setShopperContextState(null);
      return;
    }

    if (!externalID) {
      return;
    }

    // Prefer an in-memory selection (e.g. just confirmed "Myself") and persist it once
    // externalID is available, so a late profile load cannot restore a prior organization.
    setShopperContextState((current) => {
      if (current) {
        writeStoredContext(externalID, current);
        return current;
      }

      return readStoredContext(externalID);
    });
  }, [isUserLoggedIn, externalID]);

  // Clear only on real NextAuth logout — not while Salesforce profile is still loading.
  useEffect(() => {
    if (isSessionLoading) {
      return;
    }

    const sessionUserId = session?.user?.custom_attributes?.user_id;

    if (!sessionUserId) {
      setShopperContextState(null);
      removeStoredContext();
    }
  }, [isSessionLoading, session?.user?.custom_attributes?.user_id]);

  const setShopperContext = useCallback(
    (selection: ShopperContextSelection) => {
      setShopperContextState(selection);

      if (externalID) {
        writeStoredContext(externalID, selection);
      }
    },
    [externalID]
  );

  const clearShopperContext = useCallback(() => {
    setShopperContextState(null);
    removeStoredContext();
  }, []);

  const value = useMemo(
    () => ({
      shopperContext,
      setShopperContext,
      clearShopperContext,
    }),
    [shopperContext, setShopperContext, clearShopperContext]
  );

  return <ShopperContext.Provider value={value}>{children}</ShopperContext.Provider>;
};

const useShopperContext = () => useContext(ShopperContext);

export { ShopperContextProvider, useShopperContext };
