import { useEffect, useRef, useState } from 'react';

import { useCart } from 'providers/index';
import useUpdateLineItemQuantity from 'hooks/cart/useUpdateLineItemQuantity';
import { clampToAtLeastOne } from 'hooks/cart/b2bLineQuantity';
import { parsePrice } from 'utils/index';
import type { CartLineItem } from 'types/index';

// import B2BCartLineRow from '../B2BCart/B2BCartLineRow'; // only used by the demo line below, commented out for now
import B2BCartPanel from '../B2BCart/B2BCartPanel';
import useB2BCartCheckout from '../B2BCart/useB2BCartCheckout';
import { DEFAULT_FRACTION_DIGITS, buildB2BCartTotals } from '../B2BCart/b2bCartTotals';

import { /* useB2BPrivateClass, */ useB2BCartLabels } from './B2BPrivateClassContext';
import { useB2BCpqCart } from './useB2BCpqCart';
// Private classes are deferred to a later phase (bug sweep 2026-08-19) — the TEMP demo
// private-class cart line is commented out to match (see b2bDemoCart.ts).
// import {
//   DEMO_SKU,
//   DEMO_TITLE,
//   DEMO_UNIT_PRICE,
//   useB2BDemoCart,
//   b2bDemoCartActions,
// } from './b2bDemoCart';

/**
 * B2B PLP on-page cart (CART-2). Docked in the sticky right column beside the product list.
 * Matched to the B2B Make Prototype (ProductListingPageB): a 290px panel with a compact header
 * ("Cart · N Items" + close), per-line rows (title + Price/Total, editable Quantity + Update,
 * Remove) and a footer with the totals (Subtotal / Taxes* TBD / Total) beside a Checkout button,
 * plus the "*Taxes are Calculated At Checkout" note.
 *
 * The panel itself, its rows and its checkout entry now live in `components/B2BCart` and are shared
 * with the cart page and the mini cart (ITDEV-855 requires all three to look and behave
 * identically). What stays here is what is genuinely PLP-only: the dock's open/close lifecycle, the
 * retained snapshot that keeps content visible while the slot animates shut, and the temporary demo
 * line.
 *
 * The slide-in/out + list-shrink animation are driven by the parent aside slot (SearchResults)
 * via `open`; this component renders content and keeps the last snapshot mounted briefly so it
 * stays visible while the slot collapses. B2B-only.
 */

const TRANSITION_MS = 300;

interface B2BPlpCartProps {
  /** Whether the cart is open (has items and not dismissed). Drives the mount lifecycle. */
  open: boolean;
  /** Dismiss (X) — the parent collapses the slot; re-opens when a new item is added. */
  onClose: () => void;
  /**
   * A `?cart-sku=` link is still being added to the cart (CART-3, see `B2BPlpCartPreload`). Keeps
   * the panel mounted and shows a status line, so a link-driven arrival sees the cart working
   * rather than an empty page followed by a cart that appears unannounced.
   */
  isPreloading?: boolean;
}

const B2BPlpCart = ({
  open,
  onClose,
  isPreloading = false,
}: B2BPlpCartProps): JSX.Element | null => {
  const { activeCart } = useCart();
  const { updateQuantity, isUpdatingQuantity } = useUpdateLineItemQuantity();
  const { isCpq, quote } = useB2BCpqCart();
  // const { getAnswers, setAnswers, clearAnswers, openLocationModal } = useB2BPrivateClass();
  // const demoCart = useB2BDemoCart(); // TEMP demo private-class line
  const labels = useB2BCartLabels();
  const { checkout } = useB2BCartCheckout(isCpq);

  const liveItems: CartLineItem[] = activeCart?.lineItems ?? [];
  // const showDemo = demoCart.inCart; // TEMP
  const hasItems = liveItems.length > 0;
  // A running link pre-fill counts as content: the panel has to be mounted to show its status line
  // in the moment before the first line item lands.
  const hasContent = hasItems || isPreloading;

  // Keep content mounted while open, and briefly after it closes (emptied or dismissed) so it
  // stays visible while the parent slot animates shut; then unmount.
  const [render, setRender] = useState(hasContent && open);
  useEffect(() => {
    if (hasContent && open) {
      setRender(true);
      return;
    }
    const timer = setTimeout(() => setRender(false), TRANSITION_MS);
    return () => clearTimeout(timer);
  }, [hasContent, open]);

  // Retain the last non-empty snapshot so the panel keeps its content while animating out.
  // `subtotal`/`taxValue` ride along for the CPQ footer, which shows the quote's real figures — the
  // panel has to keep rendering them while it animates shut, like every other snapshotted value.
  const buildSnapshot = () => ({
    items: liveItems,
    count: activeCart?.totalLineItemQuantity ?? 0,
    currencySymbol: activeCart?.computed?.currencySymbol ?? '',
    total: activeCart?.computed?.totalPrice ?? '',
    subtotal: activeCart?.computed?.subtotal ?? 0,
    fractionDigits: activeCart?.totalPrice?.fractionDigits ?? DEFAULT_FRACTION_DIGITS,
    // Empty unless the cart actually carries taxes — the same `taxedPrice` guard the cart summary
    // uses before it prints a tax figure instead of "TBD".
    taxValue: activeCart?.taxedPrice ? activeCart?.computed?.taxValue ?? '' : '',
    discounts: (activeCart?.discountOnTotalPrice?.includedDiscounts ?? []).map(
      ({ discount, discountedAmount }) => ({
        key: discount.id || discount.name,
        label: discount.name,
        display: `${activeCart?.computed?.currencySymbol || '$'}${parsePrice(
          discountedAmount.centAmount,
          discountedAmount.fractionDigits
        )}`,
      })
    ),
  });
  const snapshotRef = useRef(buildSnapshot());
  if (hasItems) {
    snapshotRef.current = buildSnapshot();
  }

  if (!render) {
    return null;
  }

  const { items, count, currencySymbol, total, subtotal, fractionDigits, taxValue, discounts } =
    snapshotRef.current;

  // Private classes are deferred to a later phase (bug sweep 2026-08-19) — the TEMP demo line's
  // fold-in to the count + totals is commented out to match.
  // const demoQty = showDemo ? demoCart.quantity : 0;
  const symbol = currencySymbol || '$';
  const realTotalNumber = parseFloat(String(total).replace(/[^0-9.]/g, '')) || 0;
  const combinedTotal = realTotalNumber; // + DEMO_UNIT_PRICE * demoQty;
  const totalDisplay = `${symbol}${combinedTotal.toLocaleString('en-US')}`;
  const displayCount = count; // + demoQty;

  const totals = buildB2BCartTotals({
    isCpq,
    symbol,
    selfServeTotalDisplay: totalDisplay,
    subtotal,
    fractionDigits,
    total,
    taxValue,
    taxesTbdLabel: labels.taxesTbd,
  });

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
  // const demoAnswers = getAnswers(DEMO_SKU);

  return (
    <B2BCartPanel
      items={items}
      count={displayCount}
      currencySymbol={currencySymbol}
      subtotalDisplay={totals.subtotalDisplay}
      taxesDisplay={totals.taxesDisplay}
      totalDisplay={totals.totalDisplay}
      showTaxNote={totals.showTaxNote}
      discounts={discounts}
      canEditQuantity
      maxLineQuantity={null}
      clampQuantity={clampToAtLeastOne}
      quantityLabelAlign="right"
      isCpq={isCpq}
      quote={quote}
      isPreloading={isPreloading}
      onClose={onClose}
      onCheckout={checkout}
      onUpdateQuantity={updateQuantity}
      onRemoveLine={(item) => updateQuantity(item, 0)}
      isBusy={isUpdatingQuantity}
      leadingRows={null}
      /* Private classes are deferred to a later phase (bug sweep 2026-08-19) — the TEMP demo
         private-class row is commented out to match (see b2bDemoCart.ts).
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
            canEditQuantity
            maxQuantity={null}
            clampQuantity={clampToAtLeastOne}
            committedAnswers={demoAnswers}
            onCommitAnswers={(a) => setAnswers(DEMO_SKU, a)}
            openLocationModal={openLocationModal}
          />
        ) : null
      }
      */
    />
  );
};

export default B2BPlpCart;
