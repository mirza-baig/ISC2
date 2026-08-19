/* eslint-disable @typescript-eslint/no-empty-function */
import { createContext, useCallback, useContext, useMemo } from 'react';

import { useGetCart } from 'hooks/index';
import { Cart, CartWithComputedData } from 'types/index';
import { CurrencyCodes, getCurrencyByCountryCode } from 'utils/currencies';

import { useUserSession } from './userSession';
import { FREE_PRICE } from 'constants/index';

type CartContextProps = {
  activeCart: CartWithComputedData;
  isGettingCart: boolean;
  cartError: Error | null;
  getCartSuccess: boolean;
  isIdURLParamDefined: boolean;
  isFreeOrder: boolean;
};

const CartContext = createContext<CartContextProps>({
  activeCart: {} as CartWithComputedData,
  isGettingCart: false,
  cartError: null,
  getCartSuccess: false,
  isIdURLParamDefined: false,
  isFreeOrder: false,
});

type ConditionalProps =
  | {
      overrideWithCart?: never;
      id?: string;
    }
  | {
      overrideWithCart: CartWithComputedData;
      id?: never;
    };

type CartProviderProps = { children: React.ReactNode } & ConditionalProps;

const CartProvider: React.FC<CartProviderProps> = ({ id, children, overrideWithCart }) => {
  const {
    cartId,
    currencyCode,
    userCountry,
    setCartId,
    syncCurrencyCode,
    setIsCurrencyManualOverride,
  } = useUserSession();

  const getPayloadForUserActiveCart = useCallback(() => {
    if (Boolean(cartId)) {
      return { cartID: cartId, enabled: true };
    }

    return {
      currency: currencyCode,
      country: userCountry,
      enabled: Boolean(currencyCode && userCountry),
    };
  }, [cartId, currencyCode, userCountry]);

  const getCartPayload = useMemo(() => {
    /*
      If we need to override the active cart with an specific cart
      information, for example within the order details page
    */
    if (overrideWithCart) {
      return { enabled: false };
    }

    /*
      If id is defined it means that we are in the B2B flow
      so instead of using the user's cart id we need to use
      the url param one (with no user email included so the cart is not
      assigned to them)
    */
    if (id) {
      return { cartID: id, enabled: true, includeUserEmail: false };
    }

    /*
      If none of the above, then we need to use the user session's
      info for getting the active cart
    */
    return {
      includeUserEmail: true,
      ...getPayloadForUserActiveCart(),
      onSuccess: (cart: Cart) => {
        if (cart && cart.id !== cartId) {
          setCartId(cart.id);
        }

        const cartCurrency = cart?.totalPrice?.currencyCode as CurrencyCodes | undefined;
        if (!cartCurrency || !CurrencyCodes[cartCurrency]) {
          return;
        }

        const hasLineItems = Boolean(cart?.lineItems?.length);

        // Only inherit currency from carts that actually have items. An empty cart can
        // retain a stale currency (e.g. GBP) and that breaks US-channel price lookups.
        if (hasLineItems) {
          if (cartCurrency !== currencyCode) {
            syncCurrencyCode(cartCurrency);
          }
          return;
        }

        if (!userCountry) {
          return;
        }

        const countryCurrency = getCurrencyByCountryCode(userCountry);
        if (countryCurrency !== currencyCode) {
          syncCurrencyCode(countryCurrency);
          // Prior empty-cart syncs used setCurrencyCode and incorrectly locked override.
          setIsCurrencyManualOverride(false);
        }
      },
    };
  }, [
    cartId,
    currencyCode,
    getPayloadForUserActiveCart,
    id,
    overrideWithCart,
    setCartId,
    setIsCurrencyManualOverride,
    syncCurrencyCode,
    userCountry,
  ]);

  const { activeCart, isGettingCart, cartError, getCartSuccess } = useGetCart(getCartPayload);

  const isFreeOrder = useMemo(() => {
    return overrideWithCart
      ? overrideWithCart.computed?.totalPrice === FREE_PRICE
      : activeCart.computed?.totalPrice === FREE_PRICE;
  }, [activeCart, overrideWithCart]);

  return (
    <CartContext.Provider
      value={{
        activeCart: overrideWithCart ?? activeCart,
        isGettingCart: overrideWithCart ? false : isGettingCart,
        isIdURLParamDefined: Boolean(id),
        getCartSuccess,
        cartError,
        isFreeOrder,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

const useCart = () => useContext(CartContext);

export { CartProvider, useCart };
