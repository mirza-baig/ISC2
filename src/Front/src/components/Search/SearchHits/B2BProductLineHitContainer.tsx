import { useEffect, useMemo, useRef, useState } from 'react';

import { useUserSession, useStandalonePrices, useModal } from 'providers/index';
import { CurrencyMismatchModal } from 'components/Header/HeaderCurrencyDropdown/CurrencyMismatchModal';
import useGetCart from 'hooks/cart/useGetCart';
import useAddToCart from 'hooks/cart/useAddToCart';
import useRemoveFromCart from 'hooks/cart/useRemoveFromCart';
import { parsePriceFromMoney, isBundleLineItem, getPickedProductFromBundleLine } from 'utils/index';
import { CUSTOMER_PRICING_GROUP_MAP } from 'types/index';
import { FEW_SEATS_THRESHOLD } from 'constants/index';
import type { TypedMoney, ProductHit as AddToCartProductHit } from 'types/index';

import useUpdateLineItemQuantity from 'hooks/cart/useUpdateLineItemQuantity';
import B2BProductLineHit, { B2BProductHit } from './B2BProductLineHit';
import { getProductTypeLabel } from '../SearchFacets/productTypeLabels';
import {
  // Private classes are deferred to a later phase (bug sweep 2026-08-19) — commented out rather
  // than deleted so they can be restored by uncommenting when the feature ships.
  // buildAnswersKey,
  // useB2BPrivateClass,
  useB2BRowLabels,
  useB2BCurrencyModalLabels,
} from '../B2BPrivateClassContext';
// import { useB2BPrivateClassDraft } from '../useB2BPrivateClassDraft';
import { useB2BInventory } from '../B2BInventoryContext';
import { useB2BCpqCart } from '../useB2BCpqCart';

/**
 * Container for the B2B PLP line item. Owns the cart/pricing state and the cart
 * actions, then renders the presentational <B2BProductLineHit />. This is where the
 * still-open backend dependencies are isolated (see TODOs): the whole page is already
 * gated `b2bAdminOnly` in Sitecore, so this is B2B-only by construction (CTX-4).
 */

export interface B2BListingLabels {
  quantityLabel: string; // QTY-1/UXD-8: default label
  attendeesLabel: string; // QTY-1/UXD-8: training products
  addToCartLabel: string;
  updateQuantityLabel: string;
  removeFromCartLabel: string;
  showDetailsLabel: string;
  hideDetailsLabel: string;
  priceLabel: string;
  originallyLabel: string;
  totalLabel: string;
  notAvailableLabel: string; // stock === 0
  fewSeatsLabel: string; // stock <= FEW_SEATS_THRESHOLD
}

interface B2BProductLineHitContainerProps {
  hit: B2BProductHit;
  labels?: Partial<B2BListingLabels>;
}

// SAFE-1: never throw on a missing currency/amount — just render nothing.
const formatAmount = (amount: number, currency?: string): string | undefined => {
  if (!currency) {
    return undefined;
  }
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount);
  } catch {
    return undefined;
  }
};

const formatMoney = (money?: TypedMoney): string | undefined =>
  money ? formatAmount(parsePriceFromMoney(money, 1) as number, money.currencyCode) : undefined;

// MAP-1 (open): heuristic until the Algolia productTypes → category mapping is confirmed.
const isTrainingProduct = (productType?: string): boolean =>
  /training|course|class|exam|bootcamp|seminar/i.test(productType || '');

// Friendly category/delivery pill text. Falls back to the raw productType (SAFE-1).
const toCategoryLabel = (productType?: string): string =>
  productType ? getProductTypeLabel(productType, productType) : '';

// The add-to-cart item for a row or a carried-over cart line. A bundle must name the class session
// it is for; anything else is a plain SKU + quantity. Mirrors `getSelectDateBundlePayload`, which is
// what the PDP sends once its date picker is confirmed — the two have to agree, since they land in
// the same cart.
//
// A bundle add also carries `allowMultiple`, which is the B2B opt-in in the cart service: it turns
// on a seat count on the add, and lets the cart hold the same class twice for two different dates.
// The service cannot tell a B2B shopper from a B2C one, so the capability is gated on being asked
// for — the PDP never asks, and without the flag the service behaves exactly as it always has.
// Sending it from here is safe by construction: this page is gated `b2bAdminOnly` in Sitecore.
const buildAddPayload = (
  sku: string,
  pickedSku: string | undefined,
  pickedProductKey: string | undefined,
  quantity: number
) =>
  pickedSku && pickedProductKey
    ? {
        sku,
        pickedProducts: [{ sku: pickedSku, productKey: pickedProductKey }],
        quantity,
        allowMultiple: true,
      }
    : { sku, quantity };

// Greyish meta line under the title, e.g. "5-Day • Live-Online" (design fidelity).
//
// Both halves ride on the hit itself: the `-b2b` variant index carries `duration` and `modality` as
// { key, label } pairs, so their display text is index-driven and no lookup is needed. This replaced
// an earlier pass that derived modality from `productType` via Sitecore-managed label keys and
// fetched the duration from the commerce product index (productFormSearch, joined by `productKey`) —
// see docs/B2B-Open-Questions.md (DATA-1).
const buildMetaLine = (deliveryModality: string, durationLabel?: string): string =>
  [durationLabel, deliveryModality].filter(Boolean).join(' • ');

const B2BProductLineHitContainer = ({
  hit,
  labels,
}: B2BProductLineHitContainerProps): JSX.Element => {
  // Sitecore-managed row labels (/Data/B2B Product List Labels → "Product Row"), with any
  // per-instance datasource overrides winning.
  const rowLabels = useB2BRowLabels();
  const resolvedLabels = { ...rowLabels, ...labels };
  const currencyModalLabels = useB2BCurrencyModalLabels();
  const { cartId, currencyCode } = useUserSession();
  const { setModalContent } = useModal();

  const { activeCartData } = useGetCart({ enabled: Boolean(cartId), cartID: cartId });
  const { addToCart, isAddingToCart } = useAddToCart();
  const { removeFromCart, isRemovingFromCart } = useRemoveFromCart();
  const { updateQuantity, isUpdatingQuantity } = useUpdateLineItemQuantity();
  const { productPrices, addSkuToPricingQueue } = useStandalonePrices();
  const { inventory, addSkuToInventoryQueue } = useB2BInventory();
  // Private classes are deferred to a later phase (bug sweep 2026-08-19) — commented out rather
  // than deleted so it can be restored by uncommenting when the feature ships.
  // const { getAnswers, setAnswers, clearAnswers, openLocationModal } = useB2BPrivateClass();
  // CPQ (quoted) cart → this row is read-only, the same way the cart page treats a quoted line
  // (CTX-5). See `useB2BCpqCart`.
  const { isCpq } = useB2BCpqCart();

  const sku = hit.sku ?? hit.objectID;

  // Purchase-option row: one class session × one purchase option, expanded on the client from the
  // session's `skuReferencesProduct` (see `b2bPurchaseOptions.ts`). The row's own SKU is the BUNDLE —
  // that is what gets priced, added and removed — while `b2bPickedSku` names the class session it
  // is for. Without the picked session commercetools rejects the add outright
  // (MISSING_PICKED_PRODUCTS_ON_PRODUCT_LEVEL_BUNDLE), which is exactly why the listing could not
  // sell these combinations before.
  const pickedSku = hit.b2bPickedSku;
  const isPurchaseOption = Boolean(pickedSku);

  // Meta line — the `-b2b` variant index carries duration + modality ON the hit (each { key, label }),
  // so no productKey lookup is needed. e.g. "5-Day • Live-Online".
  const durationLabel = hit.duration?.label;
  const deliveryModality = hit.modality?.label ?? '';

  // Private-class scheduling fields (PRIV-1 / PC-1). There is NO reliable "private class" trigger in
  // the data yet — an in-person modality is NOT the same as a private class — so real products must
  // NOT show these fields. Only the temp demo row (B2BDemoPrivateClassRow) demonstrates that UI.
  // Flip this to a real signal once the business defines the private-class flag (PC-1).
  const isPrivate = false;
  // Committed (saved) answers for this OCCURRENCE — the source of truth we init/re-sync the draft
  // from. Keyed per occurrence, not per SKU: two dates of one class are two groups of employees,
  // each with its own start date and its own location.
  //
  // Private classes are deferred to a later phase (bug sweep 2026-08-19) — commented out rather
  // than deleted so it can be restored by uncommenting when the feature ships.
  // const answersKey = buildAnswersKey(sku, pickedSku);
  // const committed = getAnswers(answersKey);

  // Prices come from commercetools standalone prices by SKU (same mechanism as the product
  // cards) — the Algolia index carries no price. Queue the SKU as soon as the row mounts
  // (rather than gating on scroll-into-view): the B2B PLP's price sort needs every currently
  // loaded row's price available immediately, and scroll-gating left off-screen rows priceless
  // (sorting last / tying) until scrolled past, which made price-asc/price-desc look like a
  // no-op on load.
  const blockRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (sku) {
      addSkuToPricingQueue([sku]);
    }
  }, [sku, addSkuToPricingQueue]);

  // The PLP is gated b2bAdminOnly, so the viewer is a B2B admin → the regular (NON_MEMBERS)
  // price applies (showPriceForRole.forRegularUser). CTX-5 (open): a negotiated B2B "your
  // price" would refine this later; for now we show the catalog/standalone price.
  const standalonePrice = productPrices?.[sku]?.[CUSTOMER_PRICING_GROUP_MAP.NON_MEMBERS];

  // Stock, so the row can carry the cart page's unavailable treatment. The index has no inventory
  // field, so this costs a commercetools lookup — which is why only rows that can actually be gated
  // register for one. A `startDate` means a scheduled session, and scheduled products bypass the
  // inventory check everywhere else in this codebase (the buy box in `providers/productForm`, and
  // `useCartPreload`), so on a variant listing that exempts most rows and keeps the request small.
  const isScheduled = Boolean(hit.startDate);
  useEffect(() => {
    if (sku && !isScheduled) {
      addSkuToInventoryQueue([sku]);
    }
  }, [sku, isScheduled, addSkuToInventoryQueue]);

  // Absent from the map = not resolved yet, so neither pill shows and Add stays enabled until the
  // answer lands. That is the right way round: a row must never be blocked by a lookup still in
  // flight, whereas a stock of 0 is written explicitly (see B2BInventoryContext).
  const stock = inventory[sku];
  const isStockKnown = !isScheduled && stock !== undefined;
  const isOutOfStock = isStockKnown && stock === 0;
  const isFewSeats = isStockKnown && stock > 0 && stock <= FEW_SEATS_THRESHOLD;

  // A bundle is not a variant, so it is never matched by SKU. `addComputedFieldsToLineItems`
  // collapses the exploded component lines back into one synthetic line keyed by the bundle SKU, and
  // that is what a purchase-option row looks for — narrowed further by the picked session, because
  // every date of the same class shares one bundle SKU and only the session that was actually added
  // should light up as in-cart.
  //
  // Matched on `bundleSku` rather than on the row's id, because that id is now the occurrence key
  // (`<bundleSku>::<session>`) whenever the line was added with several dates enabled — comparing
  // it to the bundle SKU would never match and every in-cart row would read as empty.
  const lineItem = useMemo(
    () =>
      activeCartData?.lineItems?.find((li) =>
        isPurchaseOption
          ? isBundleLineItem(li) &&
            li.bundleSku === sku &&
            getPickedProductFromBundleLine(li)?.variant?.sku === pickedSku
          : li.variant?.sku === sku
      ),
    [activeCartData?.lineItems, sku, isPurchaseOption, pickedSku]
  );
  const isInCart = Boolean(lineItem);

  // The currency the cart itself is denominated in. Read off a line item rather than
  // `totalPrice` so it is only set while the cart actually holds something (an empty cart can be
  // re-priced freely, so it must never count as a mismatch).
  const cartCurrency = activeCartData?.lineItems?.[0]?.price?.value?.currencyCode;

  const [quantity, setQuantity] = useState<number>(lineItem?.quantity ?? 0);

  // Purchase-option rows take a seat count like any other row now. They could not before —
  // commercetools carried no quantity through a bundle add and rejected a second add of the same
  // bundle SKU outright (DUPLICATE_BUNDLE_IN_CART) — so the row showed a fixed "1". Both limits are
  // lifted for this page by the `allowMultiple` opt-in (see `buildAddPayload`), which is what a B2B
  // buyer needs: many seats for one class, and the same class again for a group on another date.

  // Keep the input in sync with the cart line — including resetting to 0 when the item is removed
  // (lineItem becomes undefined) so the row returns to its blank not-in-cart state (#2).
  useEffect(() => {
    setQuantity(lineItem?.quantity ?? 0);
  }, [lineItem?.id, lineItem?.quantity]); // eslint-disable-line react-hooks/exhaustive-deps

  // Private classes are deferred to a later phase (bug sweep 2026-08-19) — the clear-on-remove
  // effect and the draft hook below are commented out rather than deleted so they can be restored
  // by uncommenting when the feature ships.
  //
  // When the item leaves the cart (removed), drop its saved answers so the row fully resets
  // (no shade / left border, fields cleared).
  // const wasInCartRef = useRef(isInCart);
  // useEffect(() => {
  //   if (wasInCartRef.current && !isInCart) {
  //     clearAnswers(answersKey);
  //   }
  //   wasInCartRef.current = isInCart;
  // }, [isInCart, answersKey, clearAnswers]);

  // const { draft, setDraft, areAnswersDirty, openAddressModal } = useB2BPrivateClassDraft(
  //   committed,
  //   openLocationModal
  // );

  // "Dirty" = the draft (or quantity) differs from what's committed — drives the editing shade
  // (#2) and gates Update (#3).
  const isDirty = quantity !== (lineItem?.quantity ?? 0);

  const quantityLabel = isTrainingProduct(hit.productType)
    ? resolvedLabels.attendeesLabel
    : resolvedLabels.quantityLabel;

  // Price sources (null-safe, SAFE-1): when the product is in the cart we trust the CT
  // line-item price; otherwise use the standalone (catalog) price. "Your price" = the
  // discounted value if present, else the list value; "Originally" = the list value.
  //
  // ...but ONLY while the cart is still in the shopper's selected currency. A commercetools cart
  // keeps the currency it was created in, so after a currency switch the line-item prices are stale
  // (USD) while every standalone price on the page has already been re-fetched in the new currency.
  // Preferring the line item there left in-cart rows showing the old currency for good. When they
  // disagree we fall back to the catalog price so the whole row converts like any other row; the
  // cart itself re-prices when the shopper confirms the mismatch modal below.
  const isCartCurrencyMismatch = Boolean(
    cartCurrency && currencyCode && cartCurrency !== currencyCode
  );
  const cartPrice = isCartCurrencyMismatch ? undefined : lineItem?.price;

  // A bundle's cart price is the summary's `totalPrice`, and that already sums its component lines —
  // each of which commercetools priced as unit × quantity. So a bundle's cart price covers EVERY
  // seat, while every other price on this row (a plain line item's, and any standalone/catalog
  // price) is per seat. The two rules below are that difference, and nothing else:
  const isBundleRow = Boolean(lineItem && isBundleLineItem(lineItem));
  const seats = lineItem?.quantity ?? 1;

  //  1. going DOWN to a per-seat figure for the "Price"/"Originally" lines...
  const perSeat = (money?: TypedMoney): TypedMoney | undefined =>
    money && isBundleRow && seats > 1
      ? { ...money, centAmount: Math.round(money.centAmount / seats) }
      : money;

  const unitMoney =
    perSeat(cartPrice?.discounted?.value ?? cartPrice?.value) ??
    standalonePrice?.discounted?.value ??
    standalonePrice?.value;
  const originalMoney = perSeat(cartPrice?.value) ?? standalonePrice?.value;

  //  2. ...and NOT going up again for the total, since a bundle's cart price was already there.
  //     Only when the cart price was unusable (a currency mismatch drops it) is the fallback a
  //     per-seat catalog price that does still need multiplying.
  const totalUnitMoney = cartPrice?.discounted?.value ?? cartPrice?.value ?? unitMoney;
  const seatMultiplier = isBundleRow && cartPrice ? 1 : seats;
  const displayTotal =
    totalUnitMoney && lineItem
      ? formatAmount(
          parsePriceFromMoney(totalUnitMoney, seatMultiplier) as number,
          totalUnitMoney.currencyCode
        )
      : undefined;

  // Private classes are deferred to a later phase (bug sweep 2026-08-19) — commented out rather
  // than deleted so it can be restored by uncommenting when the feature ships.
  // Commit the draft answers to the shared store (so the cart line picks them up).
  // const commitAnswers = () => setAnswers(answersKey, draft);

  // Re-price the whole cart in the currently selected currency, exactly the way the PDP does it
  // (ProductFormButton's currency-mismatch branch): ONE mutation carrying the target SKU *and*
  // every SKU the cart already holds, so the cart keeps its items and only their currency changes.
  //
  // It has to be a single call. The service layer REPLACES the cart when the incoming currency
  // differs and returns a new id, which `useAddToCart` writes back to the session — but that write
  // is React state, so it cannot reach the mutation closure that an already-awaited loop is holding.
  // Adding the lines one at a time therefore sent every call after the first at the now-dead cart
  // id: the second throws, the sequential loop aborts on it, and the shopper is left with a cart
  // containing only the line they clicked. One UPDATE_CART with N addLineItem actions replaces the
  // cart once and lands all N lines in the fresh one.
  //
  // Quantities are carried per item (`AddToCartHit.quantity`) because the payload-level `quantity`
  // applies to the whole batch, and a B2B cart's lines routinely differ.
  const rebuildCartInSelectedCurrency = (targetQuantity: number) => {
    const carriedOver = (activeCartData?.lineItems ?? [])
      // Only THIS row's occurrence is dropped (it is re-added below at the new quantity). Matching
      // on the bundle SKU would drop every other date of the same class from the rebuilt cart.
      .filter((li) =>
        isBundleLineItem(li)
          ? !(
              li.bundleSku === sku && getPickedProductFromBundleLine(li)?.variant?.sku === pickedSku
            )
          : li.variant?.sku !== sku
      )
      // A bundle has to be re-sent as a bundle. Its synthetic line's `variant.sku` is the bundle's
      // product key, so carrying it over as a plain `{ sku, quantity }` would re-add it with no
      // picked session — which the cart service rejects, failing the whole batch and emptying the
      // shopper's cart on what was only meant to be a currency switch.
      .map((li) => {
        if (!isBundleLineItem(li)) {
          return { sku: li.variant.sku, quantity: li.quantity };
        }
        const picked = getPickedProductFromBundleLine(li);
        return buildAddPayload(li.bundleSku, picked?.variant?.sku, picked?.productKey, li.quantity);
      });

    addToCart({
      items: [
        buildAddPayload(sku, pickedSku, hit.b2bPickedProductKey ?? hit.productKey, targetQuantity),
        ...carriedOver,
      ] as unknown as AddToCartProductHit[],
    });
  };

  // Same guard the PDP applies before adding to a cart held in another currency — the shopper has
  // to okay re-pricing the cart first. Removal is deliberately NOT gated: taking items out of a
  // foreign-currency cart is always safe.
  const withCurrencyConfirmation = (run: () => void) => {
    // A CPQ cart is never re-priced (CTX-5): the quote is denominated in the currency it was
    // negotiated in, and rebuilding it would replace the quoted cart with a self-serve one. The
    // handlers below already refuse to write, so this is the belt to their braces — and it also
    // makes sure the confirmation modal (whose whole purpose is to okay a rebuild) never appears
    // for a quote. In practice the PLP locks the session currency to the quote's while a CPQ cart
    // is active (see SearchWrapper), so `isCartCurrencyMismatch` cannot even become true.
    if (isCpq) {
      return;
    }
    if (!isCartCurrencyMismatch) {
      run();
      return;
    }
    setModalContent(
      <CurrencyMismatchModal
        fields={{
          heading: { value: currencyModalLabels.heading },
          description: {
            value: currencyModalLabels.description.replace('{currency}', currencyCode),
          },
          primaryCTA: { value: { text: currencyModalLabels.confirmLabel } },
          secondaryCTA: { value: { text: currencyModalLabels.cancelLabel } },
        }}
        onConfirm={run}
      />
    );
  };

  // Every cart write below refuses outright while a CPQ cart is active. The controls are already
  // greyed out / not rendered (see B2BProductLineHit), so these guards exist for the paths a UI
  // state can't cover: a stale render, a keyboard activation racing the flag landing, or a future
  // caller. The shared `useAddToCart`/`useRemoveFromCart` hooks are deliberately NOT changed — they
  // are the app-wide add/remove used by the PDP, mini cart and donation flow.
  const handleAddToCart = () => {
    if (quantity <= 0 || isAddingToCart || isCpq) {
      return;
    }
    // TODO(CTX-5): pass `externalPrice` once the negotiated B2B self-serve price source
    // is confirmed. Until then we add at the catalog/standalone price.
    withCurrencyConfirmation(() => {
      if (isCartCurrencyMismatch) {
        rebuildCartInSelectedCurrency(quantity);
      } else {
        addToCart({
          items: [
            buildAddPayload(
              sku,
              pickedSku,
              hit.b2bPickedProductKey ?? hit.productKey,
              quantity
            ) as unknown as AddToCartProductHit,
          ],
          quantity: quantity,
        });
      }
      // commitAnswers();
    });
  };

  const handleUpdateQuantity = () => {
    if (isCpq) {
      return;
    }
    // QTY-4 interim: set the line to the row's quantity via the shared add/remove-based helper,
    // and commit the draft answers so the on-page cart reflects them.
    withCurrencyConfirmation(() => {
      if (isCartCurrencyMismatch) {
        rebuildCartInSelectedCurrency(quantity);
      } else if (lineItem) {
        updateQuantity(lineItem, quantity);
      }
      // commitAnswers();
    });
  };

  const handleRemove = () => {
    if (isCpq) {
      return;
    }
    if (lineItem) {
      removeFromCart({ lineItems: [lineItem] });
    }
  };

  // Private classes are deferred to a later phase (bug sweep 2026-08-19) — these scheduling
  // handlers (PRIV-1) are commented out rather than deleted so they can be restored by
  // uncommenting when the feature ships.
  // const handleStartDateChange = (value: string) =>
  //   setDraft((d) => ({ ...d, requestedStartDate: value }));
  // const handleLocationModeChange = (mode: '' | 'online' | 'at-location') => {
  //   setDraft((d) => ({ ...d, locationMode: mode }));
  //   if (mode === 'at-location' && !draft.eventAddress) {
  //     openAddressModal();
  //   }
  // };
  // const handleEditLocation = () => openAddressModal();

  // Stagger each row's fade-in (see `.b2b-row-enter`) so a freshly lazy-loaded page eases in
  // one-by-one instead of the whole batch popping in together. `__position` is Algolia's 1-based
  // rank; modulo the page size (10) resets the cascade per loaded batch. Only newly-mounted rows
  // animate — existing keyed rows aren't remounted, so they never replay their delay.
  const enterDelayMs = (((hit.__position ?? 1) - 1) % 10) * 45;

  return (
    <div ref={blockRef} className="b2b-row-enter" style={{ animationDelay: `${enterDelayMs}ms` }}>
      <B2BProductLineHit
        hit={hit}
        categoryLabel={hit.productTypeLabel || toCategoryLabel(hit.productType)}
        // Meta line is ONLY the short "duration • modality" summary now — the product description
        // is no longer folded in here as a fallback. It has its own clamped slot in the row (the
        // detail text), so passing it as the meta too would render it twice on rows that have no
        // duration/modality. The description still reaches the component via the `hit` prop.
        metaLine={buildMetaLine(deliveryModality, durationLabel)}
        quantityLabel={quantityLabel}
        displayPrice={formatMoney(unitMoney)}
        displayOriginalPrice={formatMoney(originalMoney)}
        displayTotal={displayTotal}
        isInCart={isInCart}
        quantity={quantity}
        isAdding={isAddingToCart}
        isBusy={isUpdatingQuantity || isRemovingFromCart}
        isPrivate={isPrivate}
        isDirty={isDirty}
        isOutOfStock={isOutOfStock}
        isFewSeats={isFewSeats}
        isCartReadOnly={isCpq}
        readOnlyTooltip={resolvedLabels.cpqReadOnlyTooltip}
        notAvailableLabel={resolvedLabels.notAvailableLabel}
        fewSeatsLabel={resolvedLabels.fewSeatsLabel}
        // Private classes are deferred to a later phase (bug sweep 2026-08-19) — commented out
        // rather than deleted so they can be restored by uncommenting when the feature ships.
        // requestedStartDate={draft.requestedStartDate}
        // locationMode={draft.locationMode}
        // eventAddress={draft.eventAddress}
        // onStartDateChange={handleStartDateChange}
        // onLocationModeChange={handleLocationModeChange}
        // onEditLocation={handleEditLocation}
        addToCartLabel={resolvedLabels.addToCartLabel}
        updateQuantityLabel={resolvedLabels.updateQuantityLabel}
        removeFromCartLabel={resolvedLabels.removeFromCartLabel}
        showDetailsLabel={resolvedLabels.showDetailsLabel}
        hideDetailsLabel={resolvedLabels.hideDetailsLabel}
        priceLabel={resolvedLabels.priceLabel}
        originallyLabel={resolvedLabels.originallyLabel}
        totalLabel={resolvedLabels.totalLabel}
        onQuantityChange={setQuantity}
        onAddToCart={handleAddToCart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemove={handleRemove}
      />
    </div>
  );
};

export default B2BProductLineHitContainer;
