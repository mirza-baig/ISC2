import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import clsx from 'clsx';
import type { Hit } from 'instantsearch.js';
import { RichText } from '@sitecore-jss/sitecore-jss-nextjs';

import { ChevronDownIcon } from 'icons/index';
import { formatDateRange, formatTimeRange, getUTCTime } from 'utils/date';
import { useModal } from 'providers/index';
import ProductFormModal from 'components/ProductForm/ProductFormModal';
import { buildProductFormModal } from 'utils/product-form';

import {
  useB2BPrivateClassLabels,
  useB2BProductMessageModal,
  useB2BRegionLabels,
} from '../B2BPrivateClassContext';
import { hasSessionStarted, isPastCalendarDay, todayISODate } from '../b2bDates';

/** Inline pending spinner — inherits the button's text color (border-current). */
const Spinner = (): JSX.Element => (
  <span
    aria-hidden
    className="ml-2 inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent align-[-2px]"
  />
);

/**
 * B2B Product Listing (PLP) line item — the row rendered for each product on the
 * B2B filter page. Reuses the existing Search feature (SearchWrapper drives the
 * Algolia InstantSearch); this is the row renderer used when SearchWrapper detects
 * the B2BProductListingPage template.
 *
 * DESIGN: modeled on the B2B Make Prototype's PLP line item — category pill, title,
 * a metadata line (access / delivery / modality), a Show Details disclosure, a price
 * column (Price / Originally / Total), a QTY/Attendees input, Add-to-Cart, and an
 * in-cart state (green left border, Total, Update Quantity, Remove from Cart).
 *
 * PRESENTATIONAL ONLY: price, quantity, in-cart state, the metadata line and the cart
 * actions are passed in by the container so the unresolved backend/data pieces stay
 * out of this component:
 *   - CTX-5: price source for self-serve B2B adds (displayPrice/displayOriginalPrice)
 *   - QTY-4: change-quantity operation (onUpdateQuantity) — B2B-only, gated CTX-4
 *   - MAP-1/DATA: metaLine (access days • delivery • modality) — these fields are NOT
 *     in the current crawler index, so the container passes what it can and the line
 *     hides when empty (see docs/B2B-Open-Questions.md).
 *
 * IMPORTANT (prototype fidelity): the product description is shown ONLY inside the
 * expanded "Show Details" panel — never by default above it.
 */

/** Algolia key/value attribute ({ key, label }) used for duration/modality/certification/region. */
export interface B2BKeyLabel {
  key?: string;
  label?: string;
}

export interface B2BProductHit extends Hit {
  objectID: string; // the VARIANT SKU on the -b2b variant index
  sku?: string; // usually === objectID (the variant SKU)
  productKey?: string; // the parent/main product SKU
  productType: string; // e.g. pt-course / pt-exam-prep (mapped to a friendly label by the container)
  productTypeLabel?: string; // friendly category label from the index (e.g. "Course", "Exam Prep")
  title: string; // variant-specific title — absent on every product-bundle record, hence the fallbacks below
  parentTitle?: string; // parent product title; the only name a bundle has (with copyName)
  copyName?: string;
  description: string;
  moreInfo?: string; // Show Details body (falls back to description)
  // -b2b variant index attributes (each { key, label }); drive the meta line + facets.
  duration?: B2BKeyLabel;
  modality?: B2BKeyLabel;
  certification?: B2BKeyLabel;
  region?: B2BKeyLabel;
  // Scheduled-session fields (only present on instructor-led/live-online variants tied to a
  // specific date, same field names the PDP's commerce-index lookup already uses — see
  // types/forms.ts `ProductHit`). Absent on self-paced/on-demand variants.
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  timeZone?: string;
  // Preferred over `timeZone` when present, same as the PDP does it. Null on every dated record in
  // `-b2b` today (measured 2026-08-03), so the short-code `timeZone` is what actually resolves —
  // declared so both sides keep agreeing if the index ever starts carrying it.
  timeZoneIana?: { key?: string } | null;
  /** Rich-text marketing message on the product/bundle (e.g. the Peace of Mind terms). Rendered
   *  under the Show Details body when present — the same field the PDP's purchase-option radios
   *  show, so an option row reads the same here as it does on the product page. */
  productMessage?: string;
  // ---- Generated purchase-option rows (see `b2bPurchaseOptions.ts`) ----
  // A class session is sold the way the PDP sells it: pick a region, then a date, then a purchase
  // option ("Training", "Training & Exam", "…with Peace of Mind Protection"). Those options are
  // separate `product-bundle` products carrying no date and no region, so on a variant listing they
  // are unreachable. The listing expands the cross product on the client instead, from the session's
  // own `skuReferencesProduct`; a generated row carries the bundle's identity (sku/title/price) with
  // the session's attributes and these four fields. Absent on ordinary catalog rows.
  b2bRecordType?: 'catalog' | 'purchase-option';
  /** The class session this option is for — the `pickedProducts` sku the cart needs. */
  b2bPickedSku?: string;
  /** That session's parent product key, the other half of the `pickedProducts` entry. */
  b2bPickedProductKey?: string;
  /** The session's own name, so the row can say which class the option is attached to. */
  b2bSessionTitle?: string;
}

export interface B2BProductLineHitProps {
  hit: B2BProductHit;
  /** Friendly category/delivery pill text (e.g. "Online: Self-Paced Training"). */
  categoryLabel: string;
  /** Access/delivery/modality summary under the title (e.g. "Access: 180 days • Self-Paced • Online"). */
  metaLine?: string;
  /** "QTY" for regular products, "Attendees" for training (QTY-1/UXD-8). */
  quantityLabel: string;
  /** Negotiated "your" price, preformatted (e.g. "$3,359"). CTX-5 = source. */
  displayPrice?: string;
  /** List/original price, preformatted; shown struck-through when it differs. */
  displayOriginalPrice?: string;
  /** Line total when in cart, preformatted (unitPrice × qty). */
  displayTotal?: string;
  isInCart: boolean;
  quantity: number;
  /** Add-to-Cart is in flight — disable + spinner for instant feedback. */
  isAdding?: boolean;
  /** Update/Remove is in flight — disable + spinner for instant feedback. */
  isBusy?: boolean;
  /** Row has uncommitted edits (quantity/scheduling) — shades the card + enables Update. */
  isDirty?: boolean;
  /** Private/classroom (in-person) course → show scheduling questions when in cart (PRIV-1). */
  isPrivate?: boolean;
  /** CT stock is 0 → "Not Available" pill + Add to Cart blocked, the cart page's treatment of an
   *  unavailable line. Scheduled products bypass the stock check, so this is never set for them. */
  isOutOfStock?: boolean;
  /** CT stock is at or under FEW_SEATS_THRESHOLD → "Few Seats Left" pill (still purchasable). */
  isFewSeats?: boolean;
  /**
   * The active cart is a CPQ quote → the whole row is read-only (CTX-5), exactly as the cart page
   * treats a quoted line: the quantity becomes static text on a line that is in the cart, Update and
   * Remove are not rendered at all (the cart page has no trash icon and no quantity editor for a
   * quote), and Add to Cart is greyed out on the rest.
   */
  isCartReadOnly?: boolean;
  /** `title` explaining why those controls are inert — shown on hover/focus. */
  readOnlyTooltip?: string;
  notAvailableLabel?: string;
  fewSeatsLabel?: string;
  requestedStartDate?: string;
  locationMode?: '' | 'online' | 'at-location';
  eventAddress?: string;
  onStartDateChange?: (value: string) => void;
  onLocationModeChange?: (value: '' | 'online' | 'at-location') => void;
  onEditLocation?: () => void;
  addToCartLabel: string;
  updateQuantityLabel: string;
  removeFromCartLabel: string;
  showDetailsLabel: string;
  hideDetailsLabel: string;
  priceLabel: string;
  originallyLabel: string;
  totalLabel: string;
  onQuantityChange: (qty: number) => void;
  onAddToCart: () => void;
  onUpdateQuantity: () => void;
  onRemove: () => void;
}

const B2BProductLineHit = ({
  hit,
  categoryLabel,
  metaLine,
  quantityLabel,
  displayPrice,
  displayOriginalPrice,
  displayTotal,
  isInCart,
  quantity,
  isAdding = false,
  isBusy = false,
  isDirty = false,
  isPrivate = false,
  isOutOfStock = false,
  isFewSeats = false,
  isCartReadOnly = false,
  readOnlyTooltip,
  notAvailableLabel,
  fewSeatsLabel,
  requestedStartDate = '',
  locationMode = '',
  eventAddress = '',
  onStartDateChange,
  onLocationModeChange,
  onEditLocation,
  addToCartLabel,
  updateQuantityLabel,
  removeFromCartLabel,
  showDetailsLabel,
  hideDetailsLabel,
  priceLabel,
  originallyLabel,
  totalLabel,
  onQuantityChange,
  onAddToCart,
  onUpdateQuantity,
  onRemove,
}: B2BProductLineHitProps): JSX.Element => {
  const [showDetails, setShowDetails] = useState(false);
  const L = useB2BPrivateClassLabels();
  // Requested Start Date can't be in the past — today onward only (local date).
  const minDate = todayISODate();

  // The product detail sits inline under the title on every row. Standard rows clamp it to a couple
  // of lines so they keep a uniform default height; "Show Details" expands it in place to the full
  // text. Private/classroom rows are exempt — their scheduling fields make them naturally taller —
  // so they aren't clamped or height-locked.
  const descRef = useRef<HTMLParagraphElement>(null);
  const [descOverflows, setDescOverflows] = useState(false);
  // `productMessage` sits in the same clamped block and is measured the same way, so a row whose
  // detail happens to fit but whose message does not still offers "Show Details".
  const messageRef = useRef<HTMLDivElement>(null);
  const [messageOverflows, setMessageOverflows] = useState(false);
  const isClamped = !showDetails && !isPrivate;

  const hasDiscount = Boolean(
    displayOriginalPrice && displayPrice && displayOriginalPrice !== displayPrice
  );

  // Scheduled-session line (date/time + region), shown above the description — only for variants
  // that actually carry these fields (instructor-led/live-online sessions); self-paced/on-demand
  // variants have neither and the line is skipped entirely (SAFE-1).
  // Resolved the same way the PDP resolves it: the IANA zone when the record carries one, else the
  // short code, both handled by the shared `getUTCTime`.
  const scheduleTimeZone = hit.timeZoneIana?.key?.replace(/_/g, '/') || hit.timeZone;
  const scheduleIso = useMemo(
    () => ({
      isoStart: getUTCTime({
        time: hit.startTime,
        date: hit.startDate,
        timeZone: scheduleTimeZone,
      }),
      isoEnd: getUTCTime({ time: hit.endTime, date: hit.endDate, timeZone: scheduleTimeZone }),
    }),
    [hit.startDate, hit.endDate, hit.startTime, hit.endTime, scheduleTimeZone]
  );
  // A session that has already started shouldn't advertise a schedule. Uses the same
  // `hasSessionStarted` the listing filters with — which is the PDP's instant comparison — so the
  // row and the list can never take different views of the same session.
  // Kept as a second line of defence even though the listing now drops started rows outright
  // (SearchWrapper's `b2bRowFilter`): this component is the row renderer, so anything that ever
  // renders it without that filter still must not advertise a session that has already run.
  const isStartDateInPast = hasSessionStarted(hit);
  const scheduleDateRange = useMemo(() => formatDateRange(scheduleIso), [scheduleIso]);
  const scheduleTimeRange = useMemo(
    () =>
      formatTimeRange({ ...scheduleIso, isHasTime: Boolean(hit.startTime && hit.endTime) }) ?? '',
    [scheduleIso, hit.startTime, hit.endTime]
  );
  // Region facet value re-labeled the same way the filter does (Sitecore-managed, falls back to
  // Algolia's own label for unmapped codes) so the two stay consistent.
  const regionLabels = useB2BRegionLabels();
  const regionLabel = hit.region?.key
    ? regionLabels[hit.region.key] ?? hit.region.label
    : hit.region?.label;
  const scheduleLine = isStartDateInPast
    ? ''
    : [scheduleDateRange && `${scheduleDateRange}${scheduleTimeRange}`, regionLabel]
        .filter(Boolean)
        .join(' • ');

  // The detail is the richer `moreInfo` when the index carries one, otherwise the plain description
  // (DATA-1: the current crawler index has no `moreInfo`, so this is usually the description). It is
  // a DIFFERENT field from the short metaLine (duration • modality), so the two never duplicate.
  const detailText = hit.moreInfo ?? hit.description;

  // `title` is the variant-specific name and every other product type has it, but NO `product-bundle`
  // record carries one (0 of 103, measured against the -b2b index), which rendered 103 nameless rows.
  // Bundles do have `parentTitle`/`copyName`, so fall back through them rather than showing a blank
  // line. Purely defensive for every other type — they all have `title`, so nothing else changes.
  const rowTitle = hit.title || hit.parentTitle || hit.copyName || '';
  useEffect(() => {
    const el = descRef.current;
    if (el && isClamped) {
      setDescOverflows(el.scrollHeight > el.clientHeight + 1);
    }
    const messageEl = messageRef.current;
    if (messageEl && isClamped) {
      setMessageOverflows(messageEl.scrollHeight > messageEl.clientHeight + 1);
    }
  }, [detailText, hit.productMessage, isClamped]);

  // A `productMessage` link with no destination of its own ("second try within 180 days.", authored
  // as href="#") is a terms disclosure, not navigation: the PDP opens the Peace of Mind terms popup
  // from it (ProductFormRadio), and the row does the same here from the same authored item so the
  // two surfaces show identical terms.
  //
  // Deliberately narrower than the PDP's blanket "every anchor opens the modal": a message may also
  // carry a real link (the authored copy uses mailto: and /exams/... elsewhere), and swallowing that
  // would strand the reader. Anything with a genuine href is left to behave as a link.
  const { setModalContent } = useModal();
  const productMessageModal = useB2BProductMessageModal();

  // Delegated from the message wrapper rather than bound to each anchor: the anchors come out of
  // `dangerouslySetInnerHTML`, so React can swap those nodes on any re-render (price arriving, the
  // clamp toggling) and an imperatively-attached listener would be left on a detached node.
  const openProductMessageModal = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      const link = (event.target as HTMLElement | null)?.closest('a');
      if (!link || !messageRef.current?.contains(link)) {
        return;
      }
      const href = link.getAttribute('href')?.trim() ?? '';
      if (href !== '' && href !== '#') {
        return;
      }
      // Swallowed unconditionally: an href="#" goes nowhere by definition, and letting it through
      // would scroll the listing back to the top. If the popup content never resolved, the click is
      // simply inert — which is what the row did before this existed.
      event.preventDefault();
      // The row itself is clickable; without this the modal would open and the row would react too.
      event.stopPropagation();
      if (!productMessageModal) {
        return;
      }
      setModalContent(
        <ProductFormModal
          fields={buildProductFormModal(
            {
              fields: {
                heading: { value: productMessageModal.heading },
                description: { value: productMessageModal.description },
                primaryCtaLabel: { value: productMessageModal.primaryCtaLabel },
                secondaryCtaLabel: { value: productMessageModal.secondaryCtaLabel },
              },
            },
            // Same as the PDP: force the primary CTA to a "#" href so it just closes the popup.
            true
          )}
        />
      );
    },
    [productMessageModal, setModalContent]
  );

  // Only offer the disclosure when something in the clamped block is actually taller than its
  // default height — a short detail that already fits needs no "Show Details".
  const canToggleDetails = descOverflows || messageOverflows;
  // Out of stock blocks Add outright, the way the cart page refuses to check out with an unavailable
  // line. It deliberately does NOT disable Update/Remove on a row already in the cart: the cart page
  // keeps those controls live too, so an item that sold out after it was added can still be adjusted
  // or taken out (removal is the escape hatch the "clear unavailable items" flow relies on).
  //
  // A CPQ quote blocks it as well (CTX-5) — the quote's contents are fixed, so nothing new can be
  // added to it from here. Update/Remove aren't disabled for a quote, they're not rendered: that is
  // what the cart page does with a quoted line (no trash icon, no quantity editor).
  const addDisabled = isOutOfStock || isCartReadOnly || (!isInCart && quantity <= 0);

  // Quantity control. Editable normally; static text once a quote makes the row read-only and the
  // line is actually in that quote — the cart page's own treatment ("Quantity: 3"). Rows that are
  // NOT in the quote keep the input, greyed, so the column still lines up down the list.
  const renderQuantityControl = (): JSX.Element =>
    isCartReadOnly && isInCart ? (
      <span className="w-14 text-center text-sm font-semibold text-black-100">{quantity}</span>
    ) : (
      <input
        type="number"
        min={isInCart ? 1 : 0}
        value={quantity === 0 && !isInCart ? '' : quantity}
        placeholder="0"
        disabled={isCartReadOnly}
        title={isCartReadOnly ? readOnlyTooltip : undefined}
        onChange={(e) => onQuantityChange(parseInt(e.target.value, 10) || 0)}
        aria-label={quantityLabel}
        className={clsx(
          'w-14 rounded border border-gray-50 p-1.5 text-center text-sm',
          isCartReadOnly && 'cursor-not-allowed bg-gray-30 text-gray-70'
        )}
      />
    );

  // Private/classroom: every scheduling field must be filled before Add/Update enable. An event
  // address is required only when the class is held "At Location" — Online needs no address.
  // The date must also not be in the past: `min` already greys out earlier days in the picker, but
  // it does not stop a typed/pasted value (nor a stale draft left over from before midnight), and
  // the browser only enforces `min` on form submit — this row has no form. So the past-date case is
  // treated as "not filled in yet" and Add/Update stay disabled.
  const privateComplete =
    requestedStartDate.trim() !== '' &&
    !isPastCalendarDay(requestedStartDate) &&
    locationMode !== '' &&
    quantity >= 1 &&
    (locationMode !== 'at-location' || eventAddress.trim() !== '');

  return (
    <div
      data-sku={hit.sku ?? hit.objectID}
      data-product-key={hit.productKey}
      className={clsx(
        'flex flex-col justify-between rounded-lg border p-5 transition-colors',
        // Shaded (green tint + left border) ONLY while the item is actually in the cart, per the
        // prototype. It used to also shade on `isDirty`, so simply typing a quantity into a row
        // lit it up as though it were already in the cart. Both cues are keyed to `isInCart`
        // alone, so removing the last of an item drops the tint and the border together.
        //
        // `bg-white-00` has to live in the not-in-cart branch rather than the shared base: two
        // `background-color` utilities on one element are resolved by their order in the generated
        // stylesheet, not by the order they appear in `class`, and `bg-white-00` won — which is why
        // the tint never actually rendered (measured: `rgb(255,255,255)` on an in-cart row).
        //
        // Tint strength: `/10` read too heavy against the prototype, so it is now `/5` — half the
        // alpha (`rgba(70,129,69,0.05)`, ~`#F8FAF8` over white). The left border is the strong
        // signal; the fill is only meant to group the row with it.
        isInCart ? 'border-l-4 border-l-isc2-green bg-isc2-green/5' : 'border-gray-50 bg-white-00',
        // Uniform height for standard rows; private/classroom rows size to their content.
        !isPrivate && 'sm:min-h-[11rem]'
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
        {/* Category / delivery pill — fixed-width area so every row's content column starts at the
            same x; long labels wrap within the pill instead of widening it. Stacks above the
            content on mobile instead of sharing a row, so the fixed width only applies at sm+. */}
        <div className="mt-0.5 shrink-0 sm:w-40">
          <span className="inline-block rounded bg-isc2-green/15 px-2.5 py-1 text-xxsm font-medium leading-snug text-isc2-green">
            {categoryLabel}
          </span>
        </div>

        {/* Content column */}
        <div className="min-w-0 flex-1">
          <p className="body-l font-bold text-black-100">{rowTitle}</p>

          {/* Short meta line (duration • modality) — always a single short line, so it is neither
              clamped nor measured; it sits above the detail text. */}
          {metaLine && <p className="mt-1 text-xs-sm text-[#888]">{metaLine}</p>}

          {/* Scheduled date/time + region, above the description — bolder than the meta line since
              it's actionable scheduling info, not just a category summary. */}
          {scheduleLine && (
            <p className="mt-1 text-xs-sm font-medium text-gray-90">{scheduleLine}</p>
          )}

          {/* Stock pills — the same two-tier treatment (and the same global pill classes) the cart
              page uses via <LineItemSeats />, so an unavailable listing row reads exactly like an
              unavailable cart line. Only one can apply: `isOutOfStock` is stock === 0 and
              `isFewSeats` is 0 < stock <= threshold. */}
          {isOutOfStock && notAvailableLabel && (
            <span className="warning-pill mt-2 inline-block self-start whitespace-nowrap">
              {notAvailableLabel}
            </span>
          )}
          {!isOutOfStock && isFewSeats && fewSeatsLabel && (
            <span className="black-pill mt-2 inline-block self-start whitespace-nowrap">
              {fewSeatsLabel}
            </span>
          )}

          {/* Product detail, inline on every row that has one. Clamped to the default row height so
              rows stay uniform; expands in place when "Show Details" is clicked. */}
          {detailText && (
            <p
              ref={descRef}
              className={clsx('mt-1 text-xs-sm text-gray-90', isClamped && 'line-clamp-2')}
            >
              {detailText}
            </p>
          )}

          {/* Marketing message for the thing being sold, directly under the detail — on a purchase
              -option row this is the option's own copy (e.g. the Peace of Mind terms), which is the
              only place the listing explains what the upgrade buys. Rich text because that is how it
              is authored, rendered with the same `RichText` the PDP's purchase-option radios use
              (ProductFormRadio) so the two read identically. Clamped alongside the detail so a
              collapsed row keeps its uniform height. */}
          {hit.productMessage && (
            <div
              ref={messageRef}
              className={clsx(
                // `pdp-radio-rich-text` is the global rule that colors links inside a product
                // message (green, bold, underline on hover) — reused verbatim from the PDP's
                // purchase-option radios rather than restyled, so a link reads the same on both
                // surfaces. It only targets descendant `a`, nothing else.
                'pdp-radio-rich-text mt-1 text-xs-sm text-gray-90',
                isClamped && 'line-clamp-2'
              )}
              onClick={openProductMessageModal}
            >
              <RichText field={{ value: hit.productMessage }} />
            </div>
          )}

          {canToggleDetails && (
            <button
              type="button"
              onClick={() => setShowDetails((s) => !s)}
              className="mt-1.5 flex cursor-pointer items-center gap-1 text-sm font-normal text-isc2-green"
              aria-expanded={showDetails}
            >
              {showDetails ? hideDetailsLabel : showDetailsLabel}
              <ChevronDownIcon
                size={16}
                className={clsx('transition-transform', showDetails && 'rotate-180')}
              />
            </button>
          )}
        </div>

        {/* Price column — 2-col grid so labels + values line up on top of each other (#5).
            On mobile "Originally" moves above "Price" and drops its strikethrough (`order-*`
            reorders the rows visually without touching DOM/reading order; desktop is unchanged).
            `max-sm:self-end` keeps it hugging the card's right edge instead of stretching full
            width (the parent's `flex-col` defaults to `items-stretch`, which would otherwise pin
            the grid's own left-aligned content to the left side of the card). */}
        <div className="grid shrink-0 grid-cols-[auto_auto] gap-x-2 text-sm max-sm:self-end">
          <span className="order-1 text-black-100 max-sm:order-3">{priceLabel}</span>
          <span className="order-2 font-semibold text-isc2-green max-sm:order-4">
            {displayPrice ?? '—'}
          </span>
          {hasDiscount && (
            <>
              <span className="order-3 text-gray-50 max-sm:order-1">{originallyLabel}</span>
              <span className="order-4 text-gray-50 line-through max-sm:order-2 max-sm:no-underline">
                {displayOriginalPrice}
              </span>
            </>
          )}
          {isInCart && displayTotal && (
            <>
              <span className="order-5 mt-3 font-bold text-black-100">{totalLabel}</span>
              <span className="order-5 mt-3 font-bold text-isc2-green">{displayTotal}</span>
            </>
          )}
        </div>
      </div>

      {/* Private/classroom: scheduling questions shown up front (PRIV-1). Add/Update stay disabled
          until every field is filled and (for At Location) an address is confirmed via the pop-up.
          Content is indented (sm:pl-44 = w-40 pill + gap-4) to align with the title/detail column. */}
      {isPrivate ? (
        <div className="mt-4 sm:pl-44">
          <div className="flex flex-wrap items-end gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-gray-70">{L.requestedStartDate}</span>
              <input
                type="date"
                value={requestedStartDate}
                min={minDate}
                onChange={(e) => onStartDateChange?.(e.target.value)}
                aria-label={L.requestedStartDate}
                className="cursor-pointer rounded border border-gray-50 p-1.5 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-gray-70">{L.location}</span>
              <select
                value={locationMode}
                onChange={(e) =>
                  onLocationModeChange?.(e.target.value as '' | 'online' | 'at-location')
                }
                aria-label={L.location}
                className="select-pos w-44 cursor-pointer appearance-none rounded border border-gray-50 bg-white-00 px-3 py-1.5 text-sm"
              >
                <option value="">{L.locationChoose}</option>
                <option value="online">{L.locationOnline}</option>
                <option value="at-location">{L.locationAtLocation}</option>
              </select>
            </label>
            {/* Attendees + actions share the right-aligned group so the field lines up with the
                Quantity column on the non-private rows. */}
            <div className="ml-auto flex items-center gap-3">
              <label className="flex items-center gap-2">
                <span className="text-xs text-gray-70">{quantityLabel}</span>
                {renderQuantityControl()}
              </label>
              {/* A quoted line shows no controls at all — see `addDisabled`. */}
              {isInCart ? (
                isCartReadOnly ? null : (
                  <>
                    <button
                      type="button"
                      onClick={onUpdateQuantity}
                      disabled={isBusy || !isDirty || !privateComplete}
                      // Same three-state treatment as Add to Cart below, so a disabled Update reads
                      // identically to a disabled Add: flat `bg-gray-50` at full opacity rather than
                      // the dark button dimmed. Order matches Add's too — the not-allowed state wins
                      // over the busy state when both are true.
                      className={clsx(
                        'flex items-center rounded px-4 py-2 text-sm font-semibold text-white-00 transition-colors',
                        !isDirty || !privateComplete
                          ? 'cursor-not-allowed bg-gray-50'
                          : isBusy
                          ? 'cursor-wait bg-dark-green opacity-80'
                          : 'cursor-pointer bg-dark-green'
                      )}
                    >
                      {updateQuantityLabel}
                      {isBusy && <Spinner />}
                    </button>
                    <button
                      type="button"
                      onClick={onRemove}
                      disabled={isBusy}
                      className="rounded border border-gray-50 px-4 py-2 text-sm text-black-100 enabled:cursor-pointer disabled:cursor-wait disabled:opacity-70"
                    >
                      {removeFromCartLabel}
                    </button>
                  </>
                )
              ) : (
                <button
                  type="button"
                  onClick={onAddToCart}
                  disabled={!privateComplete || isAdding || isCartReadOnly}
                  title={isCartReadOnly ? readOnlyTooltip : undefined}
                  className={clsx(
                    'flex items-center rounded px-4 py-2 text-sm font-semibold text-white-00 transition-colors',
                    !privateComplete || isCartReadOnly
                      ? 'cursor-not-allowed bg-gray-50'
                      : isAdding
                      ? 'cursor-wait bg-dark-green opacity-80'
                      : 'cursor-pointer bg-dark-green'
                  )}
                >
                  {addToCartLabel}
                  {isAdding && <Spinner />}
                </button>
              )}
            </div>
          </div>

          {/* Event Location applies only when the class is held "At Location" — Online needs none. */}
          {locationMode === 'at-location' && (
            <div className="mt-3 text-sm">
              <span className="font-semibold text-black-100">{L.eventLocation}</span>
              <button
                type="button"
                onClick={onEditLocation}
                className="ml-3 cursor-pointer text-isc2-green underline"
              >
                {eventAddress ? L.editAddress : L.selectAddress}
              </button>
              <div className="mt-1 text-gray-90">{eventAddress || L.noAddress}</div>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-4 flex flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-3">
          <label className="flex items-center gap-2 max-sm:self-end">
            <span className="text-xs text-gray-70">{quantityLabel}</span>
            {renderQuantityControl()}
          </label>

          {/* A quoted line shows no controls at all — see `addDisabled`. */}
          {isInCart ? (
            isCartReadOnly ? null : (
              <>
                <button
                  type="button"
                  onClick={onUpdateQuantity}
                  disabled={isBusy || !isDirty}
                  // Same three-state treatment as Add to Cart below — see the private-class variant of
                  // this button above. Right-aligned at its own content width on mobile, not full-width.
                  className={clsx(
                    'flex w-auto items-center justify-center self-end rounded px-4 py-2 text-sm font-semibold text-white-00 transition-colors',
                    !isDirty
                      ? 'cursor-not-allowed bg-gray-50'
                      : isBusy
                      ? 'cursor-wait bg-dark-green opacity-80'
                      : 'cursor-pointer bg-dark-green'
                  )}
                >
                  {updateQuantityLabel}
                  {isBusy && <Spinner />}
                </button>
                <button
                  type="button"
                  onClick={onRemove}
                  disabled={isBusy}
                  className="w-auto self-end rounded border border-gray-50 px-4 py-2 text-sm text-black-100 disabled:cursor-wait disabled:opacity-70 enabled:cursor-pointer"
                >
                  {removeFromCartLabel}
                </button>
              </>
            )
          ) : (
            <button
              type="button"
              disabled={addDisabled || isAdding}
              title={isCartReadOnly ? readOnlyTooltip : undefined}
              onClick={onAddToCart}
              // Right-aligned at its own content width (not full-width like Update/Remove above) —
              // `self-end` overrides the row's `items-stretch` on mobile so it doesn't get stretched.
              className={clsx(
                'flex w-auto items-center justify-center self-end rounded px-4 py-2 text-sm font-semibold text-white-00 transition-colors',
                addDisabled
                  ? 'cursor-not-allowed bg-gray-50'
                  : isAdding
                  ? 'cursor-wait bg-dark-green opacity-80'
                  : 'cursor-pointer bg-dark-green'
              )}
            >
              {addToCartLabel}
              {isAdding && <Spinner />}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default B2BProductLineHit;
