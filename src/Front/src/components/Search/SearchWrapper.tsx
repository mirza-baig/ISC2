import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getCookie } from 'cookies-next';
import { InstantSearch } from 'react-instantsearch-hooks-web';
import {
  ComponentRendering,
  Field,
  GetStaticComponentProps,
  RouteData,
  useComponentProps,
} from '@sitecore-jss/sitecore-jss-nextjs';
import { ComponentProps } from 'lib/component-props';
import algoliasearch, { SearchClient as AlgoliaSearchClient } from 'algoliasearch';
import { KeyValuePair } from 'tailwindcss/types/config';
import type { Hit } from 'instantsearch.js';
import Link from 'next/link';
import { getGraphQLResult } from 'utils/graphQLFunctions';

import {
  FacetKeyValues,
  SearchResultHit,
  SortOptions,
  SearchDefaultFilter,
  SearchModalAlgoliaSettings,
} from 'types/index';
import { useSearch, useLayout, AutocompleteProvider } from 'providers/index';
import { ScrollToTop } from 'ui/index';
import { useI18n } from 'next-localization';
import RssFeedIcon from 'icons/RssFeedIcon';

import SearchBox from './SearchBox';
import SearchResults from './SearchResults';
import SearchHit from './SearchHits/SearchHit';
import TrainingFinderHit from './SearchHits/TrainingFinderHit';
import VolunteerSearchHit from './SearchHits/VolunteerSearchHit';
import SearchFiltersMenu from './SearchFiltersMenu';
import NonEditable from 'ui/NonEditable';
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
  };
};

const HIDE_SEARCH_BOX_PAGES = ['Hub Page', 'Training Finder', 'Volunteer Page'];

const SearchWrapper = ({ fields, rendering, layoutFields }: SearchWrapperProps) => {
  const { algoliaIndexName, setDefaultFilters, setAlgoliaIndexName } = useSearch();
  const { isEditing } = useLayout();
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
    if (!isParams && fields?.algoliaIndexName?.value) {
      setAlgoliaIndexName(fields?.algoliaIndexName?.value);
    }
  }, [fields?.algoliaIndexName?.value, isParams, setAlgoliaIndexName]);

  // Preference to url pramas for indexName
  useEffect(() => {
    if (window.location.search !== '') {
      setIsParams(true);
      let queryString = window.location.search;
      queryString = queryString.split('%')[0];
      const getIndexName = queryString.replace('?', '');
      setAlgoliaIndexName(getIndexName);
    }
  }, [setAlgoliaIndexName]);

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
      if (fields.searchResultPageType.value === 'Training Finder') {
        return (
          <TrainingFinderHit
            hit={hit}
            labels={{
              trainingProviderLabel: fields?.trainingProviderLabel.value,
              trainingMethodLabel: fields?.trainingMethodLabel.value,
              startDateLabel: fields?.startDateLabel.value,
              endDateLabel: fields?.endDateLabel.value,
              locationLabel: fields?.locationLabel.value,
              buttonLabel: fields?.buttonLabel.value,
              tooltipValue: fields?.tooltipValue?.value,
            }}
          />
        );
      }

      if (fields.searchResultPageType.value === 'Volunteer Page') {
        return (
          <VolunteerSearchHit
            hit={hit}
            labels={{
              trainingProviderLabel: fields?.trainingProviderLabel.value,
              trainingMethodLabel: fields?.trainingMethodLabel.value,
              startDateLabel: fields?.startDateLabel.value,
              endDateLabel: fields?.endDateLabel.value,
              locationLabel: fields?.locationLabel.value,
              buttonLabel: fields?.buttonLabel.value,
              tooltipValue: fields?.tooltipValue?.value,
            }}
          />
        );
      }

      return <SearchHit hit={hit} index={index} isFeatured={isFeatured} />;
    },
    [
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

  const defaultFilters = useMemo(() => {
    if (fields.defaultfiterKeyValues?.length) {
      const filters = fields.defaultfiterKeyValues.map((filter) => {
        const values = filter.FilterValue.split(',');
        const mappedValues = values.map((value) => `${filter.FilterKey}:${value}`);

        return `(${mappedValues.join(' OR ')})`;
      });

      if (filters[0] !== '(:)') {
        return filters.join(' AND ');
      }
    }

    return '';
  }, [fields.defaultfiterKeyValues]);

  const hideInputBox = useMemo(
    () => HIDE_SEARCH_BOX_PAGES.includes(fields.searchResultPageType?.value),
    [fields.searchResultPageType?.value]
  );

  if (!searchClient || !fields || !algoliaIndexName) {
    return null;
  }

  if (isEditing) {
    return (
      <div className="py-5 pt-40">
        <NonEditable />
      </div>
    );
  }

  return (
    <InstantSearch searchClient={searchClient} indexName={algoliaIndexName} routing>
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
      <main data-insights-index={algoliaIndexName}>
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
            />
            <SearchResults
              noResultsFoundText={fields.noResultsFoundText}
              clearFiltersLabel={fields.clearFiltersLabel}
              filterKeyValues={fields.facetKeyValues}
              resultsFoundLabel={fields.resultsFoundLabel}
              hideInput={hideInputBox}
              hideProductSuggestions={hideProductSuggestions}
              loadMoreButtonLabel={
                Boolean(fields.showLoadMore?.value) ? fields.loadMoreLabel?.value : ''
              }
              sortByLabel={fields?.sortByLabel?.value}
              sortOptions={fields?.sortOptions}
              isSortAvailable={fields?.isSortAvailable?.value}
              renderHit={renderSearchHit}
              heading={fields.resultsPageHeading}
              showAllProductsLabel={fields.showAllProductsLabel}
              searchClient={searchClient}
              algoliaIndexName={algoliaIndexName}
            />
            <SearchFiltersMenu
              filterLabel={fields.filterLabel}
              clearFiltersLabel={fields.clearFiltersLabel}
              seeResultsLabel={fields.seeResultsLabel}
              filterKeyValues={fields.facetKeyValues}
              sortByLabel={fields?.sortByLabel?.value}
              sortOptions={fields?.sortOptions}
              isSortAvailable={fields?.isSortAvailable?.value}
              showMoreLabel={t('showMore')}
            />
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
