import {
  Configure,
  InstantSearch,
  useCurrentRefinements,
  useHits,
  useInfiniteHits,
  useInstantSearch,
  useSearchBox,
  type UseConfigureProps,
} from 'react-instantsearch-hooks-web';
import { Field, Link, LinkField, TextField } from '@sitecore-jss/sitecore-jss-nextjs';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import clsx from 'clsx';
import type { Hit } from 'instantsearch.js';
import { SearchClient } from 'algoliasearch/lite';

import { FacetKeyValues, SearchResultHit, SortOptions } from 'types/index';
import { useAnalyticsTracking, useBreakpoint, useDisableScroll } from 'hooks/index';
import { useSearch } from 'providers/index';
import { useI18n } from 'next-localization';
import { buildProductResultsFilter } from 'utils/search';

import SearchFilters from './SearchFilters';
// Private classes are deferred to a later phase (bug sweep 2026-08-19) — the TEMPORARY demo
// private-class product row is commented out rather than deleted so it can be restored by
// uncommenting when the feature ships.
// import B2BDemoPrivateClassRow from './B2BDemoPrivateClassRow';
import NoResultsBoundary from './NoResultsBoundary';
import SearchInfiniteHits, {
  type HitComparator,
  type HitPredicate,
} from './SearchHits/SearchInfiniteHits';
import SearchNoResults from './SearchNoResults';
import SearchProductResults from './SearchProductResults';
import { expandPurchaseOptionRows, isGeneratedOptionRow } from './b2bPurchaseOptions';
import { useB2BListingRowModel } from './useB2BListingRowModel';
import { useB2BPastSessionCount } from './useB2BPastSessionCount';
import { useB2BPurchaseOptionBundles } from './useB2BPurchaseOptionBundles';

// B2B PLP hits list id — read by SearchWrapper's floating cart bubble to anchor its position to
// the first rendered row (DOM/sorted order). Exported so both sides share one source of truth.
export const B2B_PLP_HITS_LIST_ID = 'b2b-plp-hits-list';

// B2B PLP docked cart `<aside>` id — SearchWrapper observes it to decide whether the floating cart
// bubble is needed (the bubble hides while the panel is actually on screen) and scrolls it back
// into view when the bubble is clicked while the panel is open but scrolled away.
export const B2B_PLP_CART_ASIDE_ID = 'b2b-plp-cart-aside';
import { ANALYTICS_EVENTS } from 'constants/analytics';

export interface SearchResultsProps {
  noResultsFoundText: Field<string>;
  clearFiltersLabel: Field<string>;
  filterKeyValues: FacetKeyValues[];
  resultsFoundLabel: Field<string>;
  sortByLabel: string;
  sortOptions: SortOptions[];
  hideProductSuggestions: boolean;
  renderHit: (hit: Hit<SearchResultHit>, index: number, isFeatured: boolean) => JSX.Element | null;
  loadMoreButtonLabel?: string;
  hideInput: boolean;
  isSortAvailable?: boolean;
  heading: TextField;
  showAllProductsLabel: TextField;
  searchClient: SearchClient;
  algoliaIndexName: string;
  /** Overlay-filter mode (B2B PLP): no persistent desktop sidebar — filters open in an
   *  overlay via the Filter button — and the results take the full width. */
  overlayFilters?: boolean;
  /** Optional right-hand panel docked beside the results (B2B PLP: the on-page cart). */
  asidePanel?: ReactNode;
  /** Top toolbar rendered above the list, right-aligned (B2B PLP: Filter + Sort buttons). */
  toolbar?: ReactNode;
  /** B2B PLP page `<h1>`, rendered at the left of the toolbar row (same row as Filter + Sort). */
  listingTitle?: string;
  /** B2B PLP: optional back-link rendered directly above that `<h1>` (reference: "‹ Product
   *  Categories"). Empty/unset renders nothing at all — no chevron and no gap above the title. */
  listingBackLink?: LinkField;
  /** Whether the aside panel (cart) is open — animates the aside width and shrinks the list. */
  asideOpen?: boolean;
  /** Client-side hit sort (B2B PLP). Passed through to SearchInfiniteHits. */
  sortComparator?: HitComparator;
  /** B2B PLP: true when the active sort needs commercetools pricing (price-asc/price-desc).
   *  Passed through to SearchInfiniteHits so it can hold back not-yet-priced rows. */
  sortNeedsPricing?: boolean;
  /** B2B PLP: client-side price-bucket filter. When set, a hit is only rendered if it returns true
   *  (see SearchWrapper's b2bPriceFilter). Passed through to SearchInfiniteHits. */
  priceFilter?: HitPredicate;
  /** B2B PLP: unconditional client-side row filter — a hit is only rendered if it returns true, and
   *  unlike `priceFilter` featured rows are subject to it too (see SearchWrapper's b2bRowFilter,
   *  which drops sessions whose start date has already passed). Passed through to
   *  SearchInfiniteHits. */
  rowFilter?: HitPredicate;
  /** B2B PLP: the bulk-fetch `hitsPerPage` currently configured, if any. Passed through to
   *  SearchInfiniteHits, which uses it to tell a bulk response from a pre-switch one. */
  bulkFetchHitsPerPage?: number;
  /** B2B PLP: how far ahead of the scroll sentinel to start loading the next page, in px. Passed
   *  through to SearchInfiniteHits — see the prop there for why the PLP needs a longer lead. */
  prefetchAheadPx?: number;
}

const getResultsWidthClassName = (asidePanel?: boolean, overlayFilters?: boolean): string => {
  if (asidePanel) {
    return 'sm:w-8/12 lg:w-8/12';
  }

  if (overlayFilters) {
    return 'sm:w-full lg:w-full';
  }

  return 'sm:w-8/12 lg:w-7/12';
};

const SearchResults = ({
  noResultsFoundText,
  filterKeyValues,
  clearFiltersLabel,
  resultsFoundLabel,
  sortByLabel,
  sortOptions,
  renderHit,
  hideInput,
  isSortAvailable,
  loadMoreButtonLabel = '',
  heading,
  showAllProductsLabel,
  searchClient,
  algoliaIndexName,
  hideProductSuggestions,
  overlayFilters = false,
  asidePanel,
  toolbar,
  listingTitle,
  listingBackLink,
  asideOpen = false,
  sortComparator,
  sortNeedsPricing,
  priceFilter,
  rowFilter,
  bulkFetchHitsPerPage,
  prefetchAheadPx,
}: SearchResultsProps) => {
  const { results } = useHits();
  const { hits } = useInfiniteHits();
  const { query } = useSearchBox();
  const { items: currentRefinements } = useCurrentRefinements();
  const { setCurrentTerm } = useSearch();
  const { status, uiState } = useInstantSearch();
  const searchResultsContainerRef = useRef<HTMLDivElement>(null);
  const { t } = useI18n();

  const { track } = useAnalyticsTracking();

  // A blank back-link field must render nothing at all — not the chevron, not the anchor, and not
  // the `mb-2` that would sit between it and the `<h1>`. `href` alone counts because the link text
  // ("description") is optional in Sitecore and `Link` falls back to the href for it.
  const hasBackLink = Boolean(listingBackLink?.value?.href || listingBackLink?.value?.text);

  // B2B PLP, mobile only: the cart is a fixed drawer sliding in over the page, so the page behind
  // it must not scroll. `max-sm` here is the same 768px cut-off as Tailwind's `sm:` (see
  // tailwind.config.js `screens`), so the lock engages exactly when the drawer styling does. The
  // drawer itself scrolls internally, so a tall cart is still fully reachable.
  const breakpoint = useBreakpoint();
  useDisableScroll({
    disable: Boolean(overlayFilters) && asideOpen && breakpoint === 'max-sm',
  });

  const isLoading = useMemo(() => ['loading', 'stalled'].includes(status), [status]);

  const isSearchPage = useMemo(
    () => typeof window !== 'undefined' && window.location.pathname.toLowerCase() === '/search',
    []
  );

  useEffect(() => {
    setCurrentTerm(query);
  }, [query, setCurrentTerm]);

  const ProductsRecommendationContent = useMemo(
    () => (
      <InstantSearch searchClient={searchClient} indexName={algoliaIndexName}>
        <Configure
          {...({ filters: buildProductResultsFilter(uiState) } as unknown as UseConfigureProps)}
        />
        <SearchProductResults query={query} showAllProductsLabel={showAllProductsLabel} />
      </InstantSearch>
    ),
    [algoliaIndexName, query, searchClient, showAllProductsLabel, uiState]
  );

  const searchFacets = useMemo(() => {
    if (currentRefinements.length) {
      const facets = currentRefinements.map((item) => item.attribute);

      return facets.join('%');
    }

    return undefined;
  }, [currentRefinements]);

  const searchResultsCount = useMemo(() => results?.nbHits, [results]);

  // B2B PLP: how many hits survive the client-side price-bucket filter, reported up from
  // SearchInfiniteHits (which owns the filtered list). `null` = nothing meaningful yet (no price
  // filter, or the set is still being priced), in which case the Algolia total stands.
  const [priceFilteredCount, setPriceFilteredCount] = useState<number | null>(null);

  // B2B PLP: how many rows the past-session row filter hides across the whole result set, counted
  // off the `startDate` facet rather than off the loaded pages (which would read far low while
  // paging). `null` = not knowable right now, in which case Algolia's own total stands.
  const pastSessionCount = useB2BPastSessionCount({
    enabled: overlayFilters,
    searchClient,
    indexName: algoliaIndexName,
  });

  // B2B PLP purchase options. The class row a session produces is only the plain "Training" option;
  // its upgrades ("Training & Exam", "…with Peace of Mind Protection") are separate `product-bundle`
  // records joined to it by `skuReferencesProduct`, exactly as the PDP joins them. They are fetched
  // once as a lookup table, then expanded into extra rows here rather than at index time.
  //
  // Both of these live in SearchResults rather than in SearchWrapper because they read the current
  // Algolia response through `useInstantSearch`, which only resolves inside the `<InstantSearch>`
  // tree that SearchWrapper renders — the same reason `useB2BPastSessionCount` is called here.
  const purchaseOptionBundles = useB2BPurchaseOptionBundles({
    enabled: overlayFilters,
    searchClient,
    indexName: algoliaIndexName,
  });

  // How the listing's rows differ from `nbHits` across the WHOLE refined set (not just the pages
  // loaded so far): options added, region-less sessions hidden, bare bundle rows suppressed.
  const rowModel = useB2BListingRowModel({
    enabled: overlayFilters,
    searchClient,
    indexName: algoliaIndexName,
    bundles: purchaseOptionBundles,
  });

  // Undefined until the bundle map lands, which keeps the list one row per hit (today's behaviour)
  // rather than briefly rendering options with no title or price.
  const rowExpand = useMemo(() => {
    if (!overlayFilters || !purchaseOptionBundles) {
      return undefined;
    }
    return (rows: Hit<SearchResultHit>[]) => expandPurchaseOptionRows(rows, purchaseOptionBundles);
  }, [overlayFilters, purchaseOptionBundles]);

  // A bundle whose options are already on screen as generated rows must not ALSO appear as its own
  // bare, dateless row. Composed here rather than in SearchWrapper's `b2bRowFilter` because the
  // suppression set is only known once the row-model query lands, and it is deliberately layered on
  // top of that filter instead of replacing it. Generated rows are exempt: they carry a suppressed
  // bundle's SKU legitimately — they ARE what replaces the bare row.
  const suppressedBundleSkus = rowModel?.suppressedBundleSkus;

  const effectiveRowFilter = useMemo(() => {
    if (!overlayFilters || !suppressedBundleSkus?.size) {
      return rowFilter;
    }

    return (hit: Hit<SearchResultHit>) => {
      if (rowFilter && !rowFilter(hit)) {
        return false;
      }
      if (isGeneratedOptionRow(hit as { b2bRecordType?: string })) {
        return true;
      }
      const asRecord = hit as Hit<SearchResultHit> & { productType?: string };
      return (
        asRecord.productType !== 'product-bundle' ||
        !suppressedBundleSkus.has((hit.sku ?? hit.objectID) as string)
      );
    };
  }, [overlayFilters, rowFilter, suppressedBundleSkus]);

  // Displayed total. Algolia's `nbHits` counts records server-side, and the B2B listing's rows are
  // no longer one-to-one with records: three client-side rules move the figure, and none of them can
  // be expressed as a facet. Two different corrections, in priority order:
  //
  //  1. Price filter: price isn't in the index (resolved per-SKU from commercetools — see
  //     priceBuckets.ts), so the only true figure is the count of rows that survived, reported up
  //     from SearchInfiniteHits. That count is taken AFTER the expansion and after every row filter,
  //     so it needs no further adjustment and must NOT have one — correcting again would
  //     double-count.
  //  2. Otherwise, start from `nbHits` and apply each rule:
  //       − past-dated sessions the row filter hides (counted off the `startDate` facet),
  //       − invalid instructor-led sessions (no region, or no real scheduled date), also hidden
  //         (counted among not-yet-started ones only, so it never overlaps the term above),
  //       + one generated row per resolvable purchase-option reference,
  //       − bare bundle rows suppressed because a generated row now represents them.
  //     The last three are `null` together whenever the row model can't be trusted (no bundle map,
  //     or a result set too large for one query), in which case the total falls back to the
  //     past-session correction alone — visibly low rather than confidently wrong.
  //
  // Clamped at 0: the facet and `nbHits` come from the same response so they agree, but a clamp
  // keeps a negative total off the screen if that ever stops being true.
  //
  // Every other page (and every non-price refinement, which DOES refine server-side) is unaffected
  // and keeps using `nbHits`.
  const displayedResultsCount = useMemo(() => {
    if (priceFilter && priceFilteredCount !== null) {
      return priceFilteredCount;
    }
    if (searchResultsCount === undefined || pastSessionCount === null) {
      return searchResultsCount;
    }

    const rowDelta = rowModel
      ? rowModel.addedOptionRows - rowModel.hiddenInvalidOilSessions - rowModel.hiddenBundleRows
      : 0;

    return Math.max(searchResultsCount - pastSessionCount + rowDelta, 0);
  }, [priceFilter, priceFilteredCount, searchResultsCount, pastSessionCount, rowModel]);

  // A price bucket can match nothing even though Algolia returned plenty of hits, which would
  // otherwise render "0 Results Found" above an empty list instead of the no-results message.
  // `priceFilteredCount` is deliberately `null` (not `0`) while the set is still being priced, so
  // this only turns true once the filtered list has actually settled at empty.
  const hasNoPriceFilteredResults = useMemo(
    () => Boolean(priceFilter) && priceFilteredCount === 0,
    [priceFilter, priceFilteredCount]
  );

  const trackSearchResults = useCallback(() => {
    if (searchResultsCount) {
      const searchTracking = {
        event: ANALYTICS_EVENTS.VT_INTERRUPTION,
        interruption_type: 'search',
        search_query: query,
        search_results_count: searchResultsCount,
      };

      if (searchFacets) {
        return track({ ...searchTracking, search_facets: searchFacets });
      }

      track(searchTracking);
    }
  }, [track, query, searchResultsCount, searchFacets]);

  useEffect(() => {
    trackSearchResults();
  }, [trackSearchResults]);

  const resultsBody = (
    <div ref={searchResultsContainerRef} className="space-y-10 relative">
      {Boolean(hits.length) && query && (
        <h1 className="headline-m lg:headline-l mt-10 sm:mt-0">
          {heading?.value?.toString().replace('{0}', query)}
        </h1>
      )}
      {(query || !isSearchPage) && (
        <SearchInfiniteHits
          renderHit={renderHit}
          loadMoreButtonLabel={loadMoreButtonLabel}
          ProductsRecommendations={ProductsRecommendationContent}
          hideProductSuggestions={hideProductSuggestions}
          sortComparator={sortComparator}
          listClassName={overlayFilters ? 'flex flex-col gap-3' : undefined}
          listId={overlayFilters ? B2B_PLP_HITS_LIST_ID : undefined}
          sortNeedsPricing={overlayFilters ? sortNeedsPricing : undefined}
          priceFilter={overlayFilters ? priceFilter : undefined}
          rowFilter={overlayFilters ? effectiveRowFilter : undefined}
          rowExpand={rowExpand}
          bulkFetchHitsPerPage={overlayFilters ? bulkFetchHitsPerPage : undefined}
          prefetchAheadPx={overlayFilters ? prefetchAheadPx : undefined}
          // Lets the header total reflect the client-side price filter (see displayedResultsCount).
          // `setPriceFilteredCount` is a stable setter, so this can't loop.
          onFilteredCountChange={overlayFilters ? setPriceFilteredCount : undefined}
          disableHitsSessionCache={overlayFilters}
          // Private classes are deferred to a later phase (bug sweep 2026-08-19) — the demo
          // private-class leading row is commented out rather than deleted so it can be restored
          // by uncommenting when the feature ships.
          // leadingItem={overlayFilters ? <B2BDemoPrivateClassRow /> : undefined}
        />
      )}
    </div>
  );

  // B2B PLP layout: a top toolbar (Filter + Sort, right-aligned), then a row with the list and
  // a cart aside whose width animates open/closed — the list grows/shrinks in sync (same 300ms).
  if (overlayFilters) {
    return (
      <section className="flex flex-col px-5 sm:px-8 lg:px-16 sm:pb-20">
        {/* The toolbar row lives INSIDE the results column, not above the whole row, so that when
            the cart opens the cart panel rises to sit level with it and the Filter/Sort controls
            move left alongside the narrowing list — rather than the cart starting below a
            full-width toolbar. It stays outside NoResultsBoundary so a filter combination with no
            results still leaves the Filter button (and Clear) reachable. */}
        <div className="flex flex-col sm:flex-row sm:items-start">
          <div className="min-w-0 sm:flex-1">
            {/* Header band: the page `<h1>` on the left, and — right-aligned — the results total
                followed by Filter and Sort, with the count immediately left of the Filter button.
                Title and controls share one row (per the reference) so the cart panel, which
                starts at the top of this same flex row, comes up level with them instead of
                sitting below a separate full-width title. `ml-auto` keeps the controls hard right
                even when there is no title. The count is the same Sitecore `resultsFoundLabel`
                ("{0} Results Found") the sidebar shows on the other search pages; the B2B PLP has
                no sidebar, so it lives here.

                On mobile the same three pieces stack instead of wrapping: title, then Filter, then
                Sort, then the results count under them. Free-flowing `flex-wrap` used to break the
                controls apart mid-row (count + Filter on one line, Sort orphaned on the next), so
                the axis is switched explicitly rather than left to wrapping. `flex-col-reverse` on
                the mobile group puts the toolbar visually above the count while keeping the DOM
                order count-then-toolbar, which is what the desktop `sm:flex-row` needs to place the
                count immediately left of the Filter button.

                That mobile stack is centred — title, then Filter centred under it, then Sort
                centred under that (`flex-col` on the toolbar row below `sm`, each control full
                width so its own text centres independently rather than the pair centring as one
                inline group). The centring is done with `text-center`/`justify-center`, deliberately
                NOT by shrinking boxes with `items-center` on the toolbar row itself — the Filter/Sort
                popups measure themselves against the toolbar wrapper below, so it has to keep
                spanning the full content width or the popups would narrow with it. */}
            {hasBackLink && listingBackLink && (
              // Back-link above the title, and deliberately OUTSIDE the header band below: while it
              // was a sibling of the `<h1>` inside a column, `sm:items-center` centred the
              // Filter/Sort controls against the *column* (back-link + title), which left them
              // sitting ~17px above the heading's own centre. Kept as its own block so the controls
              // centre on the `<h1>` alone. `mb-2` replaces the old column `gap-2`, so a blank
              // back-link still leaves the title exactly where it was.
              //
              // The chevron comes from `with-chevron-left` (a `::before` on the anchor, the same
              // site-wide utility the My Account back-links use), NOT from the link's text —
              // authors type just "Product Categories" and the arrow is drawn for them. `w-fit`
              // keeps the hit area to the words rather than the whole row.
              <Link
                field={listingBackLink}
                className="cta with-chevron-left mb-2 w-fit text-dark-green max-sm:mx-auto"
              />
            )}
            <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              {listingTitle && (
                // The shared `headline-*` classes are all `font-light`; the reference headline is
                // noticeably heavier and smaller than the page headlines elsewhere on the site, so
                // the weight is overridden here (utilities beat the component layer, so no `!`).
                <h1 className="headline-s font-semibold max-sm:text-center">{listingTitle}</h1>
              )}
              <div className="flex flex-col-reverse items-start gap-2 max-sm:items-stretch sm:ml-auto sm:flex-row sm:items-center sm:gap-3">
                <p className="body-s text-gray-70 max-sm:text-center sm:mr-1">
                  {resultsFoundLabel?.value?.replace('{0}', String(displayedResultsCount ?? 0))}
                </p>
                {/* `relative` + full width on mobile: the Filter/Sort popups position themselves
                    against this box (they go `static` at that width) so they span the page instead
                    of hanging off its left edge from a narrow button. The buttons are centred
                    inside it while the box itself stays full-width, so the popups still pin to the
                    page's own edges. */}
                <div className="relative flex w-full flex-col items-center gap-3 max-sm:justify-center sm:w-auto sm:flex-row">
                  {toolbar}
                </div>
              </div>
            </div>
            <NoResultsBoundary
              fallback={<SearchNoResults heading={noResultsFoundText} query={query} />}
              noFilteredResults={hasNoPriceFilteredResults}
            >
              {resultsBody}
            </NoResultsBoundary>
          </div>
          {/* Two different components sharing one element. From `sm` up it is an in-flow column
              that animates its own width open next to the list. Below `sm` it leaves the flow
              entirely and becomes a fixed drawer pinned to the right edge, sliding in over the page
              and staying put while the page behind it is scroll-locked (see `useDisableScroll`
              above). The drawer itself does not scroll — the panel inside it keeps its header and
              footer fixed and scrolls only its item list, so a cart taller than the viewport is
              still fully reachable. When closed it is translated fully off-screen and made
              `pointer-events-none` so it cannot swallow taps over the results. */}
          <aside
            id={B2B_PLP_CART_ASIDE_ID}
            className={clsx(
              'flex shrink-0 justify-end transition-transform duration-300 ease-out',
              'max-sm:fixed max-sm:inset-y-0 max-sm:right-0 max-sm:z-mini-cart max-sm:w-full max-sm:overflow-hidden max-sm:bg-white-00 max-sm:shadow-2xl',
              'sm:sticky sm:top-24 sm:self-start sm:overflow-hidden sm:transition-[width,margin]',
              asideOpen
                ? 'max-sm:translate-x-0 sm:mt-0 sm:ml-5 sm:w-[290px]'
                : 'max-sm:pointer-events-none max-sm:translate-x-full sm:w-0'
            )}
          >
            {asidePanel}
          </aside>
        </div>
      </section>
    );
  }

  return (
    <section
      className={clsx(
        'flex flex-col sm:flex-row sm:justify-between sm:px-8 lg:px-16 sm:items-start',
        hideInput ? 'sm:pb-20' : 'sm:py-20'
      )}
    >
      {filterKeyValues?.length > 0 && !overlayFilters && (
        <SearchFilters
          className={clsx(
            'w-full sm:w-3/12 lg:w-4/12 overflow-y-auto',
            !Boolean(hits.length) && !isLoading && '!hidden'
          )}
          filterKeyValues={filterKeyValues}
          clearFiltersLabel={clearFiltersLabel}
          resultsFoundLabel={resultsFoundLabel}
          sortByLabel={sortByLabel}
          sortOptions={sortOptions}
          isSortAvailable={isSortAvailable}
          showMoreLabel={t('showMore') ? t('showMore') : 'Show More'}
        />
      )}

      <NoResultsBoundary fallback={<SearchNoResults heading={noResultsFoundText} query={query} />}>
        <div
          className={clsx(
            'flex flex-col grow mx-5 sm:mx-0',
            getResultsWidthClassName(Boolean(asidePanel), overlayFilters)
          )}
        >
          <div ref={searchResultsContainerRef} className="space-y-10 relative">
            {Boolean(hits.length) && query && (
              <h1 className="headline-m lg:headline-l mt-10 sm:mt-0">
                {heading?.value?.toString().replace('{0}', query)}
              </h1>
            )}
            {(query || !isSearchPage) && (
              <SearchInfiniteHits
                renderHit={renderHit}
                loadMoreButtonLabel={loadMoreButtonLabel}
                ProductsRecommendations={ProductsRecommendationContent}
                hideProductSuggestions={hideProductSuggestions}
              />
            )}
          </div>
        </div>
      </NoResultsBoundary>

      {asidePanel && (
        <aside className="w-full mt-8 sm:mt-0 sm:w-4/12 lg:w-4/12 sm:pl-6 lg:pl-8 sm:sticky sm:top-24 sm:self-start">
          {asidePanel}
        </aside>
      )}
    </section>
  );
};

export default SearchResults;
