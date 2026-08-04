import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Configure, InstantSearch, type UseConfigureProps } from 'react-instantsearch-hooks-web';
import algoliasearch from 'algoliasearch';
import type { Hit } from 'instantsearch.js';
import { ComponentRendering, Field, RouteData } from '@sitecore-jss/sitecore-jss-nextjs';
import { ComponentProps } from 'lib/component-props';

import { SearchResultHit } from 'types/index';
import { FetchedSearchWrapperWithQueryStringFields } from 'types/algoliaSearch';
import { useSearch, useLayout } from 'providers/index';
import { LoadingIndicator, ScrollToTop } from 'ui/index';

import SearchHit from './SearchHits/SearchHit';
import TrainingFinderHit from './SearchHits/TrainingFinderHit';
import VolunteerSearchHit from './SearchHits/VolunteerSearchHit';
import SearchInfiniteHits from './SearchHits/SearchInfiniteHits';
import SearchFacet from './SearchFacets/SearchFacet';
import NonEditable from 'ui/NonEditable';

import { fetchSearchWrapperSettings } from 'providers/algoliaSettings';

type SearchWrapperWithQueryStringProps = ComponentProps & {
  rendering: ComponentRendering | RouteData;
  fields: {
    QueryString: Field<string>;
  };
};

function parseAlgoliaSearchState(searchString: string) {
  try {
    let queryPart = searchString;
    if (searchString.includes('?')) {
      queryPart = searchString.split('?')[1];
    }

    const decodedSearchString = decodeURIComponent(queryPart);
    const params = new URLSearchParams(decodedSearchString);
    let indexName = '';
    const refinements: Record<string, string[]> = {};
    let query = '';

    const firstParam = Array.from(params.keys())[0];
    if (firstParam) {
      indexName = firstParam.split('[')[0];
    }

    for (const [key, value] of params.entries()) {
      const refinementMatch = key.match(/^(.+?)\[refinementList\]\[(.+?)\]\[(\d+)\]$/);
      if (refinementMatch) {
        const [, , attribute] = refinementMatch;

        if (!refinements[attribute]) {
          refinements[attribute] = [];
        }
        refinements[attribute].push(value);
      }

      const queryMatch = key.match(/^(.+?)\[query\]$/);
      if (queryMatch && value) {
        query = value;
      }
    }

    return { indexName, refinements, query };
  } catch (error) {
    return { indexName: '', refinements: {}, query: '' };
  }
}

const SearchWrapperWithQueryString = ({ fields }: SearchWrapperWithQueryStringProps) => {
  const { setAlgoliaIndexName } = useSearch();
  const { isEditing } = useLayout();

  const [settings, setSettings] = useState<FetchedSearchWrapperWithQueryStringFields | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [algoliaState, setAlgoliaState] = useState<{
    indexName: string;
    refinements: Record<string, string[]>;
    query: string;
  }>({ indexName: '', refinements: {}, query: '' });

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    fetchSearchWrapperSettings()
      .then((fetchedSettings) => {
        setSettings(fetchedSettings);
        setIsLoading(false);
      })
      .catch(() => {
        setError('Failed to load search settings');
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    if (fields?.QueryString?.value) {
      const parsedState = parseAlgoliaSearchState(fields.QueryString.value);
      setAlgoliaState(parsedState);

      if (parsedState.indexName) {
        setAlgoliaIndexName(parsedState.indexName);
      } else if (settings?.algoliaIndexName) {
        setAlgoliaIndexName(settings.algoliaIndexName);
      }
    } else if (settings?.algoliaIndexName) {
      setAlgoliaIndexName(settings.algoliaIndexName);
    }
  }, [fields, settings, setAlgoliaIndexName]);

  const searchClient = useMemo(() => {
    if (!settings?.algoliaApiKey || !settings?.algoliaAppId) {
      return null;
    }

    return algoliasearch(settings.algoliaAppId, settings.algoliaApiKey);
  }, [settings?.algoliaApiKey, settings?.algoliaAppId]);

  const renderSearchHit = useCallback(
    (hit: Hit<SearchResultHit>, index: number, isFeatured: boolean) => {
      if (settings?.searchResultPageType === 'Training Finder') {
        return (
          <TrainingFinderHit
            hit={hit}
            labels={{
              trainingProviderLabel: settings.trainingProviderLabel || '',
              trainingMethodLabel: settings.trainingMethodLabel || '',
              startDateLabel: settings.startDateLabel || '',
              endDateLabel: settings.endDateLabel || '',
              locationLabel: settings.locationLabel || '',
              buttonLabel: settings.buttonLabel || '',
              tooltipValue: settings.tooltipValue || '',
            }}
          />
        );
      }

      if (settings?.searchResultPageType === 'Volunteer Page') {
        return (
          <VolunteerSearchHit
            hit={hit}
            labels={{
              trainingProviderLabel: settings.trainingProviderLabel || '',
              trainingMethodLabel: settings.trainingMethodLabel || '',
              startDateLabel: settings.startDateLabel || '',
              endDateLabel: settings.endDateLabel || '',
              locationLabel: settings.locationLabel || '',
              buttonLabel: settings.buttonLabel || '',
              tooltipValue: settings.tooltipValue || '',
            }}
          />
        );
      }

      return <SearchHit hit={hit} index={index} isFeatured={isFeatured} />;
    },
    [settings]
  );

  const filters = useMemo(() => {
    const filterParts: string[] = [];

    Object.entries(algoliaState.refinements).forEach(([attribute, values]) => {
      if (values.length > 0) {
        const attributeFilters = values.map((value) => `${attribute}:${value}`);
        filterParts.push(`(${attributeFilters.join(' OR ')})`);
      }
    });

    if (settings?.defaultFilterKeyValues?.length) {
      const defaultFilters = settings.defaultFilterKeyValues.map((filter) => {
        const values = filter.FilterValue.split(',');
        const mappedValues = values.map((value) => `${filter.FilterKey}:${value}`);
        return `(${mappedValues.join(' OR ')})`;
      });

      if (defaultFilters[0] !== '(:)') {
        filterParts.push(...defaultFilters);
      }
    }

    return filterParts.join(' AND ');
  }, [algoliaState.refinements, settings?.defaultFilterKeyValues]);

  const indexName = useMemo(() => {
    return algoliaState.indexName || settings?.algoliaIndexName || '';
  }, [algoliaState.indexName, settings]);

  const initialSearchState = useMemo(() => {
    const state: Record<string, unknown> = {};

    if (algoliaState.query) {
      state.query = algoliaState.query;
    }

    if (Object.keys(algoliaState.refinements).length > 0) {
      state.refinementList = algoliaState.refinements;
    }

    if (filters) {
      state.configure = {
        filters: filters,
      };
    }

    return state;
  }, [algoliaState.query, algoliaState.refinements, filters]);

  if (isLoading) {
    return <LoadingIndicator />;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!searchClient || !settings || !indexName) {
    return <div>Missing search configuration. Check console for details.</div>;
  }

  if (isEditing) {
    return (
      <div className="py-5 pt-40">
        <NonEditable />
      </div>
    );
  }

  return (
    <InstantSearch
      searchClient={searchClient}
      indexName={indexName}
      initialUiState={{
        [indexName]: initialSearchState,
      }}
    >
      <main data-insights-index={indexName}>
        <Configure
          {...({
            filters,
            hitsPerPage: 20,
            clickAnalytics: true,
            getRankingInfo: true,
          } as unknown as UseConfigureProps)}
        />

        <div style={{ display: 'none' }}>
          {settings?.facetKeyValues?.map((filter) => (
            <SearchFacet
              key={filter.key}
              type="Checkbox"
              attribute={filter.key}
              label={filter.value}
              openByDefault={false}
              showMoreLabel=""
            />
          ))}
        </div>

        <div className="flex flex-col mx-5 sm:mx-8 lg:mx-16 py-10">
          <SearchInfiniteHits
            renderHit={renderSearchHit}
            loadMoreButtonLabel={settings?.showLoadMore ? settings.loadMoreLabel || '' : ''}
            hideProductSuggestions={true}
          />
        </div>
        <ScrollToTop />
      </main>
    </InstantSearch>
  );
};

export default SearchWrapperWithQueryString;
