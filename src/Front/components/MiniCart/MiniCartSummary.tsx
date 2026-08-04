import { useRouter } from 'next/router';
import { useCallback } from 'react';

import { useCart, useLineItems, useMiniCartFields } from 'providers/index';
import { CartSummaryPrices } from 'ui/index';

export default function MiniCartSummary() {
  const router = useRouter();

  const { activeCart } = useCart();
  const { fields, labels } = useMiniCartFields();
  const { isFetchingCart, isRemovingFromCart } = useLineItems();

  const isCtaDisabled =
    isFetchingCart ||
    isRemovingFromCart ||
    !fields.checkoutCta.value.href ||
    activeCart.computed.isCheckoutDisabled;

  const onGoToCartClick = useCallback(() => {
    if (isCtaDisabled) {
      return;
    }

    router.push(fields.checkoutCta.value.href!);
  }, [fields.checkoutCta.value, router, isCtaDisabled]);

  if (!activeCart) {
    return null;
  }

  return (
    <footer className="py-5 px-4 w-full flex flex-col justify-center space-y-3 shadow-mini-cart-footer">
      <CartSummaryPrices labels={labels} showTaxes={true} />

      <button
        onClick={onGoToCartClick}
        className="cta primary-cta"
        disabled={isCtaDisabled}
        aria-label={fields.checkoutCta.value.text}
      >
        {fields.checkoutCta.value.text}
      </button>

      <label className="body-s text-gray-70 text-center">{labels.withoutTaxesLabel}</label>
    </footer>
  );
}
