import React, { useCallback, useEffect, useMemo, useRef, useState, type Dispatch } from 'react';
import { useInfiniteHits, InfiniteHits, useInstantSearch } from 'react-instantsearch-hooks-web';
import { createInfiniteHitsSessionStorageCache } from 'instantsearch.js/es/lib/infiniteHitsCache';
import type { Hit } from 'instantsearch.js';
import clsx from 'clsx';

import { SearchResultHit } from 'types/index';
import { trackFunction } from 'hooks/index';
import { useStandalonePrices } from 'providers/index';
import { LoadingIndicator } from 'ui/index';

export type HitComparator = Parameters<Hit<SearchResultHit>[]['sort']>[0];
export type HitPredicate = (hit: Hit<SearchResultHit>) => boolean;

interface SearchInfiniteHitsProps {
  renderHit: (hit: Hit<SearchResultHit>, index: number, isFeatured: boolean) => JSX.Element | null;
  loadMoreButtonLabel: string;
  ProductsRecommendations?: JSX.Element;
  hideProductSuggestions: boolean;
  /** Optional client-side sort applied to the hit list (B2B PLP). When omitted, the default
   *  vendor (ISC2-first) ordering is used — other pages are unaffected. */
  sortComparator?: HitComparator;
  /** Optional override for the hit list (`<ul>`) className (B2B PLP uses a flex-gap column so
   *  rows are evenly spaced). Defaults to the existing spacing. */
  listClassName?: string;
  /** Optional id on the hit list `<ul>` (B2B PLP uses this to locate the first rendered row —
   *  in DOM/sorted order, not Algolia rank — for the floating cart bubble's position). */
  listId?: string;
  /** B2B PLP: true when the active sort needs the commercetools standalone price (price-asc/
   *  price-desc). When set, every loaded hit's SKU is queued for pricing as soon as it's loaded
   *  (not just once its row mounts), and a hit is withheld from the rendered list until its price
   *  resolves — so newly-loaded rows appear already correctly sorted instead of popping in
   *  unpriced (sorting last) and then jumping into place once their price arrives. */
  sortNeedsPricing?: boolean;
  /** B2B PLP: client-side price-bucket filter. When set, only hits for which it returns true are
   *  rendered (see SearchWrapper's b2bPriceFilter). Price isn't an Algolia facet, so the whole set
   *  is bulk-fetched + priced (via sortNeedsPricing) and filtered here rather than server-side. */
  priceFilter?: HitPredicate;
  /** B2B PLP: unconditional client-side row filter — only hits for which it returns true are
   *  rendered, featured ones included. Separate from `priceFilter` because it owes nothing to
   *  pricing: it applies with or without a bulk fetch, and it is the reason the results total can
   *  disagree with Algolia's `nbHits` (see SearchWrapper's `b2bRowFilter`, which drops sessions
   *  whose start date has already passed — `startDate` is a plain string in the index, so there is
   *  no server-side range filter to do it with). */
  rowFilter?: HitPredicate;
  /** B2B PLP: turns the loaded hits into the rows to render, which is not one-to-one there — a class
   *  session is expanded into one extra row per purchase option it references (see
   *  `expandPurchaseOptionRows`). Applied to the raw hit list BEFORE everything else, so a generated
   *  row is queued for pricing under its own bundle SKU, sorts on its own price, and passes through
   *  `rowFilter`/`priceFilter` exactly like a real hit. Omit on every other page and the list stays
   *  one row per hit. */
  rowExpand?: (_hits: Hit<SearchResultHit>[]) => Hit<SearchResultHit>[];
  /** B2B PLP: reports how many hits actually survive the client-side `priceFilter`, so the results
   *  total can show the filtered figure instead of Algolia's (which cannot know about a filter
   *  applied here). `null` means "no meaningful number yet" — either no price filter is active, or
   *  the set is still being priced — and the caller should fall back to the Algolia count. Only the
   *  settled value is ever reported, so the total never counts up as prices trickle in. */
  onFilteredCountChange?: Dispatch<number | null>;
  /** B2B PLP: opt out of the shared sessionStorage hit cache and use InstantSearch's per-widget
   *  in-memory one instead. See the comment on `sessionStorageCache` below. */
  disableHitsSessionCache?: boolean;
  /** B2B PLP: the `hitsPerPage` SearchWrapper configures while bulk-fetching for a price sort or
   *  price bucket (`B2B_PRICE_SORT_FETCH_MAX`). Used solely to tell whether the results currently in
   *  hand are the bulk ones yet — see the auto-advance effect, which must not page ahead off a
   *  response that predates the switch. Omit when not bulk-fetching. */
  bulkFetchHitsPerPage?: number;
  /** How far ahead of the scroll sentinel to start loading the next page, in px. Raise it on a list
   *  whose rows need more than the Algolia response to be complete — the B2B PLP's prices come from
   *  commercetools after the rows mount, so it needs more lead time than a list that renders fully
   *  from the hit itself. Must stay under one page's rendered height or the sentinel is still inside
   *  the observer's expanded root after the page it triggered renders, and the pages chain-load.
   *  Defaults to the modest distance that has always been used here. */
  prefetchAheadPx?: number;
  /** Rendered as the first `<li>` of the hit list, inside the same `<ul>` as the hits so it shares
   *  their spacing and width (B2B PLP: the TEMPORARY demo private-class row, which must read as the
   *  top row of the listing rather than a detached block above it). Not an Algolia hit — it is not
   *  sorted, filtered, priced, or counted. */
  leadingItem?: React.ReactNode;
}

// Shared across every infinite-hits list in the app under one sessionStorage key
// (`ais.infiniteHits`), holding the loaded hits keyed by page so a back-navigation can restore the
// scroll position. It is a poor fit for the B2B PLP and is opted out of there
// (`disableHitsSessionCache`): the connector's `showMore` derives the next page from
// `max(currentPage, ...cachedPageNumbers) + 1`, so a cache entry that is stale or belongs to
// another list can leave paging stuck. The B2B PLP makes that likely — its price sort raises
// `hitsPerPage` to 1000, and serializing ~1000 full Algolia records blows sessionStorage's ~5MB
// quota, at which point `setItem` throws, the write is silently swallowed, and the entry left
// behind no longer matches what is actually loaded. Most visible right after Clear, which produces
// the largest result set of all. Omitting `cache` falls back to a per-widget in-memory cache: no
// quota, no cross-list sharing, no persistence to go stale.
const sessionStorageCache = createInfiniteHitsSessionStorageCache();

// How long the price-sort hold will wait with no pricing progress at all before giving up and
// showing the rows anyway. Any progress (another hit priced, another page loaded) restarts the
// clock, so this only trips on a genuine stall — never on a merely slow catalog. Kept short: a
// failed pricing batch now resolves its SKUs immediately (see `standalonePrices.tsx`), so reaching
// this timeout at all means something unforeseen, and the user should not sit through a long wait
// to find that out.
const PRICE_SORT_STALL_MS = 4000;

// Prefetch distance used when the caller does not ask for another (see `prefetchAheadPx`).
const DEFAULT_PREFETCH_AHEAD_PX = 800;

export default function SearchInfiniteHits({
  renderHit,
  loadMoreButtonLabel,
  ProductsRecommendations,
  hideProductSuggestions,
  sortComparator,
  listClassName,
  listId,
  sortNeedsPricing,
  priceFilter,
  rowFilter,
  rowExpand,
  disableHitsSessionCache,
  bulkFetchHitsPerPage,
  prefetchAheadPx = DEFAULT_PREFETCH_AHEAD_PX,
  leadingItem,
  onFilteredCountChange,
}: SearchInfiniteHitsProps) {
  const listClasses = listClassName ?? 'mt-2 sm:mt-0 sm:ml-2';
  const { hits, isLastPage, showMore, results } = useInfiniteHits({
    cache: disableHitsSessionCache ? undefined : sessionStorageCache,
  });

  // The rows to work with, which on the B2B PLP is not the hit list: a class session becomes its own
  // row plus one per purchase option it references. Everything below — pricing, sorting, filtering,
  // counting — runs on this rather than on `hits`, so a generated row is treated as a first-class
  // row and not as a decoration of the one it came from. Identity, not a copy, when no expansion is
  // configured, so no other page pays for this.
  // The cast matches how every other consumer of `hits` in this file already treats them: the
  // connector is untyped here (`Hit<BaseHit>`), while the whole list — sort, filters, renderHit — is
  // written against the app's `SearchResultHit`.
  const rows = useMemo(() => {
    const typed = hits as Hit<SearchResultHit>[];
    return rowExpand ? rowExpand(typed) : typed;
  }, [hits, rowExpand]);

  const sentinelRef = useRef(null);
  const { status } = useInstantSearch();

  const isLoading = useMemo(() => ['loading', 'stalled'].includes(status), [status]);

  const { productPrices, addSkuToPricingQueue, isGettingStandalonePrices } = useStandalonePrices();

  // Queue pricing for every currently-loaded hit as soon as it arrives from Algolia (a whole
  // page at a time), not gated on the row actually mounting — mounting is what we're trying to
  // delay below, so gating on it would deadlock the price fetch that unblocks it.
  useEffect(() => {
    if (!sortNeedsPricing || !rows.length) return;
    const skus = rows.map((hit) => (hit.sku ?? hit.objectID) as string).filter(Boolean);
    if (skus.length) addSkuToPricingQueue(skus);
  }, [sortNeedsPricing, rows, addSkuToPricingQueue]);

  // A hit "has a price resolved" once its SKU key exists in productPrices — the provider always
  // adds the key (even as `{}`) once a fetch completes, whether or not a price was found.
  const isHitPriced = useCallback(
    (hit: Hit<SearchResultHit>) => {
      if (!sortNeedsPricing) return true;
      const sku = (hit.sku ?? hit.objectID) as string;
      return Object.prototype.hasOwnProperty.call(productPrices ?? {}, sku);
    },
    [sortNeedsPricing, productPrices]
  );

  const sortedHits = useMemo(() => {
    // Copy before sorting so we never mutate the InstantSearch hits array in place.
    const next = [...rows];

    if (sortComparator) {
      return next.sort(sortComparator);
    }

    return next.sort((a, b) => {
      const aVendor = a.vendorName || '';
      const bVendor = b.vendorName || '';

      if (aVendor === 'ISC2' && bVendor !== 'ISC2') return -1;
      if (bVendor === 'ISC2' && aVendor !== 'ISC2') return 1;

      return 0;
    });
  }, [rows, sortComparator]);

  useEffect(() => {
    if (sentinelRef.current !== null) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !isLastPage) {
              showMore();
            }
          });
        },
        // Prefetch the next page before the sentinel scrolls into view so items are already loading
        // as you approach the bottom — no pause-then-pop / jump.
        { rootMargin: `${prefetchAheadPx}px 0px` }
      );

      observer.observe(sentinelRef.current);

      return () => {
        observer.disconnect();
      };
    }

    return () => null;
  }, [isLastPage, showMore, prefetchAheadPx]);

  const featuredHits = useMemo(() => {
    const userData = results?.userData || [];
    const promotedItems = sortedHits.filter((hit) => hit._rankingInfo?.promoted);

    // `rowFilter` applies here too — unlike `priceFilter`, which featured rows deliberately bypass.
    // A row hidden because its session has already started must stay hidden however it earned its
    // place on the page; being promoted by an Algolia rule doesn't make a past date current.
    const featured = [...userData, ...promotedItems];

    return rowFilter ? featured.filter(rowFilter) : featured;
  }, [sortedHits, results?.userData, rowFilter]);

  const nonFeaturedHits = useMemo(
    () =>
      sortedHits.filter(
        (hit: Hit<SearchResultHit>) =>
          !hit._rankingInfo?.promoted &&
          // Unconditional row filter (B2B PLP: hide sessions whose start date has passed). Tested
          // before pricing so a hidden row never even waits on a price it will not use.
          (!rowFilter || rowFilter(hit)) &&
          isHitPriced(hit) &&
          // Client-side price-bucket filter (B2B PLP). Safe to apply here because sortNeedsPricing
          // is also on whenever priceFilter is set, so isHitPriced already withheld every not-yet-
          // priced row above — a hit reaching this test has a resolved price to bucket against.
          (!priceFilter || priceFilter(hit))
      ),
    [sortedHits, isHitPriced, priceFilter, rowFilter]
  );

  // Price-sort exactness: SearchWrapper bulk-fetches the whole facet-filtered set on a price sort
  // (a single large page), but its commercetools prices resolve in batches. Until the set is fully
  // loaded AND every loaded hit is priced we don't yet know the true order — so hold the entire
  // list behind the spinner rather than reveal a partially-priced (wrong) order that reshuffles as
  // prices land. Only engages for price sorts; recommended/alpha reveal rows as they load, as
  // before. (A SKU with no CT price still resolves — the provider keys it once the fetch
  // completes — so this never hangs.)
  // Fail-open guard for the hold below. It assumes every queued SKU eventually resolves in the
  // pricing provider — but a failed pricing request does not retry, so those SKUs would never
  // resolve and the list would sit behind the spinner forever (most visibly after Clear, which
  // produces the largest set to price). Track pricing progress and, if nothing has resolved for a
  // while, reveal what we have: a best-effort order (unpriced rows sort last) beats an endless
  // spinner.
  const [pricingStalled, setPricingStalled] = useState(false);

  const pricedHitCount = useMemo(
    () =>
      sortNeedsPricing ? rows.filter((hit: Hit<SearchResultHit>) => isHitPriced(hit)).length : 0,
    [sortNeedsPricing, rows, isHitPriced]
  );

  // Whether the hold *would* apply, before the fail-open guard gets a say: a price-driven view that
  // is still waiting on a page or on a price. Split out from `isPriceSortLoading` because the stall
  // timer below has to key off the wait itself rather than off the sort merely being active.
  const isHoldPending = useMemo(
    () =>
      Boolean(sortNeedsPricing) &&
      (!isLastPage || rows.some((hit: Hit<SearchResultHit>) => !isHitPriced(hit))),
    [sortNeedsPricing, isLastPage, rows, isHitPriced]
  );

  // Arm the stall timer only while the list is actually being held. It used to be armed as soon as
  // the sort was price-driven, which on a cold load of a price-sorted link (e.g. opening
  // `?productType=product-bundle&sort=price-desc` directly) starts it while the list is still empty
  // and no SKU has been queued — so the whole window is spent on the Algolia round trip and the
  // guard has already tripped by the time the rows arrive. That disarmed the hold at precisely the
  // moment it was needed: the rows painted unpriced in relevance order and then visibly re-sorted
  // as prices landed. With nothing held there is nothing to time out, so the clock now starts when
  // the rows do, and any pricing progress restarts it as before.
  //
  // A request that is still in flight is not a stall either, so the clock is suspended while one is
  // outstanding. Progress is only observable when a wave *lands* — a wave prices up to 250 SKUs and
  // resolves them in one step — so between two waves the count sits still even though the fetch is
  // working normally. On a cold load the first wave also pays an auth handshake on top, which
  // measured ~6s locally: longer than the budget below, which would trip the guard mid-hold and
  // produce the very flash this is meant to prevent. Waiting on a live request is bounded (the
  // query does not retry, and a failure resolves its SKUs as priceless via the provider's error
  // effect), so this cannot wait forever; the timeout still covers the case where nothing is in
  // flight and nothing is resolving, which is the genuine stall it was written for.
  useEffect(() => {
    if (!isHoldPending || isGettingStandalonePrices) {
      setPricingStalled(false);
      return undefined;
    }

    setPricingStalled(false);
    const timer = setTimeout(() => setPricingStalled(true), PRICE_SORT_STALL_MS);

    return () => clearTimeout(timer);
  }, [isHoldPending, isGettingStandalonePrices, pricedHitCount, rows.length, isLastPage]);

  const isPriceSortLoading = useMemo(
    () => isHoldPending && !pricingStalled,
    [isHoldPending, pricingStalled]
  );

  // While that hold is on, keep painting the rows that were last on screen instead of emptying the
  // list. The hold exists so a *wrong* order is never shown — but the previous order isn't wrong,
  // it just isn't the new one yet, so blanking bought nothing and made changing the sort look like
  // the page had lost its data (it also collapsed the scroll height out from under the reader).
  // Held rows are dimmed and the list marked `aria-busy`, with the existing spinner below, so the
  // staleness reads as "working" rather than as the final list.
  const heldHitsRef = useRef<typeof nonFeaturedHits>([]);

  useEffect(() => {
    if (!isPriceSortLoading) {
      heldHitsRef.current = nonFeaturedHits;
    }
  }, [isPriceSortLoading, nonFeaturedHits]);

  // Empty when a load arrives already price-sorted (nothing has been on screen yet to hold), which
  // falls back to the original spinner-only wait.
  const renderedHits = isPriceSortLoading ? heldHitsRef.current : nonFeaturedHits;
  const isShowingHeldHits = isPriceSortLoading && renderedHits.length > 0;

  // Report the price-filtered total upward (B2B PLP). Held at `null` until the set is fully loaded
  // AND priced — the same gate that holds the rows themselves — so the caller shows Algolia's count
  // while pricing resolves rather than a partial figure that climbs as batches land. `featuredHits`
  // is added back because those rows bypass `priceFilter` but are still on the page. `.length` deps
  // keep this from re-firing on every new array identity.
  //
  // Deliberately still gated on `priceFilter` alone, not on `rowFilter`: a price filter always comes
  // with the bulk fetch, so counting the loaded hits counts the whole set. `rowFilter` has no such
  // guarantee — with ordinary paging only the pages scrolled so far are in hand, and a count taken
  // from them would read far lower than the truth. So on a plain sort the caller keeps showing
  // Algolia's `nbHits`, which overstates by however many past-dated rows are hidden. Making that
  // figure exact needs the count to come from the server (see the tracker's "for later" note).
  useEffect(() => {
    if (!onFilteredCountChange) {
      return;
    }
    if (!priceFilter || isPriceSortLoading) {
      onFilteredCountChange(null);
      return;
    }
    onFilteredCountChange(nonFeaturedHits.length + featuredHits.length);
  }, [
    onFilteredCountChange,
    priceFilter,
    isPriceSortLoading,
    nonFeaturedHits.length,
    featuredHits.length,
  ]);

  // On a price sort, drive the whole (bounded) result set into memory ourselves rather than wait
  // for the scroll sentinel: hitsPerPage caps at 1000 per query, so a facet-filtered set larger
  // than that (e.g. the unfiltered catalog, now reachable since Algolia's paginationLimitedTo was
  // raised) needs the next page(s) fetched before we can sort by price exactly. Auto-advance until
  // the last page is loaded; the isPriceSortLoading gate above keeps the list hidden meanwhile. No
  // effect on recommended/alpha, which page normally on scroll.
  //
  // Only ever advance off results that belong to the CURRENT configuration. `showMore()` asks for
  // "the highest page loaded, plus one" — but the connector's cache is keyed on the search
  // parameters, so raising hitsPerPage for bulk-fetch mode empties it, and with nothing cached that
  // highest-page-loaded figure falls back to the page the helper happens to sit on. Fired in the
  // same commit as the switch, it therefore asks for page 1 of a set whose page 0 has never been
  // fetched: Algolia answers an out-of-range page with zero hits, `isLastPage` immediately goes
  // true, and the list is left permanently empty with no further query. `isLoading` cannot catch
  // this — the search InstantSearch schedules for the end of the tick has not started yet, so the
  // status this effect closes over is still `idle`. Comparing the response's own `hitsPerPage`
  // against the configured bulk size does: it stays false until the bulk response actually lands.
  const hasBulkFetchResults =
    !bulkFetchHitsPerPage || results?.hitsPerPage === bulkFetchHitsPerPage;

  useEffect(() => {
    if (sortNeedsPricing && hasBulkFetchResults && !isLastPage && !isLoading) {
      showMore();
    }
  }, [sortNeedsPricing, hasBulkFetchResults, isLastPage, isLoading, showMore]);

  useEffect(() => {
    if (sortedHits.length) {
      trackFunction({ event: 'Hits Viewed' });
    }
  }, [sortedHits]);

  const renderHitForInfiniteHits = useCallback(
    ({ hit }: { hit: Hit<SearchResultHit> }) => (
      <div key={hit.objectID}>{renderHit(hit, hit.__position + featuredHits.length, false)}</div>
    ),
    [renderHit, featuredHits.length]
  );

  const FeaturedHitsContent = useMemo(
    () =>
      featuredHits.map((hit: Hit<SearchResultHit>) => (
        <li key={hit.objectID}>{renderHit(hit, hit.__position, true)}</li>
      )),
    [featuredHits, renderHit]
  );

  if (loadMoreButtonLabel) {
    return (
      <ul className={listClasses}>
        {leadingItem && <li>{leadingItem}</li>}
        {FeaturedHitsContent}
        {!hideProductSuggestions && ProductsRecommendations}
        <InfiniteHits<SearchResultHit>
          hitComponent={renderHitForInfiniteHits}
          classNames={{ loadMore: 'cta primary-cta mt-8 sm:mt-10', disabledLoadMore: 'hidden' }}
          showPrevious={false}
          translations={{
            showMoreButtonText: loadMoreButtonLabel,
          }}
        />
      </ul>
    );
  }

  return (
    <>
      <ul id={listId} className={listClasses} aria-busy={isPriceSortLoading || undefined}>
        {/* First row of the list — kept outside the price-sort hold below, since it is not an
            Algolia hit and has no price to wait on. */}
        {leadingItem && <li>{leadingItem}</li>}
        {FeaturedHitsContent}
        {!hideProductSuggestions && ProductsRecommendations}
        {renderedHits.map((hit: Hit<SearchResultHit>) => (
          <li
            key={hit.objectID}
            className={clsx(isShowingHeldHits && 'opacity-60 transition-opacity')}
          >
            {renderHit(hit, hit.__position + featuredHits.length, false)}
          </li>
        ))}
        <li ref={sentinelRef} aria-hidden="true" />
      </ul>
      {(isPriceSortLoading || (isLoading && !isLastPage)) && (
        <LoadingIndicator className="my-8 mx-auto" />
      )}
    </>
  );
}
