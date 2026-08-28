import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

import { useCart } from 'providers/index';
import { useB2BCartAccess } from 'hooks/index';
import useUpdateLineItemQuantity from 'hooks/cart/useUpdateLineItemQuantity';
import { parsePrice } from 'utils/index';
import type { CartLineItem } from 'types/index';

import { useB2BCartLabels } from '../Search/B2BPrivateClassContext';
import { useB2BCpqCart } from '../Search/useB2BCpqCart';

// ⛔ PRIVATE CLASSES ARE NOT SHIPPING ANYWHERE (bug B-15, extended bug sweep 2026-08-19).
//
// The decision is to hold private classes back *for now*, so every private-class line below is
// commented rather than deleted: uncommenting these blocks (and the two `useHasB2BCartExtraLines`
// call sites in `ShoppingCart` and `B2BMiniCart`, the modal in `B2BCartSurface`, and the matching
// blocks in `B2BPlpCart.tsx`/`B2BCartLineRow.tsx`/`B2BCartPanel.tsx`) is the whole switch back on.
// The PLP dock, which originally kept the demo row, the scheduling questions and the location
// picker, is now deferred the same way as this cart page and the mini cart.
//
// Nothing real is hidden by this: no commercetools line is ever marked private today (PC-1), so the
// only thing these blocks could render is the temporary demo line.
// import { useB2BPrivateClass } from '../Search/B2BPrivateClassContext';
// import {
//   DEMO_SKU,
//   DEMO_TITLE,
//   DEMO_UNIT_PRICE,
//   useB2BDemoCart,
//   b2bDemoCartActions,
// } from '../Search/b2bDemoCart';
// import B2BCartLineRow from './B2BCartLineRow';

import B2BCartPanel from './B2BCartPanel';
import B2BCartSummary from './B2BCartSummary';
import type { B2BCartCheckoutCta } from './B2BCartTotalsBlock';
import useB2BCartCheckout from './useB2BCartCheckout';
import { DEFAULT_FRACTION_DIGITS, buildB2BCartTotals } from './b2bCartTotals';
import { hasBlockingLines } from './b2bCartLine';

export interface B2BCartConnectedProps {
  className?: string;
  onClose?: () => void;
  isPreloading?: boolean;
  summaryPlacement?: 'inline' | 'aside';
  summaryCoupon?: ReactNode;
  summaryFooter?: ReactNode;
  checkoutCta?: B2BCartCheckoutCta;
}

const B2BCartConnected = ({
  className,
  onClose,
  isPreloading = false,
  summaryPlacement = 'inline',
  summaryCoupon,
  summaryFooter,
  checkoutCta,
}: B2BCartConnectedProps): JSX.Element => {
  const { activeCart } = useCart();
  const { isCpq, quote } = useB2BCpqCart();
  const labels = useB2BCartLabels();
  const { checkout } = useB2BCartCheckout(isCpq);
  const { canEditQuantity, maxLineQuantity, clampQuantity } = useB2BCartAccess();
  const { updateQuantity, isUpdatingQuantity } = useUpdateLineItemQuantity({
    allowCpqCart: canEditQuantity,
  });
  // Private classes held back here (B-15):
  // const { getAnswers, setAnswers, clearAnswers, openLocationModal } = useB2BPrivateClass();
  // const demoCart = useB2BDemoCart(); // TEMP demo private-class line

  const items: CartLineItem[] = activeCart?.lineItems ?? [];
  const symbol = activeCart?.computed?.currencySymbol || '$';
  const total = activeCart?.computed?.totalPrice ?? '';
  const subtotal = activeCart?.computed?.subtotal ?? 0;
  const fractionDigits = activeCart?.totalPrice?.fractionDigits ?? DEFAULT_FRACTION_DIGITS;
  const taxValue = activeCart?.taxedPrice ? activeCart?.computed?.taxValue ?? '' : '';

  // Private classes held back here (B-15). With no hand-folded line, every figure on these two
  // surfaces comes from commercetools alone — which is what the totals did before the demo line
  // existed. The demo folding is kept below for when private classes are switched back on.
  //
  // const showDemo = demoCart.inCart;
  // const demoQty = showDemo ? demoCart.quantity : 0;
  // const realTotalNumber = parseFloat(String(total).replace(/[^0-9.]/g, '')) || 0;
  // const selfServeTotalDisplay = showDemo
  //   ? `${symbol}${(realTotalNumber + DEMO_UNIT_PRICE * demoQty).toLocaleString('en-US')}`
  //   : `${symbol}${total}`;
  const selfServeTotalDisplay = `${symbol}${total}`;

  const totals = buildB2BCartTotals({
    isCpq,
    symbol,
    selfServeTotalDisplay,
    subtotal,
    fractionDigits,
    total,
    taxValue,
    taxesTbdLabel: labels.taxesTbd,
  });

  const discounts = (activeCart?.discountOnTotalPrice?.includedDiscounts ?? []).map(
    ({ discount, discountedAmount }) => ({
      key: discount.id || discount.name,
      label: discount.name,
      display: `${symbol}${parsePrice(
        discountedAmount.centAmount,
        discountedAmount.fractionDigits
      )}`,
    })
  );

  // Private classes held back (B-15): was `… + demoQty`.
  const cartCount = activeCart?.computed?.itemsQuantity ?? activeCart?.totalLineItemQuantity ?? 0;

  // A quantity write that has to remove the line before re-adding it (every decrease, and every
  // bundle change — `useUpdateLineItemQuantity`) leaves the cart a line short in between, and both
  // halves land in the query cache. `pendingUpdateLineId` marks that window so the panel can hold
  // the row, and the header count is held with it: the item total dipping and recovering is the
  // same flicker the row was.
  const [pendingUpdateLineId, setPendingUpdateLineId] = useState<string | null>(null);
  const heldCountRef = useRef(cartCount);

  useEffect(() => {
    if (!pendingUpdateLineId) {
      heldCountRef.current = cartCount;
    }
  }, [cartCount, pendingUpdateLineId]);

  const count = pendingUpdateLineId ? heldCountRef.current : cartCount;

  const handleUpdateQuantity = useCallback(
    async (item: CartLineItem, quantity: number) => {
      // Removals are not held — Remove should take the row away at once — so only a write that
      // keeps the line marks itself pending.
      if (quantity > 0) {
        setPendingUpdateLineId(item.id);
      }

      try {
        await updateQuantity(item, quantity);
      } finally {
        setPendingUpdateLineId(null);
      }
    },
    [updateQuantity]
  );

  // const money = (amount: number) => ({
  //   type: 'centPrecision' as const,
  //   centAmount: Math.round(amount * 100),
  //   currencyCode: 'USD',
  //   fractionDigits: 2,
  // });
  // const demoLineItem = {
  //   id: DEMO_SKU,
  //   name: DEMO_TITLE,
  //   quantity: demoCart.quantity,
  //   price: { value: money(DEMO_UNIT_PRICE) },
  //   totalPrice: money(DEMO_UNIT_PRICE * demoCart.quantity),
  //   variant: { sku: DEMO_SKU },
  //   productType: { name: 'training-classroom' },
  // } as unknown as CartLineItem;

  const panel = (
    <B2BCartPanel
      items={items}
      count={count}
      currencySymbol={symbol}
      subtotalDisplay={totals.subtotalDisplay}
      taxesDisplay={totals.taxesDisplay}
      totalDisplay={totals.totalDisplay}
      showTaxNote={totals.showTaxNote}
      discounts={discounts}
      showFooter={summaryPlacement === 'inline'}
      canEditQuantity={canEditQuantity}
      maxLineQuantity={maxLineQuantity}
      clampQuantity={clampQuantity}
      quantityLabelAlign="right"
      isCpq={isCpq}
      allowCpqQuantity={canEditQuantity}
      quote={quote}
      isPreloading={isPreloading}
      onClose={onClose}
      onCheckout={checkoutCta?.onClick ?? checkout}
      checkoutCta={checkoutCta}
      onUpdateQuantity={handleUpdateQuantity}
      onRemoveLine={(item) => handleUpdateQuantity(item, 0)}
      isBusy={isUpdatingQuantity || Boolean(pendingUpdateLineId)}
      pendingUpdateLineId={pendingUpdateLineId}
      className={className}
      /* Private classes held back on these two surfaces (B-15) — no `leadingRows`, so the panel
         renders the commercetools lines and nothing else. The PLP dock still passes its own.
      leadingRows={
        showDemo ? (
          <B2BCartLineRow
            item={demoLineItem}
            currencySymbol={symbol}
            updateLabel={labels.update}
            removeLabel={labels.remove}
            quantityLabel={labels.attendees}
            onUpdate={(_item, qty) => b2bDemoCartActions.setQuantity(qty)}
            onRemove={() => {
              b2bDemoCartActions.remove();
              clearAnswers(DEMO_SKU);
            }}
            isBusy={false}
            isPrivate
            hasStarted={false}
            startedLabel={labels.sessionStarted}
            readOnly={isCpq}
            canEditQuantity={canEditQuantity}
            allowQuantityWhenReadOnly={canEditQuantity}
            maxQuantity={maxLineQuantity}
            clampQuantity={clampQuantity}
            quantityLabelAlign="right"
            committedAnswers={getAnswers(DEMO_SKU)}
            onCommitAnswers={(a) => setAnswers(DEMO_SKU, a)}
            openLocationModal={openLocationModal}
          />
        ) : null
      }
      */
    />
  );

  if (summaryPlacement === 'inline') {
    return panel;
  }

  return (
    <div className="flex flex-col gap-y-5 lg:flex-row lg:items-start lg:gap-x-8">
      {panel}
      <B2BCartSummary
        showTaxes={Boolean(activeCart?.computed?.isB2B || activeCart?.taxedPrice)}
        checkoutBlocked={hasBlockingLines(items)}
        onCheckout={checkout}
        coupon={summaryCoupon}
        footer={summaryFooter}
        className="w-full lg:w-462 lg:shrink-0 xl:w-520"
      />
    </div>
  );
};

export default B2BCartConnected;
