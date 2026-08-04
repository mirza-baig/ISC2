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
import { Field, TextField } from '@sitecore-jss/sitecore-jss-nextjs';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import clsx from 'clsx';
import type { Hit } from 'instantsearch.js';
import { SearchClient } from 'algoliasearch/lite';

import { FacetKeyValues, SearchResultHit, SortOptions } from 'types/index';
import { useAnalyticsTracking } from 'hooks/index';
import { useSearch } from 'providers/index';
import { useI18n } from 'next-localization';
import { buildProductResultsFilter } from 'utils/search';

import SearchFilters from './SearchFilters';
import NoResultsBoundary from './NoResultsBoundary';
import SearchInfiniteHits from './SearchHits/SearchInfiniteHits';
import SearchNoResults from './SearchNoResults';
import SearchProductResults from './SearchProductResults';
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
}

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

  return (
    <section
      className={clsx(
        'flex flex-col sm:flex-row sm:justify-between sm:px-8 lg:px-16 sm:items-start',
        hideInput ? 'sm:pb-20' : 'sm:py-20'
      )}
    >
      {filterKeyValues?.length > 0 && (
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
        <div className="flex flex-col grow mx-5 sm:mx-0 sm:w-8/12 lg:w-7/12">
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
    </section>
  );
};

export default SearchResults;
