import { useMemo } from 'react';

import { B2B_FEATURE_FLAG } from 'constants/b2b';
import { useCart } from 'providers/index';
import { useFeatureFlag } from 'providers/featureFlags';
import { useLoggedUser } from 'hooks/index';

interface UseCartValidityProps {
  isCheckout: boolean;
}

export default function useCartValidity({ isCheckout }: UseCartValidityProps) {
  const { activeCart, getCartSuccess, isIdURLParamDefined } = useCart();
  const { user } = useLoggedUser();
  const isB2BFeatureEnabled = useFeatureFlag(B2B_FEATURE_FLAG);

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

    if (
      !isB2BFeatureEnabled &&
      isCheckout &&
      activeCart.computed.isB2B &&
      activeCart.taxedPrice === null
    ) {
      return [{ message: 'CART_INFO_INCOMPLETE' }];
    }

    return null;
  }, [
    getCartSuccess,
    activeCart,
    isIdURLParamDefined,
    isCheckout,
    user?.email,
    isB2BFeatureEnabled,
  ]);

  return { cartError };
}
