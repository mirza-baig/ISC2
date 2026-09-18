import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react';

import { useLoggedUser } from 'hooks/index';
import {
  buildCartContextKey,
  isCartContextEnabled,
  readCartId,
  writeCartId,
} from 'utils/cartIdStore';

import { useShopperContext } from './shopperContext';
import { useUserSession } from './userSession';

type CartIdentityContextProps = {
  cartContextKey: string;
  businessAccountId?: string;
};

const CartIdentityContext = createContext<CartIdentityContextProps>({
  cartContextKey: '',
  businessAccountId: undefined,
});

type CartIdentityProviderProps = {
  children: ReactNode;
};

const CartIdentityProvider = ({ children }: CartIdentityProviderProps) => {
  const { externalID } = useLoggedUser();
  const { shopperContext } = useShopperContext();
  const { cartId, setCartId } = useUserSession();

  const businessAccountId =
    shopperContext?.type === 'organization' ? shopperContext?.organization?.id : undefined;

  const cartContextKey = isCartContextEnabled()
    ? buildCartContextKey(externalID, businessAccountId)
    : '';

  const appliedKeyRef = useRef<string>('');
  const staleCartIdRef = useRef<string>('');
  const cartIdRef = useRef<string | undefined>(cartId);

  cartIdRef.current = cartId;

  useEffect(() => {
    if (!cartContextKey || appliedKeyRef.current === cartContextKey) {
      return;
    }

    appliedKeyRef.current = cartContextKey;
    staleCartIdRef.current = cartIdRef.current || '';

    const stored = readCartId(cartContextKey);

    if (stored) {
      writeCartId(cartContextKey, stored);
    }

    if (stored !== cartIdRef.current) {
      setCartId(stored);
    }
  }, [cartContextKey, setCartId]);

  useEffect(() => {
    if (!cartContextKey || !cartId || appliedKeyRef.current !== cartContextKey) {
      return;
    }

    if (cartId === staleCartIdRef.current) {
      return;
    }

    writeCartId(cartContextKey, cartId);
  }, [cartContextKey, cartId]);

  const value = useMemo(
    () => ({ cartContextKey, businessAccountId }),
    [cartContextKey, businessAccountId]
  );

  return <CartIdentityContext.Provider value={value}>{children}</CartIdentityContext.Provider>;
};

const useCartIdentity = () => useContext(CartIdentityContext);

export { CartIdentityProvider, useCartIdentity };
