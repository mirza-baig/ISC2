import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { getCookie } from 'cookies-next';
import { InstantSearch, Configure } from 'react-instantsearch-hooks-web';
import {
  ComponentRendering,
  Field,
  GetStaticComponentProps,
  LinkField,
  RouteData,
  useComponentProps,
  useSitecoreContext,
} from '@sitecore-jss/sitecore-jss-nextjs';
import { ComponentProps } from 'lib/component-props';
import algoliasearch, { SearchClient as AlgoliaSearchClient } from 'algoliasearch';
import { KeyValuePair } from 'tailwindcss/types/config';
import type { Hit, UiState } from 'instantsearch.js';
import { history as historyRouter } from 'instantsearch.js/es/lib/routers';
import Link from 'next/link';
import { getGraphQLResult } from 'utils/graphQLFunctions';
import type { CurrencyCodes } from 'utils/index';
import { useFeatureFlag } from 'providers/featureFlags';

import {
  FacetKeyValues,
  SearchResultHit,
  SortOptions,
  SearchDefaultFilter,
  SearchModalAlgoliaSettings,
  CUSTOMER_PRICING_GROUP_MAP,
} from 'types/index';
import { B2B_LISTING_TEMPLATE_NAME, B2B_FEATURE_FLAG } from 'constants/b2b';
import {
  useSearch,
  useLayout,
  AutocompleteProvider,
  useCart,
  useStandalonePrices,
  useUserSession,
} from 'providers/index';
import { ScrollToTop } from 'ui/index';
import { useI18n } from 'next-localization';
import RssFeedIcon from 'icons/RssFeedIcon';
import ShoppingCartIcon from 'icons/ShoppingCartIcon';

import SearchBox from './SearchBox';
import SearchResults, { B2B_PLP_CART_ASIDE_ID, B2B_PLP_HITS_LIST_ID } from './SearchResults';
import SearchHit from './SearchHits/SearchHit';
import TrainingFinderHit from './SearchHits/TrainingFinderHit';
import VolunteerSearchHit from './SearchHits/VolunteerSearchHit';
import B2BProductLineHitContainer from './SearchHits/B2BProductLineHitContainer';
import type { B2BProductHit } from './SearchHits/B2BProductLineHit';
import B2BBulkFetchPageReset from './B2BBulkFetchPageReset';
import B2BPlpCart from './B2BPlpCart';
import B2BPlpCartPreload from './B2BPlpCartPreload';
import B2BPlpFilter from './B2BPlpFilter';
import B2BPlpSort, { B2BSortKey, SORT_KEYS } from './B2BPlpSort';
import { B2BPrivateClassProvider, useB2BCartLabels } from './B2BPrivateClassContext';
import { hasSessionStarted, type SessionScheduleFields } from './b2bDates';
import { filterRawQueryParts } from './b2bQueryString';
import { isRegionlessOilSession } from './b2bPurchaseOptions';
import { B2B_STARTDATE_MAX_FACET_VALUES } from './useB2BPastSessionCount';
import {
  getPriceBuckets,
  isPriceBucketId,
  priceInAnyBucket,
  toMajorUnits,
} from './SearchFacets/priceBuckets';

// B2B PLP price-sort bulk fetch: price is NOT in the Algolia index (it comes from commercetools
// per SKU), so Algolia cannot order by it. To sort by price *exactly* we pull the whole
// facet-filtered result set in one query, then price every SKU and sort client-side. Capped at
// Algolia's per-query max (also the default `paginationLimitedTo`); a filtered category is far
// smaller than this, so price sort is exact in the common case, and only the rare unfiltered
// whole-catalog price sort is bounded to the first 1000 by relevance.
const B2B_PRICE_SORT_FETCH_MAX = 1000;

// How many variant rows the B2B PLP loads per infinite-scroll page while browsing (i.e. when NOT
// bulk-fetching for a price sort). Deliberately larger than the index default of 20.
//
// A row's price is not in the index — it is fetched from commercetools once the row's SKU is queued,
// which cannot start until the Algolia page has landed and its rows have mounted. Measured locally,
// that whole chain (Algolia round trip → mount → one batched price request → re-render) takes about
// 1.2s, so rows are always briefly on screen ahead of their prices. What decides whether anyone
// notices is how much runway the next page has: at ~176px per row, 20 rows is ~3.5 viewports, and
// the scroll sentinel can only be told to prefetch a fraction of that ahead before its expanded root
// still contains the sentinel after a page loads and it chain-loads the rest of the catalog. Loading
// 40 at a time doubles that ceiling, which is what lets B2B_BROWSE_PREFETCH_AHEAD_PX below be set
// far enough ahead to cover the pricing chain at a normal scroll speed.
const B2B_BROWSE_HITS_PER_PAGE = 40;

// How far ahead of the scroll sentinel the B2B PLP starts loading the next page. Lead time is this
// distance divided by scroll speed, so this — not the page size — is what buys time for the pricing
// chain described above. Must stay comfortably under one page's rendered height
// (B2B_BROWSE_HITS_PER_PAGE × ~176px ≈ 7000px), or the sentinel is still inside the observer's
// expanded root once the page it triggered has rendered and every remaining page loads in a chain.
const B2B_BROWSE_PREFETCH_AHEAD_PX = 2400;

// The `-b2b` index facets on `.key` subfields (`certification.key`); that suffix is an indexing
// detail nobody should see in a shared link, so it is dropped on the way out and restored on the
// way in (see `b2bRouting`).
const stripFacetKeySuffix = (attribute: string): string => attribute.replace(/\.key$/i, '');

// Sub-delims and pchars that RFC 3986 already allows unescaped inside a query string. `qs`'s
// default encoder is `encodeURIComponent`, which escapes several of these anyway — turning a
// readable value into %XX noise for no benefit — so they are put back literally after encoding.
// Deliberately NOT included (they must stay escaped or the query string itself would break):
// `&` `=` `?` `#` `%`, and `+` (which a query-string parser may read back as a space).
// The `i` flag appears only on the patterns whose hex digits include a letter, where an encoder
// emitting lowercase would otherwise slip past; on the digit-only ones it matches nothing extra.
const URL_SAFE_QUERY_CHARS: Array<[RegExp, string]> = [
  [/%21/g, '!'],
  [/%24/g, '$'],
  [/%27/g, "'"],
  [/%28/g, '('],
  [/%29/g, ')'],
  [/%2A/gi, '*'],
  [/%2C/gi, ','],
  [/%2F/gi, '/'],
  [/%3A/gi, ':'],
  [/%3B/gi, ';'],
  [/%40/g, '@'],
];

const b2bUrlValueEncoder = (value: unknown, defaultEncoder: (input: unknown) => string): string =>
  URL_SAFE_QUERY_CHARS.reduce(
    (encoded, [escaped, literal]) => encoded.replace(escaped, literal),
    defaultEncoder(value)
  );

// Renders a facet value for the URL: whitespace collapses to a dash. This is a one-way display
// transform — `routeToState` reads the value back verbatim rather than turning dashes into spaces,
// because real facet codes already contain literal dashes (`pt-exam-prep`, `pt-express-course`) and
// the two are indistinguishable on the way back in. Today no value in the `-b2b` index contains
// whitespace (they are codes: `emea01`, `CISSP`, `liveonline`), so this is a safety net rather than
// something currently in play; if spaced facet values are ever indexed, the read side will need to
// resolve the slug against the returned facet values instead of matching literally. Applied to
// facet values only — never to the free-text `query`, where a dash would change the search.
const toB2bUrlFacetValue = (value: string): string => value.replace(/\s+/g, '-');

// The B2B sort is plain React state, not an InstantSearch widget, so it has no uiState for the
// state mapping to carry — it rides in the URL as its own top-level `?sort=` param instead. Both
// writers keep it: InstantSearch-driven writes re-append it in `createURL` (reading the live value
// off a ref), and a sort-only change rewrites the param itself (the effect in the component). The
// default is omitted so an unsorted link stays clean, and the key is written literally — every
// value in SORT_KEYS is already URL-safe.
const B2B_SORT_PARAM = 'sort';
const DEFAULT_B2B_SORT: B2BSortKey = 'recommended';

const isB2bSortKey = (value: string | null): value is B2BSortKey =>
  value !== null && SORT_KEYS.includes(value as B2BSortKey);

/** Rewrites a bare query string (no leading `?`) so its `sort` param reflects `sort`. */
const withB2bSortParam = (queryString: string, sort: B2BSortKey): string => {
  const parts = queryString
    .split('&')
    .filter((part) => part && part.split('=')[0] !== B2B_SORT_PARAM);

  if (sort !== DEFAULT_B2B_SORT) {
    parts.push(`${B2B_SORT_PARAM}=${sort}`);
  }

  return parts.join('&');
};

/** Reads a valid sort key out of a location search string; unknown/absent → the default. */
const readB2bSortParam = (search: string): B2BSortKey => {
  const raw = new URLSearchParams(search).get(B2B_SORT_PARAM);
  return isB2bSortKey(raw) ? raw : DEFAULT_B2B_SORT;
};

// The applied price buckets are also plain React state, not an InstantSearch widget (price is a
// client-side filter — see priceBuckets.ts), so they ride in the URL as their own `?price=` param
// exactly like the sort: comma-joined bucket ids, kept across facet-driven URL writes by
// `withB2bPriceParam` and rewritten on a price-only change by an effect in the component.
const B2B_PRICE_PARAM = 'price';

/** Rewrites a bare query string (no leading `?`) so its `price` param reflects `buckets`. */
const withB2bPriceParam = (queryString: string, buckets: Set<string>): string => {
  const parts = queryString
    .split('&')
    .filter((part) => part && part.split('=')[0] !== B2B_PRICE_PARAM);

  if (buckets.size) {
    // Sort so the URL is stable regardless of the order buckets were ticked.
    parts.push(`${B2B_PRICE_PARAM}=${[...buckets].sort().join(',')}`);
  }

  return parts.join('&');
};

/**
 * Carries every query param the PLP's routing does NOT own from the current URL into a freshly
 * built one.
 *
 * `createURL` composes the query string from InstantSearch's `routeState` (plus the sort/price refs)
 * and returns `origin + pathname + '?' + that` — so whatever else was in the URL is simply not in
 * the output. Without this, the first facet tick / sort change / price apply silently drops
 * unrelated params, and the PLP has two features that read them **after** load: the `?cart-sku=`
 * link pre-fill (CART-3) and the checkout entry, which forwards `?cartId=` on to checkout the way
 * the cart page does (`Cart/OrderSummary/CartButtons`). Analytics params (`utm_*`) survive too.
 *
 * `owned` holds the keys the routing is authoritative for — the facet route keys, the free-text
 * `query`, and `sort`/`price`, whose live values come from refs, not from the old URL. Anything
 * else is copied over **verbatim** (raw `key=value` text, never re-encoded) so a param the PLP
 * knows nothing about survives a round trip byte-for-byte.
 */
const withPreservedParams = (
  queryString: string,
  search: string,
  owned: ReadonlySet<string>
): string => {
  const carried = filterRawQueryParts(search, (key) => !owned.has(key));

  if (!carried.length) {
    return queryString;
  }

  return [...(queryString ? [queryString] : []), ...carried].join('&');
};

/** Reads the valid applied price-bucket ids out of a location search string; unknown ids dropped. */
const readB2bPriceParam = (search: string): Set<string> => {
  const raw = new URLSearchParams(search).get(B2B_PRICE_PARAM);
  if (!raw) {
    return new Set();
  }
  return new Set(raw.split(',').filter(isPriceBucketId));
};

// Bubble diameter (h-12/w-12 = 3rem = 48px) — used to center it on the measured corner point.
const CART_BUBBLE_SIZE = 48;
// How close to the top of the viewport the bubble is allowed to get before it stops tracking the
// row and sticks in place, so it doesn't scroll off-screen once the row scrolls past.
const CART_BUBBLE_STICKY_TOP = 16;
// Below Tailwind's `sm`, rows run full-bleed and there is no gutter beside them for the bubble to
// hover in, so mobile pins it to the right edge a quarter of the way down the viewport instead of
// tracking a listing row (see the `max-sm:` position classes below) — it does not move on scroll.
const CART_BUBBLE_MOBILE_BREAKPOINT = 640;

/**
 * Collapsed cart bubble — a small component so it can live INSIDE the B2B providers and read the
 * Sitecore-managed cart labels (no fixed text). Held with `position: fixed` and re-measured on
 * every scroll (rAF-throttled) plus on any resize of the hits list.
 *
 * Desktop: hovers over the top-right corner of the first listing row (half on the row, half in the
 * surrounding space), tracking the row as the page scrolls; once the row's corner would scroll
 * above `CART_BUBBLE_STICKY_TOP` it clamps there instead of following the row off-screen, and
 * un-clamps once scrolling back up brings it below that line again.
 *
 * Mobile (< `sm`): pinned to the right edge of the viewport, **a quarter of the way down the
 * screen**, staying there regardless of scroll position or header visibility. The right-edge spacing
 * matches the site's cookie-consent icon; the vertical placement deliberately does not — it used to
 * sit in the bottom-right corner, where it collided with that icon's row and with the browser's own
 * bottom chrome, and was then centred before landing on this quarter-height position.
 *
 * **Either way it is a *listing* affordance and hides once the hits list is off screen**, so it does
 * not follow the page down into the footer — where, clamped to `CART_BUBBLE_STICKY_TOP`, it read as
 * a stray second header icon floating over the footer with no list in sight.
 */
const B2BCartBubble = ({ count, onOpen }: { count: number; onOpen: () => void }): JSX.Element => {
  const cartLabels = useB2BCartLabels();
  const itemWord = count === 1 ? cartLabels.item : cartLabels.items;
  const [position, setPosition] = useState<{ top: number; right: number } | null>(null);
  const [pastList, setPastList] = useState(false);

  useLayoutEffect(() => {
    const list = document.getElementById(B2B_PLP_HITS_LIST_ID);
    const half = CART_BUBBLE_SIZE / 2;
    let ticking = false;

    const measure = () => {
      ticking = false;
      const isMobile = window.innerWidth < CART_BUBBLE_MOBILE_BREAKPOINT;

      // Hide once the list no longer reaches the bubble's own line — otherwise scrolling on to the
      // footer leaves it clamped at `CART_BUBBLE_STICKY_TOP`, hovering over the footer near where
      // the site header's own icons sit. Compared against where this breakpoint actually puts the
      // bubble (mobile: a quarter down the viewport; desktop: clamped to the sticky line) rather
      // than a bare "is the list on screen" test, so it goes at the moment the list passes it.
      // Fails open when the list is not in the DOM yet, since the bubble is the only way back to a
      // cart that already has items.
      const listRect = list?.getBoundingClientRect();
      if (listRect) {
        const bubbleTop = isMobile ? window.innerHeight / 4 - half : CART_BUBBLE_STICKY_TOP;
        const gone = listRect.bottom <= bubbleTop || listRect.top >= window.innerHeight;
        setPastList(gone);
        if (gone) {
          return;
        }
      }

      // Below `sm` the bubble is a fixed right-edge button placed by the `max-sm:` classes below,
      // not anchored to a row — nothing to measure.
      if (isMobile) {
        return;
      }

      // Anchor to the first row's actual product-card box (`data-sku`, set by B2BProductLineHit),
      // not its enclosing `<li>` — the temporary demo row's `<li>` also wraps a "TEMPORARY DEMO
      // PRODUCT" label above the card, so `rect.top` on the `<li>` sits higher than the card's
      // visible top border and leaves a gap instead of straddling it.
      const firstRow = list?.querySelector('[data-sku]');
      if (!firstRow) {
        return;
      }
      const rect = firstRow.getBoundingClientRect();
      setPosition({
        top: Math.max(CART_BUBBLE_STICKY_TOP, rect.top - half),
        right: window.innerWidth - rect.right - half,
      });
    };

    const scheduleMeasure = () => {
      if (ticking) {
        return;
      }
      ticking = true;
      window.requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener('resize', scheduleMeasure);
    window.addEventListener('scroll', scheduleMeasure, { passive: true });

    // The list's width (and so the first row's right edge) also changes when the docked cart
    // panel opens/closes and animates the list narrower/wider, and when hits finish loading — a
    // plain 'resize' listener misses both, since neither changes the viewport size. ResizeObserver
    // catches any box-size change on the list itself, including mid-transition frames, so the
    // bubble keeps re-measuring until the animation settles instead of freezing on a stale rect.
    const observer = new ResizeObserver(scheduleMeasure);
    if (list) {
      observer.observe(list);
    }

    return () => {
      window.removeEventListener('resize', scheduleMeasure);
      window.removeEventListener('scroll', scheduleMeasure);
      observer.disconnect();
    };
  }, []);

  // Rendered nothing rather than unmounted: the effect above owns the scroll listener that decides
  // this, so it has to stay alive to bring the bubble back on the way up.
  if (pastList) {
    return <></>;
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`${cartLabels.openCart} (${count} ${itemWord})`}
      title={cartLabels.openCart}
      // `z-mini-cart` (not `z-50`) so the bubble sits in front of the sticky header/nav bars it
      // overlaps on mobile. The hover scale is gated to devices with real hover — on touch a tap
      // otherwise leaves a lingering `:hover` match, making the click read as an unwanted "move".
      // `max-sm:!...` forces the fixed right-edge, quarter-height position on mobile —
      // `!important` so it wins over the inline `top`/`right` from the desktop row-anchor below, in
      // case a resize down to mobile leaves a stale measured value in place. `top-1/4` puts the
      // button's *top* edge a quarter of the way down, so `-translate-y-1/2` pulls it back by half
      // its own height to put the circle's centre on that line (matching the `window.innerHeight / 4`
      // the hide check above uses); that translate needs no `!` (nothing else sets one) and
      // composes with the hover `scale-105` through Tailwind's shared transform variables — which is
      // moot in practice, since `hover:hover` doesn't match a touch device. `outline-none` + a
      // transparent tap-highlight stop
      // the browser's default focus/tap ring from flashing a dark box around the circle when a
      // touch starts on the button and then drags into a scroll.
      className="fixed z-mini-cart flex h-12 w-12 items-center justify-center rounded-full bg-isc2-green text-white-00 shadow-lg outline-none transition-transform [-webkit-tap-highlight-color:transparent] [@media(hover:hover)]:hover:scale-105 max-sm:!bottom-auto max-sm:!right-5 max-sm:!top-1/4 max-sm:-translate-y-1/2"
      // Fallback (top-right area, right edge) until the first row is measured on mount — desktop
      // only; mobile's position always comes from the `max-sm:!...` classes above.
      style={position ? { top: position.top, right: position.right } : { top: 160, right: 24 }}
    >
      {/* Item count as a dark chip straddling the circle's top-right corner — negative offsets sit
          it partially on the green circle and partially outside it, so it reads as a badge rather
          than as part of the icon. `min-w-5` + `px-1` keep it circular at one digit and let it grow
          into a pill past nine, without ever resizing the bubble itself. */}
      <ShoppingCartIcon size={22} />
      <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gray-90 px-1 text-xs text-white-00">
        {count}
      </span>
    </button>
  );
};
import B2BClassroomLocationModal from './B2BClassroomLocationModal';
import { useB2BDemoCart } from './b2bDemoCart'; // TEMP demo private-class cart
import type { Hit as AlgoliaHit } from 'instantsearch.js';
import SearchFiltersMenu from './SearchFiltersMenu';
import SearchNonEditableNotice from './SearchNonEditableNotice';
import { buildDefaultFilterGroups } from './searchFilterGroups';
import FeatureFlagConfigure from './FeatureFlagConfigure';
import { SEARCH_SETTINGS_QUERY } from 'queries/index';

type SearchWrapperProps = ComponentProps & {
  rendering: ComponentRendering | RouteData;
  layoutFields: {
    hideProductSuggestions?: Field<boolean>;
  };
  fields: {
    algoliaAppId: Field<string>;
    algoliaApiKey: Field<string>;
    algoliaIndexName: Field<string>;
    algoliaAutosuggestIndexName: Field<string>;
    placeholderText: Field<string>;
    algoliaProductRecommendationIndexName?: Field<string>;
    noResultsFoundText: Field<string>;
    filterLabel: Field<string>;
    mobileFilterLabel: Field<string>;
    clearFiltersLabel: Field<string>;
    filterKeyValues: KeyValuePair;
    facetKeyValues: FacetKeyValues[];
    seeResultsLabel: Field<string>;
    resultsFoundLabel: Field<string>;
    searchResultPageType: Field<string>;
    trainingProviderLabel: Field<string>;
    trainingMethodLabel: Field<string>;
    startDateLabel: Field<string>;
    endDateLabel: Field<string>;
    locationLabel: Field<string>;
    buttonLabel: Field<string>;
    tooltipValue: Field<string>;
    sortByLabel: Field<string>;
    sortOptions: SortOptions[];
    defaultfiterKeyValues?: SearchDefaultFilter[];
    showLoadMore?: Field<boolean>;
    loadMoreLabel?: Field<string>;
    isSortAvailable: Field<boolean>;
    resultsPageHeading: Field<string>;
    showAllProductsLabel: Field<string>;
    /** B2B PLP: fixed Algolia `filters` string to scope the variant index to real products
     *  (excludes events/sponsorships/donations). Sitecore-driven (env-local datasource field). */
    b2bScopeFilter?: Field<string>;
    /** B2B PLP: the per-variant Algolia index to query. Kept separate from `algoliaIndexName`
     *  (which every other page + the search modal use) so the B2B listing can point at its own
     *  variant index. Sitecore-driven (env-local datasource field) — differs per environment. */
    b2bProductVariantIndexName?: Field<string>;
  };
};

const HIDE_SEARCH_BOX_PAGES = ['Hub Page', 'Training Finder', 'Volunteer Page'];

// The B2B Product Listing Page reuses SearchWrapper but is detected by its Sitecore template
// (not a searchResultPageType value). Its datasource is the env-local "B2B Product Listing
// Algolia Settings" item, which mirrors the site's Algolia credentials + product index (that
// item lives under /Settings and is NOT serialized in this branch — it is created/edited per
// environment; see docs/B2B-EnvLocal-Sitecore-Items.md). On this page the search box +
// interactive facet/filter menu are hidden (filter UX deferred to a later phase); the list is
// category pre-filtered via default filters / URL query.
// B2B_LISTING_TEMPLATE_NAME / B2B_FEATURE_FLAG live in constants/b2b.ts so other global
// components (e.g. Header) can detect this page without importing this (Algolia-heavy) module.

const SearchWrapper = ({ fields, rendering, layoutFields }: SearchWrapperProps) => {
  const { algoliaIndexName, setDefaultFilters, setAlgoliaIndexName, setOverlayFiltersMode } =
    useSearch();
  const { isEditing } = useLayout();
  const { sitecoreContext } = useSitecoreContext();
  const isB2BFeatureEnabled = useFeatureFlag(B2B_FEATURE_FLAG);
  const isB2BListing =
    isB2BFeatureEnabled && sitecoreContext?.route?.templateName === B2B_LISTING_TEMPLATE_NAME;

  // Standing page headline for the B2B PLP — read off the page item, not the datasource (see the
  // <h1> further down for why).
  const b2bPageTitle = (sitecoreContext?.route?.fields?.pageTitle as Field<string> | undefined)
    ?.value;

  // Optional back-link shown above that headline (reference: "‹ Product Categories"). Like the
  // title it is a field on the page item itself — a General Link in the template's own "B2B
  // Listing" section (serialized in this branch; the VALUE is set per environment, see
  // docs/B2B-EnvLocal-Sitecore-Items.md) — because this page's datasource is the shared Algolia
  // Settings template, which has nowhere to put page-specific content. The chevron is NOT part of
  // the link text; SearchResults draws it (see there).
  const b2bBackLink = sitecoreContext?.route?.fields?.backLink as LinkField | undefined;

  // B2B PLP cart open/close state. The cart opens when it has items and slides shut on X
  // (dismiss), then re-opens automatically when a new item is added. Drives both the cart's
  // mount lifecycle and the results-column width (which shrinks in sync). Reading the cart here
  // is a cheap global-context subscription; the value is only used for the B2B PLP.
  const { activeCart } = useCart();
  const cartCount = activeCart?.totalLineItemQuantity ?? 0;
  const demoCart = useB2BDemoCart(); // TEMP demo private-class cart
  const [cartDismissed, setCartDismissed] = useState(false);
  const prevCartCount = useRef(cartCount);
  useEffect(() => {
    if (cartCount > prevCartCount.current) {
      setCartDismissed(false);
    }
    prevCartCount.current = cartCount;
  }, [cartCount]);
  // TEMP: re-open the cart when the demo product is added.
  useEffect(() => {
    if (demoCart.inCart) {
      setCartDismissed(false);
    }
  }, [demoCart.inCart]);
  // `?cart-sku=` link pre-fill state (CART-3), reported by B2BPlpCartPreload below. A `useCallback`
  // because the child reports through an effect — a fresh function each render would re-fire it.
  const [isCartPreloading, setIsCartPreloading] = useState(false);
  const onCartPreloadStateChange = useCallback(
    ({ isPreloading }: { isPreloading: boolean }) => setIsCartPreloading(isPreloading),
    []
  );
  // The panel opens while the pre-fill is still running, so a link-driven arrival shows the cart
  // filling up rather than nothing at all followed by a cart that appears on its own.
  const isCartOpen =
    isB2BListing && (cartCount > 0 || demoCart.inCart || isCartPreloading) && !cartDismissed;
  // Total item count for the collapsed floating cart bubble (folds in the temp demo line).
  const badgeCount = cartCount + (demoCart.inCart ? demoCart.quantity : 0);

  // The bubble is not only a "cart is closed" affordance — it also stands in for the docked panel
  // whenever that panel is open but scrolled out of view, so the cart is always one tap away.
  // Observed only while the panel is open; when it is closed there is nothing to observe and the
  // bubble shows on item count alone.
  // Defaults to `true` (not `false`) so that in the frame between the panel opening and the
  // observer's first callback the bubble stays hidden — starting at `false` flashes the bubble on
  // top of a panel that is plainly on screen.
  const [cartPanelVisible, setCartPanelVisible] = useState(true);
  useEffect(() => {
    if (!isCartOpen) {
      setCartPanelVisible(true);
      return undefined;
    }

    const panel = document.getElementById(B2B_PLP_CART_ASIDE_ID);
    if (!panel) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setCartPanelVisible(entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(panel);

    return () => observer.disconnect();
  }, [isCartOpen]);

  const showCartBubble = isB2BListing && badgeCount > 0 && (!isCartOpen || !cartPanelVisible);

  // Clicking the bubble while the panel is already open (just scrolled away) should bring the
  // panel back rather than re-run the open animation on something already open.
  const onCartBubbleClick = useCallback(() => {
    if (isCartOpen) {
      document
        .getElementById(B2B_PLP_CART_ASIDE_ID)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setCartDismissed(false);
  }, [isCartOpen]);

  // B2B PLP sort (prototype toolbar), applied client-side to the rendered hits:
  //   - recommended → Algolia relevance order (no comparator)
  //   - alpha       → by title A→Z
  //   - price-*      → by the commercetools standalone price (NON_MEMBERS) loaded per SKU.
  //     The crawler index has no price, so we sort by the lazily-loaded CT prices. Rows whose
  //     price hasn't resolved yet are held back from rendering entirely (see
  //     SearchInfiniteHits' sortNeedsPricing) rather than shown unsorted and re-shuffled once
  //     their price arrives — avoids the "prices out of order while scrolling" jump as new
  //     lazy-loaded pages resolve their prices asynchronously.
  const { productPrices } = useStandalonePrices();
  const [b2bSort, setB2bSort] = useState<B2BSortKey>(DEFAULT_B2B_SORT);
  const isPriceSort = b2bSort === 'price-asc' || b2bSort === 'price-desc';

  // Read by the router's `createURL` (below), which runs outside React's render/effect cycle — a
  // ref, not state, so the URL InstantSearch writes always carries the sort as it is right now.
  const b2bSortRef = useRef(b2bSort);
  b2bSortRef.current = b2bSort;

  // Restore `?sort=` from the URL on mount rather than in the useState initializer: the initializer
  // also runs during SSR, where there is no location, so seeding from it client-side only would
  // make the first client render disagree with the server's and trip a hydration mismatch.
  const b2bSortUrlReadyRef = useRef(false);
  useEffect(() => {
    if (!isB2BListing) {
      return;
    }
    setB2bSort(readB2bSortParam(window.location.search));
    b2bSortUrlReadyRef.current = true;
  }, [isB2BListing]);

  // Keep the URL in step when the sort alone changes — InstantSearch only rewrites the URL when
  // its own state changes, and picking a sort does not touch it. Gated on the read above having
  // run, so the initial default never strips a `sort=` that was present in the opened link.
  // `replaceState` (not push): a sort change is not a separate back-button step.
  useEffect(() => {
    if (!isB2BListing || !b2bSortUrlReadyRef.current) {
      return;
    }
    const { origin, pathname, search, hash } = window.location;
    const nextQuery = withB2bSortParam(search.replace(/^\?/, ''), b2bSort);
    window.history.replaceState(
      window.history.state,
      '',
      `${origin}${pathname}${nextQuery ? `?${nextQuery}` : ''}${hash}`
    );
  }, [isB2BListing, b2bSort]);

  const b2bSortComparator = useMemo(() => {
    if (!isB2BListing || b2bSort === 'recommended') {
      return undefined;
    }

    if (b2bSort === 'alpha') {
      return (a: AlgoliaHit<SearchResultHit>, b: AlgoliaHit<SearchResultHit>) =>
        String(a.title ?? '').localeCompare(String(b.title ?? ''));
    }

    const amountOf = (hit: AlgoliaHit<SearchResultHit>): number | null => {
      const sku = (hit.sku ?? hit.objectID) as string;
      const price = productPrices?.[sku]?.[CUSTOMER_PRICING_GROUP_MAP.NON_MEMBERS];
      const money = price?.discounted?.value ?? price?.value;
      const cents = (money as { centAmount?: number } | undefined)?.centAmount;
      return typeof cents === 'number' ? cents : null;
    };

    const direction = b2bSort === 'price-asc' ? 1 : -1;
    return (a: AlgoliaHit<SearchResultHit>, b: AlgoliaHit<SearchResultHit>) => {
      const pa = amountOf(a);
      const pb = amountOf(b);
      if (pa === null && pb === null) return 0;
      if (pa === null) return 1; // unpriced sorts last
      if (pb === null) return -1;
      return (pa - pb) * direction;
    };
  }, [isB2BListing, b2bSort, productPrices]);

  // B2B PLP price-range FILTER (prototype). Price is not an Algolia facet (it comes per SKU from
  // commercetools — see priceBuckets.ts), so unlike the other facets it can't refine server-side.
  // The applied buckets are plain React state, filtered into the rendered hits client-side using
  // the same lazily-loaded CT prices the price *sort* uses, and bulk-fetched + held the same way
  // (see isPriceFilterActive below). Empty set = no price filter.
  const [b2bPriceBuckets, setB2bPriceBuckets] = useState<Set<string>>(() => new Set());
  const isPriceFilterActive = b2bPriceBuckets.size > 0;

  // The price tiers are per-currency (see getPriceBuckets): thresholds that read as sensible shelf
  // prices in the shopper's own currency, not one USD ladder shown everywhere. Derived from the
  // same `currencyCode` the pricing provider fetches with, so the bands always match the prices on
  // the rows — and because bucket ids are currency-agnostic tier ids, an applied filter survives a
  // currency switch and simply re-applies at the new currency's bounds (the provider re-prices the
  // catalog on that switch, so the list re-filters itself).
  const { currencyCode, setCurrencyCode } = useUserSession();
  const b2bPriceBucketOptions = useMemo(() => getPriceBuckets(currencyCode), [currencyCode]);

  // A CPQ (quoted) cart pins the session to the quote's currency, exactly as the cart page does
  // (`Cart/ShoppingCart`): the quote was priced in one currency and must never be re-priced, so if
  // the shopper switched currency before landing here, the switch is undone rather than applied to
  // the cart. Keeping the session and the cart in agreement is also what makes the mismatch
  // re-price path (`rebuildCartInSelectedCurrency`, guarded in B2BProductLineHitContainer)
  // unreachable while a quote is active. B2B listing only, and only for a CPQ cart — everyone else
  // keeps free currency switching.
  const isCpqCart = Boolean(activeCart?.computed?.isB2B);
  useEffect(() => {
    if (!isB2BListing || !isCpqCart) {
      return;
    }
    const cartCurrencyCode = activeCart?.computed?.currencyCode;
    if (cartCurrencyCode && cartCurrencyCode !== currencyCode) {
      setCurrencyCode(cartCurrencyCode as CurrencyCodes);
    }
  }, [isB2BListing, isCpqCart, activeCart?.computed?.currencyCode, currencyCode, setCurrencyCode]);

  // Read by the router's `createURL`, which runs outside React's cycle — a ref so the `?price=` it
  // writes always reflects the buckets as they are right now (mirrors b2bSortRef).
  const b2bPriceRef = useRef(b2bPriceBuckets);
  b2bPriceRef.current = b2bPriceBuckets;

  const onTogglePriceBucket = useCallback((bucketId: string) => {
    setB2bPriceBuckets((prev) => {
      const next = new Set(prev);
      if (next.has(bucketId)) {
        next.delete(bucketId);
      } else {
        next.add(bucketId);
      }
      return next;
    });
  }, []);

  // Restore `?price=` from the URL on mount — same client-only timing as the sort read, to avoid a
  // hydration mismatch (the SSR render has no location).
  const b2bPriceUrlReadyRef = useRef(false);
  useEffect(() => {
    if (!isB2BListing) {
      return;
    }
    setB2bPriceBuckets(readB2bPriceParam(window.location.search));
    b2bPriceUrlReadyRef.current = true;
  }, [isB2BListing]);

  // Keep the URL in step when the applied price buckets alone change — like the sort, a price
  // toggle doesn't touch InstantSearch's own state, so InstantSearch won't rewrite the URL for it.
  useEffect(() => {
    if (!isB2BListing || !b2bPriceUrlReadyRef.current) {
      return;
    }
    const { origin, pathname, search, hash } = window.location;
    const nextQuery = withB2bPriceParam(search.replace(/^\?/, ''), b2bPriceBuckets);
    window.history.replaceState(
      window.history.state,
      '',
      `${origin}${pathname}${nextQuery ? `?${nextQuery}` : ''}${hash}`
    );
  }, [isB2BListing, b2bPriceBuckets]);

  // Predicate applied to each rendered hit when a price bucket is active (see SearchInfiniteHits).
  // Undefined when no bucket is applied, so the hit list renders untouched. A hit whose price has
  // not resolved yet is withheld (returns false) — the same bulk-fetch + hold that price sort uses
  // guarantees every SKU is priced before the list is shown, so this never hides a real match.
  const b2bPriceFilter = useMemo(() => {
    if (!isB2BListing || !isPriceFilterActive) {
      return undefined;
    }
    return (hit: AlgoliaHit<SearchResultHit>): boolean => {
      const sku = (hit.sku ?? hit.objectID) as string;
      const price = productPrices?.[sku]?.[CUSTOMER_PRICING_GROUP_MAP.NON_MEMBERS];
      const money = price?.discounted?.value ?? price?.value;
      const { centAmount: cents, fractionDigits } =
        (money as { centAmount?: number; fractionDigits?: number } | undefined) ?? {};
      if (typeof cents !== 'number') {
        return false;
      }
      // Compare in MAJOR units, honouring the currency's own `fractionDigits` — JPY reports 0, so
      // a fixed /100 would divide yen by 100 and drop every JPY product into the cheapest bucket.
      return priceInAnyBucket(
        toMajorUnits(cents, fractionDigits),
        b2bPriceBuckets,
        b2bPriceBucketOptions
      );
    };
  }, [isB2BListing, isPriceFilterActive, productPrices, b2bPriceBuckets, b2bPriceBucketOptions]);

  // Unconditional row filter for the B2B listing: a variant whose scheduled session has already
  // started must not be listed at all. Only an actual, filled-in, elapsed session hides a row — most
  // records carry no `startDate` and those always stay visible (see hasSessionStarted).
  //
  // `hasSessionStarted` reuses the PDP's own `getUTCTime`, so the start time and the session's
  // timezone are resolved here exactly as the buy box resolves them. That matters: this used to
  // compare whole calendar days while the PDP compared instants, so a session that began at 09:00
  // stayed listed all day and then turned out to have no selectable date on the product page.
  //
  // Client-side on purpose. `startDate` sits in the index as a plain `YYYY-MM-DD` STRING and
  // `numericAttributesForFiltering` is empty, so Algolia offers no range filter to express
  // "before today" server-side. The only server-side option is a literal `NOT startDate:"…"` per
  // past value read from the facet response — measured to work (780 → 532 hits) but it oscillates:
  // once applied, the response only reports the values that survived it, the derived list collapses
  // to nothing, and the filter drops itself. It also flashes the past rows on first load, before any
  // facet response exists. Filtering the rows here has neither problem, and the header total is kept
  // honest by counting the hidden rows off the `startDate` facet instead — see
  // useB2BPastSessionCount, which is why that facet is requested below.
  const b2bRowFilter = useMemo(() => {
    if (!isB2BListing) {
      return undefined;
    }
    // Cast because SearchResultHit is the shared shape for every search page and doesn't declare the
    // schedule fields — they only exist on the B2B variant index's records (same reason the old
    // `hit.startDate as string` cast was here).
    return (hit: AlgoliaHit<SearchResultHit>): boolean => {
      const record = hit as unknown as SessionScheduleFields & {
        modality?: { key?: string };
        region?: { key?: string };
      };
      // An online instructor-led session with no region is not sellable from the listing, so it is
      // hidden here rather than shown as a row that cannot be added (decision 2026-08-05). Applied
      // alongside the past-session rule, not instead of it — a row has to clear both. The header
      // total subtracts these too; see `useB2BListingRowModel`, which counts them only among
      // not-yet-started sessions so the two rules never subtract the same row twice.
      return !hasSessionStarted(record) && !isRegionlessOilSession(record);
    };
  }, [isB2BListing]);

  // B2B PLP <Configure> params. Always applies the Sitecore-driven scope filter (so the variant
  // index only lists real products). On a price sort OR an active price filter it ALSO bulk-fetches
  // the whole facet-filtered set (hitsPerPage) so the client can price + sort/filter it exactly —
  // see B2B_PRICE_SORT_FETCH_MAX and SearchInfiniteHits. Otherwise it pages normally, at
  // B2B_BROWSE_HITS_PER_PAGE per infinite-scroll page rather than the index default of 20.
  const b2bConfigureProps = useMemo<Record<string, unknown> | null>(() => {
    if (!isB2BListing) {
      return null;
    }
    const props: Record<string, unknown> = {};
    // `fields` is optional-chained deliberately: this memo runs BEFORE the `!fields` bail-out below,
    // so a rendering whose Sitecore datasource is missing or deleted would otherwise throw
    // "Cannot read properties of undefined (reading 'b2bScopeFilter')" and take the whole page down
    // instead of rendering nothing. Every other `fields` read in this component already guards.
    if (fields?.b2bScopeFilter?.value) {
      props.filters = fields.b2bScopeFilter.value;
    }
    props.hitsPerPage =
      isPriceSort || isPriceFilterActive ? B2B_PRICE_SORT_FETCH_MAX : B2B_BROWSE_HITS_PER_PAGE;
    // Ask for the `startDate` facet so the header total can subtract the rows `b2bRowFilter` hides
    // (see useB2BPastSessionCount). It rides on the query that was going out anyway — no extra
    // request — and is a *conjunctive* facet, which the refinement-list widgets never touch (they
    // register their attributes as disjunctive), so the filter overlay is unaffected.
    //
    // `maxValuesPerFacet` is explicit and deliberately large: Algolia's default is 10, and the tally
    // is only correct if EVERY dated day comes back. A truncated list cannot be detected from
    // `exhaustiveFacetsCount` (measured 2026-08-03: still `true` at 10 of 156 values), so the value
    // list length is what pastDayFacetCount checks against.
    props.facets = ['startDate'];
    props.maxValuesPerFacet = B2B_STARTDATE_MAX_FACET_VALUES;
    return Object.keys(props).length ? props : null;
  }, [isB2BListing, fields?.b2bScopeFilter?.value, isPriceSort, isPriceFilterActive]);

  // B2B PLP uses the filters overlay on ALL breakpoints — tell the provider not to auto-close
  // it on desktop (default behavior keeps the overlay mobile-only).
  useEffect(() => {
    setOverlayFiltersMode(isB2BListing);
    return () => setOverlayFiltersMode(false);
  }, [isB2BListing, setOverlayFiltersMode]);

  const [algoliaUserToken, setAlgoliaUserToken] = useState<string>('');
  const [isParams, setIsParams] = useState(false);
  const { t } = useI18n();
  const algoliaSettings = useComponentProps<SearchModalAlgoliaSettings>(rendering.uid) ?? null;
  const hideProductSuggestions = layoutFields?.hideProductSuggestions?.value ?? false;

  useEffect(() => {
    const token = getCookie('_ALGOLIA') as string;

    if (token) {
      setAlgoliaUserToken(token);
    }
  }, []);

  useEffect(() => {
    // Index resolution is Sitecore-driven (never hardcoded): every page reads `algoliaIndexName`
    // off its rendering datasource. The B2B PLP additionally prefers its own `b2bProductVariantIndexName`
    // field (the variant index, set per environment on the datasource item) and only falls back to
    // `algoliaIndexName` if that B2B field is empty — so B2B and the rest of search stay independent.
    const resolvedIndexName =
      (isB2BListing && fields?.b2bProductVariantIndexName?.value) ||
      fields?.algoliaIndexName?.value;
    if (!isParams && resolvedIndexName) {
      setAlgoliaIndexName(resolvedIndexName);
    }
  }, [
    fields?.algoliaIndexName?.value,
    fields?.b2bProductVariantIndexName?.value,
    isB2BListing,
    isParams,
    setAlgoliaIndexName,
  ]);

  // Preference to url pramas for indexName. Skipped for the B2B PLP: its URL query holds
  // category filters (e.g. ?category=…), not an index name — the B2B index comes from its own
  // datasource (Algolia Settings) field like every other page.
  useEffect(() => {
    if (!isB2BListing && window.location.search !== '') {
      setIsParams(true);
      let queryString = window.location.search;
      queryString = queryString.split('%')[0];
      const getIndexName = queryString.replace('?', '');
      setAlgoliaIndexName(getIndexName);
    }
  }, [isB2BListing, setAlgoliaIndexName]);

  const baseSearchClient = useMemo(() => {
    if (!fields.algoliaApiKey || !fields.algoliaAppId) {
      return null;
    }

    return algoliasearch(fields.algoliaAppId.value, fields.algoliaApiKey.value);
  }, [fields.algoliaApiKey, fields.algoliaAppId]);

  const searchClient = useMemo(() => {
    if (!baseSearchClient) return null;

    return {
      ...baseSearchClient,
      search(
        ...args: Parameters<AlgoliaSearchClient['search']>
      ): ReturnType<AlgoliaSearchClient['search']> {
        const requests = args[0];
        const isSearchPage =
          typeof window !== 'undefined' && window.location.pathname.toLowerCase() === '/search';

        if (
          isSearchPage &&
          requests.every(({ params }) => !params?.query || params.query.trim() === '')
        ) {
          return Promise.resolve({
            results: requests.map(() => ({
              hits: [],
              nbHits: 0,
              nbPages: 0,
              page: 0,
              processingTimeMS: 0,
              hitsPerPage: 0,
              exhaustiveNbHits: true,
              query: '',
              params: '',
            })),
          }) as ReturnType<AlgoliaSearchClient['search']>;
        }

        return baseSearchClient.search(...args);
      },
    } as AlgoliaSearchClient;
  }, [baseSearchClient]);

  const renderSearchHit = useCallback(
    (hit: Hit<SearchResultHit>, index: number, isFeatured: boolean) => {
      const hitLabels = () => ({
        trainingProviderLabel: fields?.trainingProviderLabel.value,
        trainingMethodLabel: fields?.trainingMethodLabel.value,
        startDateLabel: fields?.startDateLabel.value,
        endDateLabel: fields?.endDateLabel.value,
        locationLabel: fields?.locationLabel.value,
        buttonLabel: fields?.buttonLabel.value,
        tooltipValue: fields?.tooltipValue?.value,
      });

      if (fields.searchResultPageType.value === 'Training Finder') {
        return <TrainingFinderHit hit={hit} labels={hitLabels()} />;
      }

      if (fields.searchResultPageType.value === 'Volunteer Page') {
        return <VolunteerSearchHit hit={hit} labels={hitLabels()} />;
      }

      // B2B Product Listing Page (filter page). Reuses the whole Search shell —
      // InstantSearch + the B2B Algolia Settings datasource — and only swaps the row
      // renderer. Detected by the page's Sitecore template. The page is gated `b2bAdminOnly`
      // in Sitecore, so this branch is B2B-only (CTX-4).
      if (isB2BListing) {
        return <B2BProductLineHitContainer hit={hit as unknown as B2BProductHit} />;
      }

      return <SearchHit hit={hit} index={index} isFeatured={isFeatured} />;
    },
    [
      isB2BListing,
      fields.searchResultPageType?.value,
      fields?.trainingProviderLabel?.value,
      fields?.trainingMethodLabel?.value,
      fields?.startDateLabel?.value,
      fields?.endDateLabel?.value,
      fields?.locationLabel?.value,
      fields?.buttonLabel?.value,
      fields?.tooltipValue?.value,
    ]
  );

  useEffect(() => {
    if (fields.defaultfiterKeyValues?.length) {
      setDefaultFilters(fields.defaultfiterKeyValues);
    }
  }, [fields.defaultfiterKeyValues, setDefaultFilters]);

  const initialQuery = useMemo(() => {
    if (typeof window !== 'undefined') {
      const parsedURL = decodeURI(window.location.href);
      const [url, query] = parsedURL.split('[query]=');

      if (url && query && typeof query === 'string') {
        return query;
      }
    }

    return '';
  }, []);

  const defaultFilters = useMemo(
    () => buildDefaultFilterGroups(fields.defaultfiterKeyValues).join(' AND '),
    [fields.defaultfiterKeyValues]
  );

  const hideInputBox = useMemo(
    () => HIDE_SEARCH_BOX_PAGES.includes(fields.searchResultPageType?.value) || isB2BListing,
    [fields.searchResultPageType?.value, isB2BListing]
  );

  // B2B PLP: the shared SearchBox filter bar + full-screen SearchFiltersMenu are NOT used — the
  // B2B filter is a pop-up anchored to a button in the sticky right column (B2BPlpFilter, above
  // the cart). So hide the shared filter chrome for B2B (the search box is also hidden). Other
  // pages keep the normal sidebar/mobile-overlay behavior.
  const hideFilterMenu = isB2BListing;

  // B2B PLP URL routing — keep shared links clean and human-readable. The default `routing` boolean
  // keys every param under the raw Algolia index name and nests refinements, giving
  // `?isc2-product-subscription-dev-b2b[refinementList][certification.key][0]=CISSP` with the
  // brackets percent-escaped into %5B/%5D noise. The state mapping below flattens that to one
  // repeated top-level param per facet with the `.key` index suffix stripped
  // (`?certification=CISSP&certification=CCSP&region=emea01`), and `routeToState` re-appends `.key`
  // by looking the route key back up against the Sitecore-configured facet attributes — so the
  // suffix never has to appear in a shared link. Values are then de-noised by `b2bUrlValueEncoder`:
  // spaces become dashes and every character that is already legal unescaped in a query string is
  // written literally instead of as a %XX escape. B2B ONLY — other search pages read the index name
  // out of the URL (see the isParams effect) and must keep the default routing untouched.
  const b2bRouting = useMemo(() => {
    const attributeByRouteKey = new Map<string, string>();
    (fields?.facetKeyValues ?? []).forEach((facet) => {
      if (facet?.FacetAttribute) {
        attributeByRouteKey.set(
          stripFacetKeySuffix(facet.FacetAttribute).toLowerCase(),
          facet.FacetAttribute
        );
      }
    });

    // The params this routing is authoritative for, and therefore the only ones `createURL` is
    // allowed to rewrite: the facets it maps, the free-text query, and the two it re-appends from
    // refs. Every other param in the URL belongs to somebody else and is carried through.
    const routingOwnedParams: ReadonlySet<string> = new Set([
      ...attributeByRouteKey.keys(),
      'query',
      B2B_SORT_PARAM,
      B2B_PRICE_PARAM,
    ]);

    return {
      router: historyRouter({
        createURL({ qsModule, routeState, location }) {
          const { origin, pathname, hash, search } = location;
          // Neither the sort nor the applied price buckets are part of InstantSearch's state, so
          // both are re-appended on every write — otherwise refining a facet would drop a `?sort=`
          // or `?price=` that is currently in effect. Both read a ref so the value is always current.
          // Everything else already in the URL is then carried over untouched — see
          // `withPreservedParams` for why (`?cart-sku=`, `?cartId=`, analytics params).
          const queryString = withPreservedParams(
            withB2bPriceParam(
              withB2bSortParam(
                qsModule.stringify(routeState, {
                  arrayFormat: 'repeat',
                  encodeValuesOnly: true,
                  encoder: b2bUrlValueEncoder,
                }),
                b2bSortRef.current
              ),
              b2bPriceRef.current
            ),
            search,
            routingOwnedParams
          );
          return queryString
            ? `${origin}${pathname}?${queryString}${hash}`
            : `${origin}${pathname}${hash}`;
        },
        parseURL({ qsModule, location }) {
          // qs.parse returns ParsedQs; InstantSearch's own default router casts this the same way.
          return qsModule.parse(location.search.slice(1), {
            arrayLimit: 99,
          }) as unknown as UiState;
        },
      }),
      stateMapping: {
        stateToRoute(uiState: UiState) {
          const indexUiState = uiState[algoliaIndexName] ?? {};
          const routeState: Record<string, string | string[]> = {};

          if (indexUiState.query) {
            routeState.query = indexUiState.query;
          }

          Object.entries(indexUiState.refinementList ?? {}).forEach(([attribute, values]) => {
            if (values?.length) {
              routeState[stripFacetKeySuffix(attribute)] = values.map(toB2bUrlFacetValue);
            }
          });

          return routeState as unknown as UiState;
        },
        routeToState(routeState: UiState) {
          const route = (routeState ?? {}) as unknown as Record<string, string | string[]>;
          const refinementList: Record<string, string[]> = {};

          Object.entries(route).forEach(([routeKey, value]) => {
            const attribute = attributeByRouteKey.get(routeKey.toLowerCase());
            if (!attribute || value === undefined || value === null) return;
            refinementList[attribute] = (Array.isArray(value) ? value : [value]).map(String);
          });

          return {
            [algoliaIndexName]: {
              ...(typeof route.query === 'string' && route.query ? { query: route.query } : {}),
              ...(Object.keys(refinementList).length ? { refinementList } : {}),
            },
          } as UiState;
        },
      },
    };
  }, [algoliaIndexName, fields?.facetKeyValues]);

  if (!searchClient || !fields || !algoliaIndexName) {
    return null;
  }

  if (isEditing) {
    return <SearchNonEditableNotice />;
  }

  return (
    <InstantSearch
      searchClient={searchClient}
      indexName={algoliaIndexName}
      routing={isB2BListing ? b2bRouting : true}
    >
      {/* MUST stay above <Configure>: it resets the page in the same commit that raises
          hitsPerPage, and relies on running first. See the component for why. */}
      {isB2BListing && <B2BBulkFetchPageReset bulkFetching={isPriceSort || isPriceFilterActive} />}
      {/* `?cart-sku=` link pre-fill (CART-3) — B2B listing only (so behind the B2B feature flag,
          which `isB2BListing` already requires) and never against a CPQ cart, which is read-only
          (CTX-5). Rendered, not hook-called, so it is absent rather than inert elsewhere. */}
      {isB2BListing && !isCpqCart && <B2BPlpCartPreload onStateChange={onCartPreloadStateChange} />}
      {/* B2B PLP: fixed scope filter (Sitecore-driven) so the variant index only lists real
          products (excludes events/sponsorships/donations), plus a bulk hitsPerPage on price sorts
          so the whole facet-filtered set can be priced + sorted exactly. Applies to every query. */}
      {b2bConfigureProps && (
        <Configure {...(b2bConfigureProps as unknown as Record<string, unknown>)} />
      )}
      {typeof window !== 'undefined' && window.location.pathname.toLowerCase() === '/insights' && (
        <div className="sm:px-8 lg:pl-16 lg:pr-40 text-right relative">
          <Link
            href="/api/rss/insights"
            target="_blank"
            className="inline-block absolute -top-10 right-6 sm:top-[-40px] sm:right-[24px]"
          >
            <RssFeedIcon size={20} className="test" />
          </Link>
        </div>
      )}
      {/* B2B PLP has no leading component (banner/RTE) and hides the search box, so nothing
          otherwise clears the fixed header — add the same top clearance the search box uses.
          If a leading component is later placed above the PLP, this can be removed. */}
      <main data-insights-index={algoliaIndexName} className={isB2BListing ? 'pt-36' : undefined}>
        {algoliaSettings && (
          <AutocompleteProvider
            algoliaSettings={algoliaSettings}
            initialQuery={initialQuery}
            showNoResultsContent={false}
          >
            <FeatureFlagConfigure
              filters={defaultFilters}
              hitsPerPage={10}
              clickAnalytics
              getRankingInfo
              userToken={algoliaUserToken}
              startSearchTriggerTypes={algoliaSettings?.algoliaDetails?.startSearchTriggerTypes}
            />
            <SearchBox
              hideInput={hideInputBox}
              filterLabel={fields.mobileFilterLabel}
              resultsFoundLabel={fields.resultsFoundLabel}
              hideFilters={hideFilterMenu}
              overlayFilters={isB2BListing}
            />
            <B2BPrivateClassProvider enabled={isB2BListing}>
              <SearchResults
                noResultsFoundText={fields.noResultsFoundText}
                clearFiltersLabel={fields.clearFiltersLabel}
                filterKeyValues={fields.facetKeyValues}
                resultsFoundLabel={fields.resultsFoundLabel}
                hideInput={hideInputBox}
                hideProductSuggestions={hideProductSuggestions || isB2BListing}
                loadMoreButtonLabel={
                  // B2B PLP always uses the infinite-scroll (sentinel) path, not the "Load More"
                  // <InfiniteHits> component — only that path honors the client-side sort comparator.
                  isB2BListing || !fields.showLoadMore?.value ? '' : fields.loadMoreLabel?.value
                }
                sortByLabel={fields?.sortByLabel?.value}
                sortOptions={fields?.sortOptions}
                isSortAvailable={fields?.isSortAvailable?.value}
                renderHit={renderSearchHit}
                heading={fields.resultsPageHeading}
                showAllProductsLabel={fields.showAllProductsLabel}
                searchClient={searchClient}
                algoliaIndexName={algoliaIndexName}
                overlayFilters={isB2BListing}
                listingTitle={
                  /* B2B PLP page headline. The datasource's `resultsPageHeading` only renders when
                   there is an active search `query`, and this page hides the search box entirely —
                   so the standing title comes from the page item's own `pageTitle` field (the
                   Metadata template field every page has, previously only used for the <title>
                   tag). It is handed to SearchResults rather than rendered above it because the
                   reference puts it on the SAME row as the Filter/Sort controls, sharing their
                   vertical rhythm. Sitecore-editable per environment; see
                   docs/B2B-EnvLocal-Sitecore-Items.md. */
                  isB2BListing ? b2bPageTitle : undefined
                }
                listingBackLink={isB2BListing ? b2bBackLink : undefined}
                sortComparator={b2bSortComparator}
                // Withhold rows behind the spinner until every SKU is priced whenever price drives
                // what's shown — a price sort OR an active price-bucket filter (both need the full
                // set priced client-side, see priceFilter below).
                sortNeedsPricing={isB2BListing && (isPriceSort || isPriceFilterActive)}
                priceFilter={isB2BListing ? b2bPriceFilter : undefined}
                // Hides variants whose scheduled start date has already passed (see b2bRowFilter).
                rowFilter={b2bRowFilter}
                // Same condition as the `hitsPerPage` in b2bConfigureProps above, so the list can
                // recognise a bulk response and never page ahead off a pre-switch one.
                bulkFetchHitsPerPage={
                  isB2BListing && (isPriceSort || isPriceFilterActive)
                    ? B2B_PRICE_SORT_FETCH_MAX
                    : undefined
                }
                // Rows are on screen before their commercetools price is, so the next page has to
                // start loading well before it is reached — see B2B_BROWSE_PREFETCH_AHEAD_PX.
                prefetchAheadPx={isB2BListing ? B2B_BROWSE_PREFETCH_AHEAD_PX : undefined}
                asideOpen={isCartOpen}
                toolbar={
                  isB2BListing ? (
                    <>
                      {/* Toolbar labels are NOT passed from the datasource: this page shares
                        /search's Algolia Search Settings item, whose filterLabel /
                        clearFiltersLabel hold search copy. B2BPlpFilter reads the Sitecore
                        "Toolbar" label group instead (useB2BToolbarLabels). */}
                      <B2BPlpFilter
                        filterKeyValues={fields.facetKeyValues}
                        showMoreLabel={t('showMore')}
                        priceBuckets={b2bPriceBuckets}
                        onTogglePriceBucket={onTogglePriceBucket}
                        priceBucketOptions={b2bPriceBucketOptions}
                        // For the panel's own unrefined-facet-values query — the filter options must
                        // stay listed whatever is ticked, and the live search response only ever
                        // reports the values that survive the current selection (useB2BAllFacetValues).
                        searchClient={searchClient}
                        indexName={algoliaIndexName}
                        // Clear resets the whole listing back to its default view, which includes
                        // the sort AND the applied price buckets — both live here, so both resets are
                        // passed down. The refs are written by hand as well as through state:
                        // `setB2bSort`/`setB2bPriceBuckets` don't land until the next render, but Clear
                        // drops its refinements synchronously right after this runs, and the router
                        // serialises `sort=`/`price=` off the refs during that same tick. State alone
                        // would leave it reading the pre-Clear values.
                        onClear={() => {
                          b2bSortRef.current = DEFAULT_B2B_SORT;
                          setB2bSort(DEFAULT_B2B_SORT);
                          b2bPriceRef.current = new Set();
                          setB2bPriceBuckets(new Set());
                        }}
                      />
                      <B2BPlpSort
                        value={b2bSort}
                        onChange={setB2bSort}
                        sortByLabel={fields?.sortByLabel?.value}
                      />
                    </>
                  ) : undefined
                }
                asidePanel={
                  isB2BListing ? (
                    <B2BPlpCart
                      open={isCartOpen}
                      onClose={() => setCartDismissed(true)}
                      isPreloading={isCartPreloading}
                    />
                  ) : undefined
                }
              />
              {isB2BListing && <B2BClassroomLocationModal />}
              {/* Collapsed cart bubble (prototype): shows whenever the cart holds something and
                  the docked panel is not actually on screen — either because it is closed, or
                  because it is open but scrolled out of view (long lists put it far above the
                  fold). Clicking it opens the cart, or scrolls the already-open panel back into
                  view. Inside the provider so its label is Sitecore-driven. */}
              {showCartBubble && <B2BCartBubble count={badgeCount} onOpen={onCartBubbleClick} />}
            </B2BPrivateClassProvider>
            {!hideFilterMenu && (
              <SearchFiltersMenu
                filterLabel={fields.filterLabel}
                clearFiltersLabel={fields.clearFiltersLabel}
                seeResultsLabel={fields.seeResultsLabel}
                filterKeyValues={fields.facetKeyValues}
                sortByLabel={fields?.sortByLabel?.value}
                sortOptions={fields?.sortOptions}
                isSortAvailable={fields?.isSortAvailable?.value}
                showMoreLabel={t('showMore')}
                overlayFilters={isB2BListing}
              />
            )}
            <ScrollToTop />
          </AutocompleteProvider>
        )}
      </main>
    </InstantSearch>
  );
};

export const getStaticProps: GetStaticComponentProps = async (): Promise<unknown> => {
  return await getGraphQLResult<SearchModalAlgoliaSettings>(SEARCH_SETTINGS_QUERY);
};

export default SearchWrapper;
