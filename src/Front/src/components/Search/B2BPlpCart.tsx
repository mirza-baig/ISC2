import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { signIn } from 'next-auth/react';

import { useCart, useModal } from 'providers/index';
import { useLoggedUser } from 'hooks/index';
import useUpdateLineItemQuantity from 'hooks/cart/useUpdateLineItemQuantity';
import {
  areStringsEqual,
  getPickedProductFromBundleLine,
  getVariantAttributes,
  isBundleLineItem,
  parsePriceFromMoney,
} from 'utils/index';
import { CloseIcon } from 'icons/index';
import { GenericModal } from 'ui/index';
import { CART_ID_PARAM_NAME } from 'constants/index';
import type { CartLineItem } from 'types/index';
// Reused as-is (not modified) so the PLP's checkout entry runs the SAME cart-assignment step the
// cart page runs — see `handleCheckout`.
import AssignB2BCartModal from '../Cart/AssignB2BCartModal';

import {
  buildAnswersKey,
  isPrivateClass,
  useB2BPrivateClass,
  useB2BPrivateClassLabels,
  useB2BCartLabels,
  type LocationMode,
  type PrivateClassAnswers,
  type AddressSelection,
} from './B2BPrivateClassContext';
import { useB2BPrivateClassDraft } from './useB2BPrivateClassDraft';
import { hasSessionStarted, isPastCalendarDay, todayISODate } from './b2bDates';
import { useB2BCpqCart } from './useB2BCpqCart';
// TEMP: demo private-class cart line (remove before release — see b2bDemoCart.ts)
import {
  DEMO_SKU,
  DEMO_TITLE,
  DEMO_UNIT_PRICE,
  useB2BDemoCart,
  b2bDemoCartActions,
} from './b2bDemoCart';

/**
 * B2B PLP on-page cart (CART-2). Docked in the sticky right column beside the product list.
 * Matched to the B2B Make Prototype (ProductListingPageB): a 290px panel with a compact header
 * ("Cart · N Items" + close), per-line rows (title + Price/Total, editable Quantity + Update,
 * Remove) and a footer with the totals (Subtotal / Taxes* TBD / Total) beside a Checkout button,
 * plus the "*Taxes are Calculated At Checkout" note.
 *
 * The slide-in/out + list-shrink animation are driven by the parent aside slot (SearchResults)
 * via `open`; this component renders content and keeps the last snapshot mounted briefly so it
 * stays visible while the slot collapses.
 *
 * LABELS resolve from the i18n dictionary (SITE-5) with safe fallbacks. Update writes to the
 * cart via the shared hook, so the row and the cart stay in sync. B2B-only.
 */

const TRANSITION_MS = 300;
const CHECKOUT_HREF = '/checkout';

// CT's own ProductType.name isn't a reliable category signal (PC-1, still open) — the cart line
// only carries CT's internal type name, not the Algolia `pt-*` facet code the PLP row already
// classified correctly. Falls back to the line item's display name too (same multi-signal
// pattern as `isPrivateClass` above), since product titles reliably say "Exam"/"Course"/etc.
const isTrainingProduct = (...values: (string | undefined)[]): boolean =>
  values.some((value) => value && /training|course|class|exam|bootcamp|seminar/i.test(value));

/**
 * Has this cart line's scheduled session already started?
 *
 * **B2B-only on purpose.** The listing hides a session the moment it starts (`hasSessionStarted`,
 * mirroring the PDP buy box), but a line already sitting in the cart is never re-checked: the
 * shared "not available" path is stock-only (`getLineItemsSummary` → `availableQuantity === 0`)
 * and is read by the site-wide cart, mini cart, cart buttons and checkout, so it stays untouched.
 * This panel therefore answers the question for itself with the *same* predicate its rows use, so
 * a session the listing beside it has stopped advertising cannot be carried on to checkout from
 * here. Scheduled products bypass stock entirely, so nothing else would have caught it.
 *
 * The adapter is the only new part. Cart line attributes are snake_case, and `parseAttributes`
 * has already resolved `time_zone_iana` into a slash-form string (not the `{ key }` object an
 * Algolia hit carries), so it goes straight in as the zone — exactly what `LineItemDate` passes
 * when it renders the very same line's schedule.
 */
const hasLineSessionStarted = (item: CartLineItem): boolean => {
  const attributes = getVariantAttributes(item.variant) as Record<string, string | undefined>;
  return hasSessionStarted({
    startDate: attributes.start_date,
    startTime: attributes.start_time,
    timeZone: attributes.time_zone_iana || attributes.time_zone,
  });
};

/**
 * The name to show for a cart line.
 *
 * `CartLineItem.name` is the **product** name in commercetools, which is shared by every variant of
 * that product. On a variant-level listing that is actively misleading: adding
 * `EXM-EXM-SSCP-POM` ("SSCP Exam with Peace of Mind Protection") put a line titled plain
 * "SSCP Exam" — the master variant's name — in this panel, so it read as though the wrong SKU had
 * been added. The line itself was always right (`variant.sku`, `variant.id` and the price all
 * belong to the requested variant); only the label was the parent's.
 *
 * The variant's own name rides along in `variant.attributesRaw`, and the rest of the app already
 * prefers it — same `copy_name || name || lineItem.name` order as `LineItemAttributes` and
 * `OrderSummaryLineItem`, so the panel now agrees with the cart page and order summary. Falls back
 * to the product name for a line with no variant attributes (e.g. the demo private-class row).
 */
const getLineDisplayName = (item: CartLineItem): string => {
  const attributes = getVariantAttributes(item.variant) as Record<string, string | undefined>;
  return attributes.copy_name || attributes.name || item.name;
};

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

interface CartLineRowProps {
  item: CartLineItem;
  currencySymbol: string;
  updateLabel: string;
  removeLabel: string;
  quantityLabel: string;
  onUpdate: (item: CartLineItem, qty: number) => void;
  onRemove: (item: CartLineItem) => void;
  isBusy: boolean;
  /** Private/classroom (in-person) course → show scheduling questions in the cart (PRIV-1). */
  isPrivate: boolean;
  /** This line's scheduled session has already started — flag it and block checkout until it goes. */
  hasStarted: boolean;
  /** Notice for a started line — the footer's own, shorter wording is `labels.checkoutBlocked`. */
  startedLabel: string;
  /**
   * The cart is a CPQ quote → this line is read-only, exactly as on the cart page: the quantity
   * shows as static text and neither Update nor Remove is rendered (CTX-5, see `useB2BCpqCart`).
   */
  readOnly: boolean;
  /** Committed answers for this line — the draft inits/re-syncs from these; commit on Update. */
  committedAnswers: PrivateClassAnswers;
  onCommitAnswers: (answers: PrivateClassAnswers) => void;
  openLocationModal: (
    initial: AddressSelection,
    onConfirm: (result: AddressSelection) => void
  ) => void;
}

const UpdateSpinner = (): JSX.Element => (
  <span
    aria-hidden
    className="ml-1.5 inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent align-[-2px]"
  />
);

const CartLineRow = ({
  item,
  currencySymbol,
  updateLabel,
  removeLabel,
  quantityLabel,
  onUpdate,
  onRemove,
  isBusy,
  isPrivate,
  hasStarted,
  startedLabel,
  readOnly,
  committedAnswers,
  onCommitAnswers,
  openLocationModal,
}: CartLineRowProps): JSX.Element => {
  const [qty, setQty] = useState(item.quantity);
  const { draft, setDraft, areAnswersDirty, openAddressModal } = useB2BPrivateClassDraft(
    committedAnswers,
    openLocationModal
  );
  const L = useB2BPrivateClassLabels();
  const cartLabels = useB2BCartLabels();
  const minDate = todayISODate();
  // The variant's name, not the parent product's — see `getLineDisplayName`.
  const displayName = getLineDisplayName(item);

  // Re-sync from committed state (quantity server-side, answers after the other surface commits).
  useEffect(() => {
    setQty(item.quantity);
  }, [item.quantity]);

  // Editing here stays local; the row/other surfaces don't change until Update commits (#5).
  const isDirty = areAnswersDirty || qty !== item.quantity;

  // Private/classroom: Update stays disabled until the scheduling fields are complete. An event
  // address is required only when the class is held "At Location" — Online needs none.
  // A past date counts as incomplete here too — same reasoning as the listing row: `min` only greys
  // out the picker, and a cart line can also be reopened days after the date was chosen.
  const privateComplete =
    !isPrivate ||
    (draft.requestedStartDate.trim() !== '' &&
      !isPastCalendarDay(draft.requestedStartDate) &&
      draft.locationMode !== '' &&
      qty >= 1 &&
      (draft.locationMode !== 'at-location' || draft.eventAddress.trim() !== ''));

  const handleUpdate = () => {
    onUpdate(item, qty);
    onCommitAnswers(draft);
  };

  const unitMoney = item.price?.discounted?.value ?? item.price?.value;
  const unit = unitMoney ? `${currencySymbol}${parsePriceFromMoney(unitMoney, 1, false)}` : '—';
  const totalMoney = item.totalPrice ?? item.price?.value;
  const total = totalMoney
    ? `${currencySymbol}${parsePriceFromMoney(
        totalMoney,
        item.totalPrice ? 1 : item.quantity,
        false
      )}`
    : '—';

  return (
    <div className="border-b border-gray-50 px-4 py-4">
      {/* Title + price, bottom-aligned */}
      <div className="mb-3 flex items-end justify-between gap-3">
        <span className="text-sm font-semibold leading-snug text-black-100">{displayName}</span>
        {/* Price/Total in a 2-col grid so they line up on top of each other (#6). Per the
            prototype the label AND its amount are the same grey (`gray-70`, the grey already used
            for this panel's secondary text) — the amounts were `isc2-green`, which made each line
            item read as a call to action. The "Total" label matches its amount's `text-sm` too;
            it used to inherit the grid's `text-xs` and sat visibly smaller than the figure. */}
        <div className="grid shrink-0 grid-cols-[auto_auto] gap-x-2 text-xs text-gray-70">
          <span>{cartLabels.price}</span>
          <span className="font-semibold">{unit}</span>
          <span className="text-sm">{cartLabels.total}</span>
          <span className="text-sm font-semibold">{total}</span>
        </div>
      </div>

      {/* Started session: say so on the line itself, since the footer only says checkout is
          blocked — with several lines in the panel the shopper has to be able to see which one. */}
      {hasStarted && (
        <p role="alert" className="mb-3 text-xs font-semibold text-red-error">
          {startedLabel}
        </p>
      )}

      {/* Private-class scheduling questions (PRIV-1). Hidden on a quoted line: the answers only
          ever commit through Update, which a read-only line doesn't render — the fields would be
          dead controls, and the schedule was agreed in the quote anyway. */}
      {isPrivate && !readOnly && (
        <div className="mb-3 space-y-2">
          <label className="block">
            <span className="mb-1 block text-xs text-gray-70">{L.requestedStartDate}</span>
            <input
              type="date"
              value={draft.requestedStartDate}
              min={minDate}
              onChange={(e) => setDraft((d) => ({ ...d, requestedStartDate: e.target.value }))}
              aria-label={`${L.requestedStartDate} for ${displayName}`}
              className="w-full cursor-pointer rounded border border-gray-50 p-1.5 text-sm"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-gray-70">{L.location}</span>
            <select
              value={draft.locationMode}
              onChange={(e) => {
                const mode = e.target.value as LocationMode;
                setDraft((d) => ({ ...d, locationMode: mode }));
                if (mode === 'at-location' && !draft.eventAddress) {
                  openAddressModal();
                }
              }}
              aria-label={`${L.location} for ${displayName}`}
              className="select-pos w-full cursor-pointer appearance-none rounded border border-gray-50 bg-white-00 px-3 py-1.5 text-sm"
            >
              <option value="">{L.locationChoose}</option>
              <option value="online">{L.locationOnline}</option>
              <option value="at-location">{L.locationAtLocation}</option>
            </select>
          </label>
          {draft.locationMode === 'at-location' && (
            <div className="text-xs">
              <span className="font-semibold text-black-100">{L.eventLocation}</span>
              <button
                type="button"
                onClick={openAddressModal}
                className="ml-2 cursor-pointer text-isc2-green underline"
              >
                {draft.eventAddress ? L.editAddress : L.selectAddress}
              </button>
              <div className="mt-0.5 text-gray-90">{draft.eventAddress || L.noAddress}</div>
            </div>
          )}
        </div>
      )}

      {/* Quantity/Attendees label left, input + Update right. The whole row used to be
          `justify-end`, so the short "Quantity" label floated in beside the input while the long
          "Attendees" label was pushed out to the left edge by its own width — the two label
          variants didn't line up with each other. `justify-between` with the controls grouped in
          their own flex box pins every label to the left, whatever it says. */}
      {readOnly ? (
        /* Quoted line — the cart page's treatment (`Cart/CartLineItem`): the quantity is plain
           text and there is no trash icon, so nothing here can change the quote. */
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-gray-70">{quantityLabel}</span>
          <span className="shrink-0 text-sm font-semibold text-black-100">{item.quantity}</span>
        </div>
      ) : (
        <>
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-xs text-gray-70">{quantityLabel}</span>
            <div className="flex shrink-0 items-center gap-2">
              <input
                type="number"
                min={1}
                value={qty}
                onChange={(e) => setQty(parseInt(e.target.value, 10) || 1)}
                aria-label={`${quantityLabel} for ${displayName}`}
                className="w-[52px] rounded border border-gray-50 p-1 text-center text-sm"
              />
              {/* A started session can't be re-bought at any quantity, so Update is disabled too.
                  Remove stays enabled — removing the line is the only way out. */}
              <button
                type="button"
                onClick={handleUpdate}
                disabled={isBusy || hasStarted || !isDirty || !privateComplete}
                className="flex items-center rounded border border-gray-50 bg-white-00 px-3 py-1.5 text-sm text-black-100 enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
              >
                {updateLabel}
                {isBusy && <UpdateSpinner />}
              </button>
            </div>
          </div>

          {/* Remove, right-aligned */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => onRemove(item)}
              disabled={isBusy}
              className="cursor-pointer text-xs text-gray-70 underline disabled:cursor-not-allowed disabled:opacity-50"
            >
              {removeLabel}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

const B2BPlpCart = ({
  open,
  onClose,
  isPreloading = false,
}: B2BPlpCartProps): JSX.Element | null => {
  const { activeCart } = useCart();
  const { updateQuantity, isUpdatingQuantity } = useUpdateLineItemQuantity();
  const { isUserNotLoggedIn, user } = useLoggedUser();
  const { setModalContent } = useModal();
  const { isCpq, quote } = useB2BCpqCart();
  const { getAnswers, setAnswers, clearAnswers, openLocationModal } = useB2BPrivateClass();
  const demoCart = useB2BDemoCart(); // TEMP demo private-class line
  const router = useRouter();
  const cartLabels = useB2BCartLabels();

  // Mirror the site's checkout entry (Cart/OrderSummary/CartButtons): carry the cart-id query
  // param through to checkout, and — when the shopper isn't signed in — route through the
  // Salesforce login with checkout as the callback, so they land back on checkout afterwards.
  const checkoutUrl = useMemo(() => {
    const raw = Object.entries(router.query).find(
      ([key]) => key.toLowerCase() === CART_ID_PARAM_NAME.toLowerCase()
    )?.[1];
    const cartIdParam = Array.isArray(raw) ? raw[0] : raw;
    return cartIdParam ? `${CHECKOUT_HREF}?${CART_ID_PARAM_NAME}=${cartIdParam}` : CHECKOUT_HREF;
  }, [router.query]);

  /**
   * Same checkout entry the cart page runs (`Cart/OrderSummary/CartButtons.onPrimaryCtaClicked`):
   * sign in first, then — for a CPQ cart — settle who the quote belongs to before leaving the page.
   * A quoted cart that is still unassigned has to be claimed (`AssignB2BCartModal` calls the same
   * assign mutation the cart page calls), and one already assigned to somebody else can't be
   * checked out at all. Skipping this here would let the PLP reach checkout in a state the cart
   * page refuses, so it is mirrored rather than short-circuited.
   *
   * The wording comes from the B2B PLP label group with code fallbacks: the cart page's
   * `cartStatus*PopupNotice` fields come from its own rendering datasource (`useCartFields`), which
   * has no value on the listing page.
   */
  const handleCheckout = () => {
    if (isUserNotLoggedIn) {
      signIn('salesforce', { callbackUrl: checkoutUrl });
      return;
    }

    if (isCpq) {
      // Already assigned to another customer → dead end, same as the cart page.
      if (
        activeCart?.customerEmail &&
        user?.email &&
        !areStringsEqual(activeCart.customerEmail, user.email)
      ) {
        setModalContent(
          <GenericModal
            heading={cartLabels.cpqUnavailableHeading}
            description={cartLabels.cpqUnavailableDescription}
            primaryCtaLabel={cartLabels.cpqUnavailableConfirm}
          />
        );
        return;
      }

      // Unassigned quote → claim it, then continue to checkout.
      if (!activeCart?.customerEmail && activeCart?.id) {
        setModalContent(
          <AssignB2BCartModal
            heading={{ value: cartLabels.cpqAssignHeading }}
            description={{ value: cartLabels.cpqAssignDescription }}
            primaryCtaLabel={{ value: cartLabels.cpqAssignConfirm }}
            secondaryCtaLabel={{ value: cartLabels.cpqAssignCancel }}
            cartID={activeCart.id}
            onSuccess={() => router.push(checkoutUrl)}
          />
        );
        return;
      }
    }

    router.push(checkoutUrl);
  };

  // Sitecore-managed labels (/Data/B2B Product List Labels → "Cart"), each with a safe fallback.
  const labels = cartLabels;

  const liveItems: CartLineItem[] = activeCart?.lineItems ?? [];
  const showDemo = demoCart.inCart; // TEMP
  const hasItems = liveItems.length > 0;
  // A running link pre-fill counts as content: the panel has to be mounted to show its status line
  // in the moment before the first line item lands.
  const hasContent = hasItems || showDemo || isPreloading;

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
    // Empty unless the cart actually carries taxes — the same `taxedPrice` guard the cart summary
    // uses before it prints a tax figure instead of "TBD".
    taxValue: activeCart?.taxedPrice ? activeCart?.computed?.taxValue ?? '' : '',
  });
  const snapshotRef = useRef(buildSnapshot());
  if (hasItems) {
    snapshotRef.current = buildSnapshot();
  }

  if (!render) {
    return null;
  }

  const { items, count, currencySymbol, total, subtotal, taxValue } = snapshotRef.current;

  // Sessions that have already started (see `hasLineSessionStarted`). Keyed by line id, so the row
  // and the footer agree, and cheap enough to recompute per render — a panel holds a few lines.
  const startedLineIds = new Set(items.filter(hasLineSessionStarted).map((li) => li.id));
  const checkoutBlocked = startedLineIds.size > 0;

  // TEMP demo line: fold the fake private-class product into the count + totals for preview.
  const demoQty = showDemo ? demoCart.quantity : 0;
  const symbol = currencySymbol || '$';
  const realTotalNumber = parseFloat(String(total).replace(/[^0-9.]/g, '')) || 0;
  const combinedTotal = realTotalNumber + DEMO_UNIT_PRICE * demoQty;
  const totalDisplay = `${symbol}${combinedTotal.toLocaleString('en-US')}`;
  const displayCount = count + demoQty;

  // A quoted cart shows the money the quote actually carries, the way the cart page's summary does
  // (`CartSummaryPrices` with `showTaxes`): subtotal, real taxes when CT has priced them, and the
  // cart's own total. "Taxes calculated at checkout" is a self-serve statement — CPQ pricing is
  // already final — so under CPQ the placeholder and its footnote give way to the real figures.
  const cpqSubtotalDisplay = `${symbol}${subtotal.toFixed(2)}`;
  const cpqTaxesDisplay = taxValue ? `${symbol}${taxValue}` : labels.taxesTbd;
  const cpqTotalDisplay = `${symbol}${total}`;
  const showTaxNote = !isCpq || !taxValue;

  const money = (amount: number) => ({
    type: 'centPrecision' as const,
    centAmount: Math.round(amount * 100),
    currencyCode: 'USD',
    fractionDigits: 2,
  });
  const demoLineItem = {
    id: DEMO_SKU,
    name: DEMO_TITLE,
    quantity: demoCart.quantity,
    price: { value: money(DEMO_UNIT_PRICE) },
    totalPrice: money(DEMO_UNIT_PRICE * demoCart.quantity),
    variant: { sku: DEMO_SKU },
    productType: { name: 'training-classroom' },
  } as unknown as CartLineItem;
  const demoAnswers = getAnswers(DEMO_SKU);

  return (
    // Below `sm` this panel is the content of a full-height fixed drawer (see the `<aside>` in
    // SearchResults), so it fills that drawer edge to edge: no rounding or outer border, and no
    // viewport-relative max-height of its own — the drawer already bounds it, and capping it here
    // would leave a dead white strip at the bottom of the drawer.
    <section className="flex max-h-[calc(100vh-7rem)] w-full flex-col rounded-lg border border-gray-50 bg-white-00 max-sm:h-full max-sm:max-h-none max-sm:rounded-none max-sm:border-0 sm:w-[290px]">
      {/* Header — "Cart" left-aligned; count centered (#4); close X in a bordered square, right (#10). */}
      <div className="relative flex items-center justify-center border-b border-gray-50 px-4 py-3">
        <span className="absolute left-4 text-sm font-semibold text-black-100">{labels.title}</span>
        <span className="text-sm text-gray-70">
          {displayCount} {displayCount === 1 ? labels.item : labels.items}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close cart"
          className="absolute right-3 flex h-6 w-6 cursor-pointer items-center justify-center rounded border border-gray-50 text-gray-70 hover:text-black-100"
        >
          <CloseIcon size={12} />
        </button>
      </div>

      {/* Items (scrollable). `overscroll-contain` stops a flick past the end of this list from
          chaining into the page behind the mobile drawer. */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {/* Quote header — the cart page prints the same three values above its line items
            (`Cart/ShoppingCart`), so a shopper looking at a quoted cart here sees which quote it is
            and why the controls are gone. Scrolls with the list rather than taking fixed height
            from a 290px panel. */}
        {isCpq && (
          <div className="border-b border-gray-50 bg-black-05 px-4 py-3">
            {quote.salesNumber && (
              <p className="text-xs font-semibold text-black-100">
                {labels.cpqSalesNumber} {quote.salesNumber}
              </p>
            )}
            {quote.invoiceNumber && (
              <p className="mt-0.5 text-xs font-semibold text-black-100">
                {labels.cpqInvoiceNumber} {quote.invoiceNumber}
              </p>
            )}
            {quote.validUntil && (
              <p className="mt-0.5 text-xs text-gray-90">
                {labels.cpqValidUntil} {quote.validUntil}
              </p>
            )}
            <p className="mt-1.5 text-xs text-gray-70">{labels.cpqNotice}</p>
          </div>
        )}

        {/* `?cart-sku=` link pre-fill in flight (CART-3). Sits above the lines because they arrive
            one add at a time — the shopper can watch the cart fill and knows more is coming. */}
        {isPreloading && (
          <p
            aria-live="polite"
            className="flex items-center justify-center gap-2 border-b border-gray-50 px-4 py-3 text-xs text-gray-70"
          >
            {labels.preloadLoading}
            <UpdateSpinner />
          </p>
        )}

        {/* TEMP demo private-class line (remove before release) */}
        {showDemo && (
          <CartLineRow
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
            committedAnswers={demoAnswers}
            onCommitAnswers={(a) => setAnswers(DEMO_SKU, a)}
            openLocationModal={openLocationModal}
          />
        )}
        {items.map((li) => {
          // Must resolve to the SAME key the listing row used, or a line's answers vanish the
          // moment they cross between the two surfaces. For a bundle that means its bundle SKU
          // (its `variant.sku` is only the product key) plus the session it was bought for, since a
          // cart can now hold two dates of one class and each keeps its own answers.
          const lineSku = isBundleLineItem(li)
            ? buildAnswersKey(li.bundleSku, getPickedProductFromBundleLine(li)?.variant?.sku)
            : li.variant?.sku ?? li.id;
          const answers = getAnswers(lineSku);
          const linePrivate = isPrivateClass(li.name, li.productType?.name);
          return (
            <CartLineRow
              key={li.id}
              item={li}
              currencySymbol={currencySymbol}
              updateLabel={labels.update}
              removeLabel={labels.remove}
              quantityLabel={
                isTrainingProduct(li.productType?.name, li.name)
                  ? labels.attendees
                  : labels.quantity
              }
              onUpdate={updateQuantity}
              onRemove={(item) => {
                updateQuantity(item, 0);
                clearAnswers(lineSku);
              }}
              isBusy={isUpdatingQuantity}
              isPrivate={linePrivate}
              hasStarted={startedLineIds.has(li.id)}
              startedLabel={labels.sessionStarted}
              readOnly={isCpq}
              committedAnswers={answers}
              onCommitAnswers={(a) => setAnswers(lineSku, a)}
              openLocationModal={openLocationModal}
            />
          );
        })}
      </div>

      {/* Footer: totals beside Checkout, note below */}
      <div className="border-t border-gray-50 px-4 pb-4 pt-3">
        <div className="flex items-end gap-6">
          {/* Totals in a 2-col grid so labels + amounts line up on top of each other (#6). */}
          <div className="ml-auto grid w-fit grid-cols-[auto_auto] gap-x-3 text-sm">
            <span className="text-gray-90">{labels.subtotal}</span>
            <span className="text-right text-black-100">
              {isCpq ? cpqSubtotalDisplay : totalDisplay}
            </span>
            <span className="text-gray-90">{labels.taxes}</span>
            <span className="text-right text-gray-70">
              {isCpq ? cpqTaxesDisplay : labels.taxesTbd}
            </span>
            <span className="text-base text-black-100">{labels.total}</span>
            <span className="text-right text-base font-bold text-black-100">
              {isCpq ? cpqTotalDisplay : totalDisplay}
            </span>
          </div>
          <div className="shrink-0">
            <button
              type="button"
              onClick={handleCheckout}
              disabled={checkoutBlocked}
              title={checkoutBlocked ? labels.checkoutBlocked : undefined}
              className="rounded bg-dark-green px-5 py-3 text-sm font-semibold text-white-00 enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
            >
              {labels.checkout}
            </button>
          </div>
        </div>
        {checkoutBlocked && (
          <p className="mt-2.5 text-center text-xs font-semibold text-red-error">
            {labels.checkoutBlocked}
          </p>
        )}
        {showTaxNote && <p className="mt-2.5 text-center text-xs text-gray-70">{labels.taxNote}</p>}
      </div>
    </section>
  );
};

export default B2BPlpCart;
