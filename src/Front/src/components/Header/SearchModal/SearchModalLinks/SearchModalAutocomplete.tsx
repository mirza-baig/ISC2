/* eslint-disable @typescript-eslint/no-explicit-any */
import { AutocompletePlugin, createAutocomplete } from '@algolia/autocomplete-core';
import { getAlgoliaResults } from '@algolia/autocomplete-js';
import { MouseEventHandler, useCallback, useMemo, useRef } from 'react';
import clsx from 'clsx';

import { CloseIcon, SearchIcon } from 'icons/index';
import { useAutocomplete } from 'providers/index';
import { QuerySuggestion, SearchModalProductHit, SOURCE_ID } from 'types/index';
import { useSearchFeatureFlags } from 'hooks/index';

interface SearchModalAutocompleteProps {
  inputClassName?: string;
  goToResultsPage: (query: string) => void;
}

export default function SearchModalAutocomplete({
  inputClassName,
  goToResultsPage,
}: SearchModalAutocompleteProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    initialQuery,
    searchClient,
    autocompleteState: { query },
    algoliaDetails: {
      algoliaAutosuggestIndexName,
      algoliaProductRecommendationIndexName,
      placeholderText,
    },
    algoliaDetails,
    setAutoCompleteQuery,
    setAutoCompleteState,
  } = useAutocomplete();

  const { shouldTriggerSearch } = useSearchFeatureFlags({
    startSearchTriggerTypes: algoliaDetails.startSearchTriggerTypes,
  });

  const plugins = useMemo(() => {
    const productsPlugin: AutocompletePlugin<SearchModalProductHit> = {
      getSources({ query }) {
        if (!query || !searchClient || !shouldTriggerSearch(query)) {
          return [];
        }

        return [
          {
            sourceId: SOURCE_ID.PRODUCT_SUGGESTIONS,
            getItems() {
              return getAlgoliaResults<SearchModalProductHit>({
                searchClient,
                queries: [
                  {
                    indexName: algoliaProductRecommendationIndexName.value,
                    query,
                    params: {
                      hitsPerPage: 2,
                    },
                  },
                ],
              });
            },
          },
        ];
      },
    };

    return [productsPlugin];
  }, [searchClient, algoliaProductRecommendationIndexName, shouldTriggerSearch]);

  const autocomplete = useMemo(() => {
    return createAutocomplete<QuerySuggestion>({
      initialState: {
        query: initialQuery,
      },
      placeholder: placeholderText.value,
      openOnFocus: true,
      autoFocus: true,
      plugins,
      onSubmit: ({ state }) => {
        const query = state.query.trim();

        if (query) {
          setAutoCompleteQuery(query);
          goToResultsPage(query);
        }
      },
      onStateChange: ({ state: { collections, query, status } }) => {
        setAutoCompleteState({ collections, query, status });
      },
      getSources() {
        if (!searchClient) {
          return [];
        }

        return [
          {
            sourceId: SOURCE_ID.QUERY_SUGGESTIONS,
            getItemInputValue: ({ item }) => item.query as string,
            getItems({ query }) {
              if (!shouldTriggerSearch(query)) {
                return [];
              }

              return getAlgoliaResults({
                searchClient,
                queries: [
                  {
                    indexName: algoliaAutosuggestIndexName.value,
                    query,
                    params: {
                      hitsPerPage: 3,
                    },
                  },
                ],
              });
            },
          },
        ];
      },
    });
  }, [
    initialQuery,
    placeholderText.value,
    plugins,
    setAutoCompleteQuery,
    goToResultsPage,
    setAutoCompleteState,
    searchClient,
    algoliaAutosuggestIndexName.value,
    shouldTriggerSearch,
  ]);

  const formProps = autocomplete.getFormProps({
    inputElement: inputRef.current,
  });

  const inputProps = autocomplete.getInputProps({
    inputElement: inputRef.current,
  });

  const onClearButtonPress: MouseEventHandler = useCallback(
    (ev) => {
      ev.preventDefault();
      ev.stopPropagation();

      autocomplete.setQuery('');
      inputRef.current?.focus();
    },
    [autocomplete]
  );

  return (
    <section className="pt-4 sm:pt-12 pb-10 px-5 md:px-60 lg:px-80 w-full flex flex-col items-center justify-center">
      <form {...(formProps as any)} ref={formRef} className="w-full relative flex items-center">
        <button className="absolute left-3" disabled={!query} aria-label="Search">
          <SearchIcon size={24} />
        </button>

        <input
          {...(inputProps as any)}
          ref={inputRef}
          className={clsx(
            'w-full transition-all duration-700 border-gray-70 border-1 h-14 rounded-md bg-gray-10 focus:ring-0 focus:border-2 focus:border-isc2-green focus:rounded-full pl-10',
            inputClassName
          )}
          value={query}
          type="text"
        />
        {Boolean(query) && (
          <button
            type="button"
            aria-label="Clear search query"
            onClick={onClearButtonPress}
            className="absolute right-3 text-gray-70 bg-gray-30 size-7 rounded-full flex items-center justify-center"
          >
            <CloseIcon size={22} />
          </button>
        )}
      </form>
    </section>
  );
}
