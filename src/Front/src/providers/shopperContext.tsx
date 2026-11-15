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
import { SHOPPER_CONTEXT_COOKIE, SHOPPER_CONTEXT_STORAGE_KEY } from 'constants/index';

export type ShoppingContextType = 'myself' | 'organization';

export type ShopperOrganization = {
  id: string;
  name: string;
  creditHold?: boolean;
  accountType?: string;
  currency?: string;
  pricingTier?: string;
  taxId?: string;
  intacctCustomerId?: string;
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
  /**
   * False until the stored organization has been read for the current session.
   * Callers that branch on organization vs individual must wait, or the individual
   * branch paints first.
   */
  isShopperContextReady: boolean;
  setShopperContext: (selection: ShopperContextSelection) => void;
  clearShopperContext: () => void;
};

const writeContextCookie = (type: ShoppingContextType) => {
  if (typeof document === 'undefined') {
    return;
  }

  document.cookie = `${SHOPPER_CONTEXT_COOKIE}=${type}; path=/; SameSite=Lax${
    window.location.protocol === 'https:' ? '; Secure' : ''
  }`;
};

const removeContextCookie = () => {
  if (typeof document === 'undefined') {
    return;
  }

  document.cookie = `${SHOPPER_CONTEXT_COOKIE}=; path=/; Max-Age=0; SameSite=Lax`;
};

const ShopperContext = createContext<ShopperContextProps>({
  shopperContext: null,
  isShopperContextReady: false,
  setShopperContext: () => {},
  clearShopperContext: () => {},
});

const parseStoredContext = (raw: string | null, userId: string): ShopperContextSelection | null => {
  if (!raw) {
    return null;
  }

  try {
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

const readStoredContext = (userId?: string): ShopperContextSelection | null => {
  if (typeof window === 'undefined' || !userId) {
    return null;
  }

  const fromLocal = parseStoredContext(localStorage.getItem(SHOPPER_CONTEXT_STORAGE_KEY), userId);
  if (fromLocal) {
    return fromLocal;
  }

  const fromSession = parseStoredContext(
    sessionStorage.getItem(SHOPPER_CONTEXT_STORAGE_KEY),
    userId
  );
  if (fromSession) {
    writeStoredContext(userId, fromSession);
    sessionStorage.removeItem(SHOPPER_CONTEXT_STORAGE_KEY);
    return fromSession;
  }

  return null;
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

  localStorage.setItem(SHOPPER_CONTEXT_STORAGE_KEY, JSON.stringify(payload));
  sessionStorage.removeItem(SHOPPER_CONTEXT_STORAGE_KEY);
  writeContextCookie(selection.type);
};

const removeStoredContext = () => {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem(SHOPPER_CONTEXT_STORAGE_KEY);
  sessionStorage.removeItem(SHOPPER_CONTEXT_STORAGE_KEY);
  removeContextCookie();
};

type ShopperContextProviderProps = {
  children: ReactNode;
};

const ShopperContextProvider = ({ children }: ShopperContextProviderProps) => {
  const { session, isSessionLoading } = useSession();
  const { externalID } = useLoggedUser();
  const [shopperContext, setShopperContextState] = useState<ShopperContextSelection | null>(null);
  // User id whose stored context has been applied. Empty string means a settled logged-out session.
  const [resolvedUserId, setResolvedUserId] = useState<string | null>(null);
  const activeUserId = externalID ?? '';
  const isShopperContextReady = !isSessionLoading && resolvedUserId === activeUserId;

  useEffect(() => {
    if (isSessionLoading) {
      return;
    }

    // Read storage from the session user id. Waiting for the Salesforce profile
    // (`isUserLoggedIn`) is slower than the order query, and that gap painted the
    // individual confirmation before the business one.
    if (!externalID) {
      setShopperContextState(null);
      setResolvedUserId('');
      return;
    }

    setShopperContextState((current) => {
      if (current) {
        writeStoredContext(externalID, current);
        return current;
      }

      const stored = readStoredContext(externalID);

      if (stored) {
        writeContextCookie(stored.type);
      }

      return stored;
    });
    setResolvedUserId(externalID);
  }, [isSessionLoading, externalID]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const onStorage = (event: StorageEvent) => {
      if (event.key !== SHOPPER_CONTEXT_STORAGE_KEY || !externalID) {
        return;
      }

      if (event.newValue === null) {
        setShopperContextState(null);
        removeContextCookie();
        return;
      }

      const next = parseStoredContext(event.newValue, externalID);
      setShopperContextState(next);

      if (next) {
        writeContextCookie(next.type);
      } else {
        removeContextCookie();
      }
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [externalID]);

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
      isShopperContextReady,
      setShopperContext,
      clearShopperContext,
    }),
    [shopperContext, isShopperContextReady, setShopperContext, clearShopperContext]
  );

  return <ShopperContext.Provider value={value}>{children}</ShopperContext.Provider>;
};

const useShopperContext = () => useContext(ShopperContext);

export { ShopperContextProvider, useShopperContext };
