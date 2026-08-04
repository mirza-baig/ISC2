import React, { useCallback, useMemo } from 'react';
import { useCurrentRefinements, useHits } from 'react-instantsearch-hooks-web';
import type { Hit } from 'instantsearch.js';
import clsx from 'clsx';

import { SearchResultHit } from 'types/index';
import { formatDate, showDateField } from 'utils/index';
import { useAnalyticsTracking } from 'hooks/index';
import { useSearch } from 'providers/index';
import { ANALYTICS_EVENTS } from 'constants/index';

interface SearchHitProps {
  hit: Hit<SearchResultHit>;
  isFeatured: boolean;
  index: number;
}

const SearchHit = ({ hit, isFeatured, index }: SearchHitProps) => {
  const { currentTerm } = useSearch();

  const hitImage = useMemo(
    () => isFeatured && hit.thumbnailImage,
    [hit.thumbnailImage, isFeatured]
  );

  const { items } = useCurrentRefinements();
  const { results } = useHits();

  const { track } = useAnalyticsTracking();
  const formatedDate = formatDate({ value: hit?.createdDate });

  const hitUrl = useMemo(() => {
    if (hit.url) {
      const url = new URL(hit.url);

      if (hit.__queryID) {
        url.searchParams.set('queryID', hit.__queryID);
      }

      return url.href;
    }

    return '';
  }, [hit.url, hit.__queryID]);

  const searchFacets = useMemo(() => {
    if (items.length) {
      const facets = items.map(
        (item) => `${item.attribute}-${item.refinements.map((values) => values.value)},`
      );
      return facets.join('%');
    }

    return undefined;
  }, [items]);

  const searchResultsCount = useMemo(() => results?.nbHits || 0, [results]);

  const trackHitClick = useCallback(() => {
    if (searchResultsCount) {
      const searchTracking = {
        event: ANALYTICS_EVENTS.GA_EVENT,
        type: 'engagement',
        subtype: 'search_results_click',
        bo2: true, // business objective 2, Acquisition and Revenue
        bo3: true, // business objective 3, Loyalty and Retention
        search_query: currentTerm,
        search_results_count: searchResultsCount,
        search_click_position: index,
      };
      if (searchFacets) {
        return track({ ...searchTracking, search_facets: searchFacets });
      }
      track(searchTracking);
    }
  }, [track, searchFacets, currentTerm, searchResultsCount, index]);

  return (
    <a
      onClick={trackHitClick}
      href={hitUrl}
      data-insights-object-id={hit.objectID}
      data-insights-position={hit.__position}
      data-insights-query-id={hit.__queryID}
      className={clsx(
        'flex flex-col relative px-2 focus-isc2-green focus:rounded-md items-start',
        !isFeatured && 'py-8 border-b border-gray-20 sm:py-10 bg-white-00',
        isFeatured && 'mb-10 p-5 sm:px-5 sm:py-6 bg-gray-10'
      )}
    >
      <div className="flex w-full flex-col space-y-4 sm:space-y-0 sm:flex-row-reverse sm:justify-end">
        {Boolean(hitImage) && (
          <img
            src={hitImage}
            alt={hit.title}
            className="w-full h-166 sm:ml-14 sm:w-157 sm:h-157 object-cover"
          />
        )}
        <section className="grow">
          <span className="text-gray-70 eyebrow flex flex-row items-center">
            {Boolean(hit.genericType) && <span>{hit.genericType} </span>}
            {Boolean(hit.genericType) && Boolean(formatedDate) && (
              <span className="mx-2 text-xl">•</span>
            )}
            {Boolean(formatedDate) && <span>{formatedDate}</span>}
          </span>
          {Boolean(hit.type) && (
            <h6 className="flex items-center eyebrow text-gray-70 mb-1">
              {hit.type}
              {showDateField({ value: hit.articleDate! }) && Boolean(hit.type) && (
                <span className="mx-1 text-xl">•</span>
              )}
              {formatDate({ value: hit.articleDate! })}
            </h6>
          )}
          <h2
            className={clsx(
              'body-l sm:headline-s text-black-100 cursor-pointer',
              isFeatured ? 'line-clamp-2' : 'line-clamp-4'
            )}
          >
            {hit.title}
          </h2>
          {Boolean(hit.description) && (
            <p
              className={clsx(
                'body-m text-black-100 mt-4',
                isFeatured ? 'line-clamp-2' : 'line-clamp-4'
              )}
            >
              {hit.description}
            </p>
          )}
        </section>
      </div>
    </a>
  );
};

export default SearchHit;
