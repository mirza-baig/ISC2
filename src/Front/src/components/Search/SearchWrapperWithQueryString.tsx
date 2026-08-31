import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Configure, InstantSearch, type UseConfigureProps } from 'react-instantsearch-hooks-web';
import algoliasearch from 'algoliasearch';
import type { Hit } from 'instantsearch.js';
import { ComponentRendering, Field, RouteData } from '@sitecore-jss/sitecore-jss-nextjs';
import { ComponentProps } from 'lib/component-props';

import { SearchResultHit } from 'types/index';
import { FetchedSearchWrapperWithQueryStringFields } from 'types/algoliaSearch';
import { useLayout } from 'providers/index';
import { LoadingIndicator } from 'ui/index';

import SearchHit from './SearchHits/SearchHit';
import TrainingFinderHit from './SearchHits/TrainingFinderHit';
import VolunteerSearchHit from './SearchHits/VolunteerSearchHit';
import SearchInfiniteHits from './SearchHits/SearchInfiniteHits';
import SearchNonEditableNotice from './SearchNonEditableNotice';
import NoResultsBoundary from './NoResultsBoundary';
import { buildDefaultFilterGroups } from './searchFilterGroups';
import { parseAlgoliaSearchState, type AlgoliaSearchState } from './parseAlgoliaSearchState';

import { fetchSearchWrapperSettings } from 'providers/algoliaSettings';

type SitecoreItemRef =
  | Field<string>
  | { id?: string; value?: string | { id?: string } }
  | string
  | undefined;

type SearchWrapperWithQueryStringProps = ComponentProps & {
  rendering: ComponentRendering | RouteData;
  fields: {
    QueryString: Field<string>;
    AlgoliaSettings?: SitecoreItemRef;
  };
};

const resolveSettingsRef = (field: SitecoreItemRef): string | undefined => {
  if (!field) return undefined;
  if (typeof field === 'string') return field.trim() || undefined;

  const asObject = field as { id?: string; value?: string | { id?: string } };

  if (typeof asObject.value === 'string') {
    return asObject.value.trim() || undefined;
  }
  if (asObject.value && typeof asObject.value === 'object') {
    return asObject.value.id?.trim() || undefined;
  }

  return asObject.id?.trim() || undefined;
};

const buildSearchParameters = (
  algoliaState: AlgoliaSearchState,
  settings: FetchedSearchWrapperWithQueryStringFields | null
) => {
  const facetFilters: string[][] = Object.entries(algoliaState.refinements)
    .filter(([, values]) => values.length > 0)
    .map(([attribute, values]) => values.map((value) => `${attribute}:${value}`));

  Object.entries(algoliaState.menus).forEach(([attribute, value]) => {
    facetFilters.push([`${attribute}:${value}`]);
  });

  algoliaState.toggles.forEach((attribute) => {
    facetFilters.push([`${attribute}:true`]);
  });

  const numericFilters: string[] = [];
  Object.entries(algoliaState.ranges).forEach(([attribute, range]) => {
    if (range.min !== undefined) numericFilters.push(`${attribute}>=${range.min}`);
    if (range.max !== undefined) numericFilters.push(`${attribute}<=${range.max}`);
  });

  const filters = buildDefaultFilterGroups(settings?.defaultFilterKeyValues).join(' AND ');

  return { facetFilters, numericFilters, filters };
};

const SearchWrapperWithQueryString = ({ fields }: SearchWrapperWithQueryStringProps) => {
  const { isEditing } = useLayout();

  const [settings, setSettings] = useState<FetchedSearchWrapperWithQueryStringFields | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const settingsRef = useMemo(() => resolveSettingsRef(fields?.AlgoliaSettings), [fields]);

  const algoliaState = useMemo(
    () => parseAlgoliaSearchState(fields?.QueryString?.value),
    [fields?.QueryString?.value]
  );

  useEffect(() => {
    let cancelled = false;

    if (!settingsRef) {
      setSettings(null);
      setHasError(true);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setHasError(false);

    fetchSearchWrapperSettings(settingsRef)
      .then((fetchedSettings) => {
        if (cancelled) return;
        setSettings(fetchedSettings);
        setIsLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setHasError(true);
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [settingsRef]);

  const searchClient = useMemo(() => {
    if (!settings?.algoliaApiKey || !settings?.algoliaAppId) {
      return null;
    }

    return algoliasearch(settings.algoliaAppId, settings.algoliaApiKey);
  }, [settings?.algoliaApiKey, settings?.algoliaAppId]);

  const renderSearchHit = useCallback(
    (hit: Hit<SearchResultHit>, index: number, isFeatured: boolean) => {
      const labels = {
        trainingProviderLabel: settings?.trainingProviderLabel || '',
        trainingMethodLabel: settings?.trainingMethodLabel || '',
        startDateLabel: settings?.startDateLabel || '',
        endDateLabel: settings?.endDateLabel || '',
        locationLabel: settings?.locationLabel || '',
        buttonLabel: settings?.buttonLabel || '',
        tooltipValue: settings?.tooltipValue || '',
      };

      if (settings?.searchResultPageType === 'Training Finder') {
        return <TrainingFinderHit hit={hit} labels={labels} />;
      }

      if (settings?.searchResultPageType === 'Volunteer Page') {
        return <VolunteerSearchHit hit={hit} labels={labels} />;
      }

      return <SearchHit hit={hit} index={index} isFeatured={isFeatured} />;
    },
    [settings]
  );

  const { facetFilters, numericFilters, filters } = useMemo(
    () => buildSearchParameters(algoliaState, settings),
    [algoliaState, settings]
  );

  const indexName =
    algoliaState.sortByIndexName || algoliaState.indexName || settings?.algoliaIndexName || '';

  if (isEditing) {
    return (
      <div>
        <SearchNonEditableNotice />
        <dl className="mx-auto max-w-3xl body-s text-gray-70">
          {!settingsRef && (
            <>
              <dt className="eyebrow text-red-60">Algolia settings</dt>
              <dd className="mb-2">
                Not selected — set the AlgoliaSettings field on this component&apos;s datasource.
              </dd>
            </>
          )}

          <dt className="eyebrow">Index</dt>
          <dd className="mb-2">{indexName || '— none resolved —'}</dd>

          <dt className="eyebrow">Refinements</dt>
          <dd className="mb-2">
            {Object.entries(algoliaState.refinements)
              .map(([attribute, values]) => `${attribute}: ${values.join(', ')}`)
              .join(' · ') || '— none —'}
          </dd>

          {algoliaState.query && (
            <>
              <dt className="eyebrow">Query</dt>
              <dd className="mb-2">{algoliaState.query}</dd>
            </>
          )}

          {algoliaState.unsupported.length > 0 && (
            <>
              <dt className="eyebrow text-red-60">Ignored parameters</dt>
              <dd className="mb-2">{algoliaState.unsupported.join(', ')}</dd>
            </>
          )}
        </dl>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingIndicator />;
  }

  if (hasError || !searchClient || !settings || !indexName) {
    return null;
  }

  return (
    <InstantSearch searchClient={searchClient} indexName={indexName}>
      <section data-insights-index={indexName}>
        <Configure
          {...({
            query: algoliaState.query || undefined,
            filters: filters || undefined,
            facetFilters: facetFilters.length ? facetFilters : undefined,
            numericFilters: numericFilters.length ? numericFilters : undefined,
            hitsPerPage: 20,
            clickAnalytics: true,
            getRankingInfo: true,
          } as unknown as UseConfigureProps)}
        />

        <div className="flex flex-col sm:flex-row sm:justify-between sm:px-8 lg:px-16 sm:items-start sm:pb-20">
          <NoResultsBoundary
            fallback={
              settings.noResultsFoundText ? (
                <p className="body-m py-6 mx-5 sm:mx-0">{settings.noResultsFoundText}</p>
              ) : (
                <></>
              )
            }
          >
            <div className="flex flex-col grow mx-5 sm:mx-0 sm:w-full lg:w-full">
              <div className="space-y-10 relative">
                <SearchInfiniteHits
                  renderHit={renderSearchHit}
                  loadMoreButtonLabel={settings.showLoadMore ? settings.loadMoreLabel || '' : ''}
                  hideProductSuggestions={true}
                  disableHitsSessionCache
                />
              </div>
            </div>
          </NoResultsBoundary>
        </div>
      </section>
    </InstantSearch>
  );
};

export default SearchWrapperWithQueryString;
