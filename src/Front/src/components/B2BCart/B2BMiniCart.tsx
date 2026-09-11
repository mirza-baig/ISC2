import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import clsx from 'clsx';

import { useCart, useLayout, useLineItems, useMiniCartFields } from 'providers/index';
import { useB2BCartAccess } from 'hooks/index';
import { resolveMiniCartCartHref, shouldMiniCartGoToCheckout } from 'hooks/cart/b2bBuyerContext';
import { RichTextUI } from 'ui/index';

import EmptyMiniCartHeader from '../MiniCart/EmptyMiniCartHeader';
import MiniCartHeader from '../MiniCart/MiniCartHeader';

import B2BCartSurface from './B2BCartSurface';
// Private classes held back here (B-15): import { useHasB2BCartExtraLines } from './useB2BCartExtraLines';

const DRAWER_PANEL_CLASSNAME = 'flex h-full min-h-0 w-full flex-col bg-white-00';

const B2BMiniCart = (): JSX.Element => {
  const { isMiniCartOpen, closeMiniCart } = useLayout();
  const { activeCart } = useCart();
  const { fields } = useMiniCartFields();
  const { isFetchingCart, isRemovingFromCart } = useLineItems();
  const { isAuthorizedBuyer, buyerContext } = useB2BCartAccess();
  const router = useRouter();

  // Private classes are held back on this surface (B-15), so "empty" is once again exactly what
  // commercetools says. The B-14 rule — "empty" means *nothing to show*, because the private-class
  // line is folded in by hand and its SKU never reaches CT — comes back with them:
  //
  // const hasExtraLines = useHasB2BCartExtraLines();
  // const isEmpty = activeCart.computed.isEmpty && !hasExtraLines;
  const isEmpty = activeCart.computed.isEmpty;

  // ITDEV-1187: Authorized Buyers shopping as Myself must match an individual user — cart page
  // first, not a skip straight to checkout. Organization buyers keep the existing checkout hop.
  const skipToCheckout = shouldMiniCartGoToCheckout(isAuthorizedBuyer, buyerContext);
  const cartHref = resolveMiniCartCartHref(fields.checkoutCta.value.href);
  const isCtaDisabled =
    isFetchingCart || isRemovingFromCart || activeCart.computed.isCheckoutDisabled;

  const goToCart = useCallback(() => {
    if (isCtaDisabled) {
      return;
    }
    closeMiniCart();
    router.push(cartHref);
  }, [cartHref, closeMiniCart, isCtaDisabled, router]);

  const checkoutCta = useMemo(
    () => ({
      disabled: isCtaDisabled,
      label: skipToCheckout ? undefined : fields.checkoutCta.value.text,
      onClick: skipToCheckout ? undefined : goToCart,
    }),
    [fields.checkoutCta.value.text, goToCart, isCtaDisabled, skipToCheckout]
  );

  return (
    <div
      className={clsx(
        'modal modal-overlay max-w-8xl !mx-auto transition-opacity duration-500',
        isMiniCartOpen
          ? 'z-modal-overlay opacity-100'
          : '-z-1 opacity-0 pointer-events-none invisible'
      )}
      role="dialog"
      aria-label="Mini cart"
    >
      <section
        className={clsx(
          'h-dynamic-screen w-[calc(100dvw-2.5rem)] border-r border-gray-30 absolute transition-all duration-500 bg-gray-10 right-0 bottom-0 top-0 sm:w-547 translate-x-0 flex flex-col',
          !isMiniCartOpen && '!translate-x-full'
        )}
      >
        {isEmpty ? (
          <>
            <MiniCartHeader />
            <EmptyMiniCartHeader />
            <section className="flex flex-col flex-1 bg-white overflow-hidden">
              <RichTextUI
                value={fields.richText.value}
                className="pl-4 pr-3 sm:px-4 pt-10 !ml-0 md:w-350"
              />
            </section>
          </>
        ) : (
          <B2BCartSurface
            className={DRAWER_PANEL_CLASSNAME}
            onClose={closeMiniCart}
            checkoutCta={checkoutCta}
          />
        )}
      </section>
    </div>
  );
};

export default B2BMiniCart;
