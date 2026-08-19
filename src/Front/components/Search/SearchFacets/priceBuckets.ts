/**
 * B2B PLP price-range filter buckets (prototype).
 *
 * Price is NOT an Algolia facet on the `-b2b` index — it comes per-SKU from commercetools
 * standalone pricing, resolved client-side (see `useStandalonePrices`). So unlike every other B2B
 * PLP facet (Category/Certification/…), the price filter can't be a native `useRefinementList`
 * widget. Instead it reuses the existing price-*sort* "bulk-fetch hybrid": when a price bucket is
 * applied, SearchWrapper bulk-fetches the whole facet-filtered set and prices every SKU, then the
 * hit list is filtered client-side to the selected bucket(s) — exactly the same machinery that lets
 * price sort order by a price Algolia doesn't hold. See SearchWrapper's `b2bPriceFilter` and
 * SearchInfiniteHits' `priceFilter`.
 *
 * The facet's PRESENCE + section label are Sitecore-driven like the other facets: an admin adds a
 * "Price" entry (`attributeName=price`) to the Algolia Settings `filterKeyValues` datasource and
 * the sentinel attribute below switches on the custom section. The BUCKET bounds/labels are an
 * interim code map here (same MAP-1/SITE-5 pattern as `productTypeLabels.ts`) — the USD figures
 * match the Figma prototype. Sitecore-managed bucket labels/bounds remain a future enhancement
 * (cf. the "numeric price per currency/channel" note in docs/B2B-Algolia-Index-Changes.md).
 */

import { CurrencyCodes, getCurrencySymbol } from 'utils/currencies';

/** Sentinel `FacetAttribute` value that flags the Sitecore facet entry as the price-range filter. */
export const PRICE_FACET_ATTRIBUTE = 'price';

export interface PriceBucket {
  /** Stable id — used as the pending-toggle value and the `?price=` URL token. URL-safe. */
  id: string;
  /** Display label, formatted in the ACTIVE currency (see `getPriceBuckets`). */
  label: string;
  /** Inclusive lower bound in MAJOR units of the active currency. Omitted = no lower bound. */
  min?: number;
  /** Exclusive upper bound in MAJOR units of the active currency. Omitted = no upper bound. */
  max?: number;
}

/**
 * Bucket ids are deliberately **currency-agnostic tier ids**, not literal amounts. The names are
 * USD-derived (they were the original USD labels) but they identify the *tier* — so the same
 * `?price=200-500` link means "the middle-low tier" in every currency, and switching currency
 * re-applies the selection at that currency's thresholds instead of dropping it. Changing these
 * strings invalidates existing `?price=` URLs, so treat them as a wire format.
 */
export const PRICE_BUCKET_IDS = ['under-200', '200-500', '500-1500', 'over-1500'] as const;

/**
 * The three tier boundaries per currency, in MAJOR units, ascending.
 *
 * **Best-guess round numbers, not live FX.** These are hand-picked "shelf price" thresholds that
 * land on figures a buyer would recognise in that market (approximately the USD tiers converted,
 * then rounded to a friendly number) — a filter's job is to carve the catalog into sensible bands,
 * so a stable round £150 beats an FX-exact £157.34 that drifts daily. USD is the prototype's
 * source of truth; the rest are derived. Revisit alongside real per-currency catalog pricing
 * (MAP-1) — and note commercetools prices are set per currency, so a converted threshold is only
 * ever an approximation of where that currency's own price points actually fall.
 */
const CURRENCY_TIER_BOUNDS: Record<string, readonly [number, number, number]> = {
  [CurrencyCodes.USD]: [200, 500, 1500],
  // Near enough to parity with USD that the same round figures read naturally in EUR.
  [CurrencyCodes.EUR]: [200, 500, 1500],
  [CurrencyCodes.GBP]: [150, 400, 1200],
  [CurrencyCodes.SGD]: [250, 700, 2000],
  // Zero-decimal currency; thresholds are whole yen (~USD ×150), rounded to clean figures.
  [CurrencyCodes.JPY]: [30000, 75000, 225000],
};

const CURRENCY_TIER_BOUNDS_LOOKUP = new Map(Object.entries(CURRENCY_TIER_BOUNDS));

const DEFAULT_TIER_BOUNDS = CURRENCY_TIER_BOUNDS[CurrencyCodes.USD];

/**
 * Formats a threshold for a bucket label, e.g. `$1,500` / `£150` / `S$250` / `¥30,000`.
 *
 * Uses the site's own `getCurrencySymbol` rather than `Intl`'s `style: 'currency'` so the labels
 * match the house style used by the cart and the header currency selector — `Intl` renders SGD as
 * "SGD 250" in an en locale, where the project deliberately maps it to "S$". Amounts are always
 * whole (every bound above is an integer), so fraction digits are forced off: "$200", not
 * "$200.00" — which also keeps zero-decimal JPY right. SAFE-1: `getCurrencySymbol` already falls
 * back to `$` for an unknown/absent code rather than throwing.
 */
const formatBound = (amount: number, currencyCode?: string): string =>
  `${getCurrencySymbol(currencyCode ?? '')}${amount.toLocaleString('en-US', {
    maximumFractionDigits: 0,
  })}`;

/**
 * The four price buckets for `currencyCode`, in display order. Bounds are half-open `[min, max)`
 * so adjacent buckets never double-count a price sitting exactly on a boundary (e.g. $200 falls in
 * "$200 – $500", not "Under $200"). Ids are stable across currencies (see PRICE_BUCKET_IDS);
 * only the bounds and labels change.
 */
export const getPriceBuckets = (currencyCode?: string): PriceBucket[] => {
  const [low, mid, high] =
    (currencyCode && CURRENCY_TIER_BOUNDS_LOOKUP.get(currencyCode)) || DEFAULT_TIER_BOUNDS;
  const money = (amount: number) => formatBound(amount, currencyCode);

  return [
    { id: PRICE_BUCKET_IDS[0], label: `Under ${money(low)}`, max: low },
    { id: PRICE_BUCKET_IDS[1], label: `${money(low)} – ${money(mid)}`, min: low, max: mid },
    { id: PRICE_BUCKET_IDS[2], label: `${money(mid)} – ${money(high)}`, min: mid, max: high },
    { id: PRICE_BUCKET_IDS[3], label: `Over ${money(high)}`, min: high },
  ];
};

/**
 * commercetools money → major units. `centAmount` is in the currency's MINOR unit and the divisor
 * is `fractionDigits`, which is NOT always 2 — JPY prices carry `fractionDigits: 0`, so a hardcoded
 * /100 under-reports yen by 100× and would put every JPY product in the lowest bucket.
 */
export const toMajorUnits = (centAmount: number, fractionDigits = 2): number =>
  centAmount / Math.pow(10, fractionDigits);

/** True when an amount in MAJOR units falls inside `bucket`'s half-open `[min, max)` range. */
export const priceInBucket = (amountMajor: number, bucket: PriceBucket): boolean => {
  if (bucket.min !== undefined && amountMajor < bucket.min) return false;
  if (bucket.max !== undefined && amountMajor >= bucket.max) return false;
  return true;
};

/**
 * True when an amount in MAJOR units falls in ANY of the selected buckets (checkbox OR semantics).
 * `buckets` must be the active currency's set — pass what the UI is showing, so the filter can
 * never test against thresholds different from the ones the user ticked.
 */
export const priceInAnyBucket = (
  amountMajor: number,
  bucketIds: Set<string>,
  buckets: PriceBucket[]
): boolean =>
  buckets.some((bucket) => bucketIds.has(bucket.id) && priceInBucket(amountMajor, bucket));

/** Validates a bucket id read back from the URL; unknown tokens are dropped. */
export const isPriceBucketId = (id: string): boolean =>
  (PRICE_BUCKET_IDS as readonly string[]).includes(id);
