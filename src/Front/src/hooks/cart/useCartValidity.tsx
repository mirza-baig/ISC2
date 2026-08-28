import { useMemo } from 'react';

import { useCart } from 'providers/index';
import { useLoggedUser } from 'hooks/index';

interface UseCartValidityProps {
  isCheckout: boolean;
}

export default function useCartValidity({ isCheckout }: UseCartValidityProps) {
  const { activeCart, getCartSuccess, isIdURLParamDefined } = useCart();
  const { user } = useLoggedUser();

  const cartError = useMemo(() => {
    if (!getCartSuccess) {
      return null;
    }

    if (!activeCart.id) {
      return [{ message: 'CART_NOT_FOUND' }];
    }

    if (activeCart.cartState !== 'Active') {
      return [{ message: 'CART_NOT_LONGER_ACTIVE' }];
    }

    if (isIdURLParamDefined && !activeCart.computed.isB2B) {
      return [{ message: 'CART_IS_NOT_B2B' }];
    }

    if (
      isCheckout &&
      activeCart.customerEmail &&
      user?.email &&
      activeCart.customerEmail !== user.email
    ) {
      return [{ message: 'CUSTOMER_EMAIL_MISMATCH' }];
    }

    return null;
  }, [getCartSuccess, activeCart, isIdURLParamDefined, isCheckout, user?.email]);

  return { cartError };
}
