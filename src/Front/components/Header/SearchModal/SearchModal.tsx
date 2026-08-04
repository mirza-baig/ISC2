import { InstantSearch } from 'react-instantsearch-hooks-web';
import { useCallback } from 'react';

import { useAutocomplete } from 'providers/index';

import SearchModalLinks from './SearchModalLinks/SearchModalLinks';
import SearchModalAutocomplete from './SearchModalLinks/SearchModalAutocomplete';
import { useAnalyticsTracking } from 'hooks/index';
import { ANALYTICS_EVENTS } from 'constants/analytics';

const SearchModal = ({ inputClassName }: { inputClassName?: string }) => {
  const {
    searchClient,
    algoliaDetails: { algoliaIndexName },
    addQueryToRecentSearches,
  } = useAutocomplete();

  const { track } = useAnalyticsTracking();

  const goToResultsPage = useCallback(
    (query: string) => {
      addQueryToRecentSearches(query);
      track({
        event: ANALYTICS_EVENTS.SEARCH,
        search_term: query,
      });
      window.location.href = `/search?${encodeURI(`${algoliaIndexName?.value}[query]=${query}`)}`;
    },
    [algoliaIndexName, addQueryToRecentSearches, track]
  );

  if (!searchClient) {
    return null;
  }

  return (
    <InstantSearch searchClient={searchClient} indexName={algoliaIndexName?.value}>
      <SearchModalAutocomplete inputClassName={inputClassName} goToResultsPage={goToResultsPage} />
      <SearchModalLinks />
    </InstantSearch>
  );
};

export default SearchModal;
