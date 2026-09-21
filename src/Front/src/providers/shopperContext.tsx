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
   * `false` until the stored selection has actually been read. `shopperContext` is
   * `null` both before that read and when nothing is stored, so consumers that must
   * not act on a premature "no organization" need this to tell the two apart.
   */
  isShopperContextResolved: boolean;
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
  isShopperContextResolved: false,
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
  const { externalID, isUserLoggedIn, isGettingUser } = useLoggedUser();
  const [shopperContext, setShopperContextState] = useState<ShopperContextSelection | null>(null);
  const [isShopperContextResolved, setIsShopperContextResolved] = useState(false);

  useEffect(() => {
    // `isUserLoggedIn` reads false while the session or the Salesforce user query is
    // still in flight, exactly as it does for a signed-out visitor, so neither it nor
    // the resulting `null` context can be treated as an answer until both have settled.
    if (isSessionLoading || isGettingUser) {
      return;
    }

    if (!isUserLoggedIn) {
      setShopperContextState(null);
      setIsShopperContextResolved(true);
      return;
    }

    if (!externalID) {
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
    // Set in the same commit as the selection above: a separate effect would leave one
    // painted frame where the context is resolved but still empty.
    setIsShopperContextResolved(true);
  }, [isSessionLoading, isGettingUser, isUserLoggedIn, externalID]);

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
      isShopperContextResolved,
      setShopperContext,
      clearShopperContext,
    }),
    [shopperContext, isShopperContextResolved, setShopperContext, clearShopperContext]
  );

  return <ShopperContext.Provider value={value}>{children}</ShopperContext.Provider>;
};

const useShopperContext = () => useContext(ShopperContext);

export { ShopperContextProvider, useShopperContext };
