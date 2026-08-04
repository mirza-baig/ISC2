import { useMemo } from 'react';

import { useCart } from 'providers/index';

export default function useIsCpqStyleCheckout() {
  const { activeCart, isIdURLParamDefined } = useCart();

  return useMemo(
    () => Boolean(activeCart.computed?.isB2B || isIdURLParamDefined),
    [activeCart.computed?.isB2B, isIdURLParamDefined]
  );
}
