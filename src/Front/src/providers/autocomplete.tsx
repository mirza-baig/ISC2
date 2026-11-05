/* eslint-disable @typescript-eslint/no-empty-function */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { LinkField } from '@sitecore-jss/sitecore-jss-nextjs';
import algoliasearch, { SearchClient } from 'algoliasearch';

import {
  AutocompleteSuggestions,
  SearchModalProductHit,
  SOURCE_ID,
  SearchModalAlgoliaSettings,
} from 'types/index';

type AutocompleteContextProps = {
  initialQuery: string;
  autocompleteState: AutocompleteSuggestions;
  isQueryEmpty: boolean;
  noResultsFound: boolean;
  isLoading: boolean;
  suggestions: LinkField[];
  productRecommendations: SearchModalProductHit[];
  recentSearches: LinkField[];
  algoliaDetails: SearchModalAlgoliaSettings['algoliaDetails'];
  searchClient: SearchClient | null;
  addQueryToRecentSearches: (query: string) => void;
  setAutoCompleteQuery: (query: string) => void;
  setAutoCompleteState: (state: AutocompleteSuggestions) => void;
  showNoResultsContent: boolean;
};

const DEFAULT_STATE = {
  collections: [],
  query: '',
  status: 'idle' as const,
};

const MAX_NUMBER_PRODUCTS = 2;

const AutocompleteContext = createContext<AutocompleteContextProps>({
  initialQuery: '',
  autocompleteState: DEFAULT_STATE,
  isQueryEmpty: true,
  noResultsFound: false,
  isLoading: false,
  searchClient: null,
  algoliaDetails: {
    algoliaApiKey: { value: '' },
    algoliaAppId: { value: '' },
    algoliaIndexName: { value: '' },
    algoliaAutosuggestIndexName: { value: '' },
    placeholderText: { value: '' },
    algoliaProductRecommendationIndexName: { value: '' },
    startSearchTriggerTypes: { value: '' },
    pressEnterKeySearchLabel: { value: '' },
    min3CharacterSearchLabel: { value: '' },
    searchModalNavigationItems: {
      navigationItemsDataSource: {
        navigationItemsList: {
          items: [],
        },
      },
    },
  },
  suggestions: [],
  productRecommendations: [],
  recentSearches: [],
  setAutoCompleteQuery: () => {},
  setAutoCompleteState: () => {},
  addQueryToRecentSearches: () => {},
  showNoResultsContent: false,
});

type AutocompleteProviderProps = {
  algoliaSettings: SearchModalAlgoliaSettings;
  initialQuery?: string;
  children: React.ReactNode;
  showNoResultsContent: boolean;
};

const RECENT_SEARCHES = 'recent-searches';
const MAX_RECENT_SEARCHES_COUNT = 3;

const AutocompleteProvider: React.FC<AutocompleteProviderProps> = ({
  children,
  initialQuery = '',
  algoliaSettings,
  showNoResultsContent,
}) => {
  const [recentQueries, setRecentQueries] = useState<string[]>([]);
  const [autocompleteState, setAutoCompleteState] = useState<AutocompleteSuggestions>({
    ...DEFAULT_STATE,
    query: initialQuery || '',
  });

  const searchClient = useMemo(() => {
    const { algoliaApiKey, algoliaAppId } = algoliaSettings.algoliaDetails;

    if (!algoliaApiKey?.value || !algoliaAppId?.value) {
      return null;
    }

    return algoliasearch(algoliaAppId?.value, algoliaApiKey?.value);
  }, [algoliaSettings.algoliaDetails]);

  useEffect(() => {
    const savedItems = localStorage.getItem(RECENT_SEARCHES);

    if (savedItems) {
      setRecentQueries(JSON.parse(savedItems));
    }
  }, []);

  const getNewRecentSearches = useCallback(
    (query: string) => {
      const isQueryAlreadySaved = recentQueries.includes(query);

      if (!isQueryAlreadySaved) {
        return recentQueries;
      }

      return recentQueries.filter((search) => search !== query);
    },
    [recentQueries]
  );

  const addQueryToRecentSearches = useCallback(
    (query: string) => {
      const items = getNewRecentSearches(query);
      const newItems = [query, ...items].slice(0, MAX_RECENT_SEARCHES_COUNT);

      localStorage.setItem(RECENT_SEARCHES, JSON.stringify(newItems));
      setRecentQueries(newItems);
    },
    [getNewRecentSearches]
  );

  const setAutoCompleteQuery = useCallback((query: string) => {
    setAutoCompleteState((prevState) => ({ ...prevState, query }));
  }, []);

  const isQueryEmpty = useMemo(
    () => !Boolean(autocompleteState.query.trim()),
    [autocompleteState.query]
  );

  const suggestions = useMemo(() => {
    const collection = autocompleteState.collections.find(
      (collection) => collection.source.sourceId === SOURCE_ID.QUERY_SUGGESTIONS
    );

    const { algoliaIndexName } = algoliaSettings.algoliaDetails;

    return (collection?.items || []).map((item) => ({
      value: {
        href: `/search?${encodeURI(`${algoliaIndexName.value}[query]=${item.title}`)}`,
        text: item.query || (item.title as string),
      },
    }));
  }, [autocompleteState.collections, algoliaSettings]);

  const productRecommendations = useMemo(() => {
    const collection = autocompleteState.collections.find(
      (collection) => collection.source.sourceId === SOURCE_ID.PRODUCT_SUGGESTIONS
    );

    return (collection?.items.slice(0, MAX_NUMBER_PRODUCTS) ||
      []) as unknown as SearchModalProductHit[];
  }, [autocompleteState.collections]);

  const recentSearches = useMemo(() => {
    const { algoliaIndexName } = algoliaSettings.algoliaDetails;

    return recentQueries.map((item) => ({
      value: {
        href: `/search?${encodeURI(`${algoliaIndexName.value}[query]=${item}`)}`,
        text: item,
      },
    }));
  }, [recentQueries, algoliaSettings]);

  const noResultsFound = useMemo(() => {
    if (isQueryEmpty) return false;

    const triggerType = algoliaSettings?.algoliaDetails?.startSearchTriggerTypes?.value;
    const query = autocompleteState.query;

    const isBlockedByFeatureFlags =
      (triggerType === 'Min 3 Character Search' && query.length > 0 && query.length < 3) ||
      (triggerType === 'Enter Key' && query.length > 0);

    return (
      isBlockedByFeatureFlags || (suggestions.length === 0 && autocompleteState.status === 'idle')
    );
  }, [
    autocompleteState.status,
    autocompleteState.query,
    isQueryEmpty,
    suggestions,
    algoliaSettings?.algoliaDetails?.startSearchTriggerTypes?.value,
  ]);

  return (
    <AutocompleteContext.Provider
      value={{
        initialQuery,
        autocompleteState,
        isQueryEmpty,
        suggestions,
        productRecommendations,
        noResultsFound,
        setAutoCompleteState,
        recentSearches,
        addQueryToRecentSearches,
        searchClient,
        isLoading: ['loading', 'stalled'].includes(autocompleteState.status),
        setAutoCompleteQuery,
        ...algoliaSettings,
        showNoResultsContent,
      }}
    >
      {children}
    </AutocompleteContext.Provider>
  );
};

const useAutocomplete = () => useContext(AutocompleteContext);

export { AutocompleteProvider, useAutocomplete };
