import type { SearchClient } from 'algoliasearch/lite';
import type { BaseItem } from '@algolia/autocomplete-core';
import type { AutocompleteOptions } from '@algolia/autocomplete-js';
import { createElement, Fragment, useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { createRoot, Root } from 'react-dom/client';
import { useHierarchicalMenu, usePagination, useSearchBox } from 'react-instantsearch-hooks';
import { autocomplete } from '@algolia/autocomplete-js';
import { createQuerySuggestionsPlugin } from '@algolia/autocomplete-plugin-query-suggestions';

import { useAutocomplete } from 'providers/index';

import '@algolia/autocomplete-theme-classic';

export const INSTANT_SEARCH_HIERARCHICAL_ATTRIBUTES = [''];

type SearchAutocompleteProps = Partial<AutocompleteOptions<BaseItem>> & {
  searchClient: SearchClient;
  indexName: string;
  placeholder: string;
  querySuggestionsIndexName: string;
  goToResultsPage?: (term: string) => void;
  searchOnSuggestionClick?: boolean;
  backgroundColorClass?: string;
  clearButtonClass?: string;
};

type SetInstantSearchUiStateOptions = {
  query: string;
  category?: string;
};

function sanitizeInput(input: string): string {
  const disallowedChars = [
    "'",
    '"',
    ';',
    '\\',
    '|',
    '&',
    '*',
    '?',
    '$',
    '^',
    '~',
    '>',
    '<',
    '(',
    ')',
    '=',
    '/',
  ];
  const disallowedKeywords = ['SELECT', 'DROP', 'INSERT', 'UPDATE', 'DELETE', 'OR', 'AND'];
  const disallowedExtensions = [
    '.php',
    '.asp',
    '.exe',
    '.jsp',
    '.pl',
    '.py',
    '.bat',
    '.jar',
    '.sh',
  ];
  const disallowedPaths = ['/etc/passwd', '/bin/', '/usr/bin/'];
  const disallowedProtocols = ['http://', 'https://', 'ftp://', 'ssh://'];
  const disallowedScripting = ['<?php', '?>', '<script>', '</script>'];
  const disallowedSpecialSymbols = ['`', '${}', '{}'];
  const disallowedNavigators = ['./', '../'];

  // Strip HTML tags
  let sanitizedInput = input.replace(/<[^>]+(?:>|$)/g, '');

  // Remove disallowed characters
  disallowedChars.forEach((char) => {
    sanitizedInput = sanitizedInput.split(char).join('');
  });

  // Remove disallowed patterns including protocols
  const disallowedPatterns = [
    ...disallowedKeywords,
    ...disallowedExtensions,
    ...disallowedPaths,
    ...disallowedProtocols,
    ...disallowedScripting,
    ...disallowedSpecialSymbols,
    ...disallowedNavigators,
  ];

  disallowedPatterns.forEach((pattern) => {
    while (sanitizedInput.includes(pattern)) {
      sanitizedInput = sanitizedInput.replace(pattern, '');
    }
  });

  // Additional: Remove any remaining 'http:' that might not be caught
  sanitizedInput = sanitizedInput.replace(/http:/g, '');

  return sanitizedInput;
}

export default function SearchAutocomplete({
  autoFocus,
  searchClient,
  indexName,
  placeholder,
  querySuggestionsIndexName,
  goToResultsPage,
  searchOnSuggestionClick,
  detachedMediaQuery,
  openOnFocus,
  backgroundColorClass = '!bg-gray-10',
  clearButtonClass = '!bg-gray-30 !w-7 !h-7 !flex !items-center !justify-center !rounded-full !p-0 !text-gray-70 !mr-3',
}: SearchAutocompleteProps) {
  const autocompleteContainer = useRef<HTMLDivElement>(null);
  const panelRootRef = useRef<Root | null>(null);
  const rootRef = useRef<HTMLElement | null>(null);

  const { addQueryToRecentSearches } = useAutocomplete();
  const { query, refine: setQuery } = useSearchBox();
  const { items: categories, refine: setCategory } = useHierarchicalMenu({
    attributes: INSTANT_SEARCH_HIERARCHICAL_ATTRIBUTES,
  });

  const { refine: setPage } = usePagination();
  const sanitizedQuery = sanitizeInput(query);

  const [instantSearchUiState, setInstantSearchUiState] = useState<SetInstantSearchUiStateOptions>({
    query: sanitizedQuery,
  });

  useEffect(() => {
    setQuery(instantSearchUiState.query);
    instantSearchUiState.category && setCategory(instantSearchUiState.category);
    setPage(0);
  }, [instantSearchUiState, setCategory, setQuery, setPage]);

  const currentCategory = useMemo(
    () => categories.find(({ isRefined }) => isRefined)?.value,
    [categories]
  );

  const plugins = useMemo(() => {
    const querySuggestions = createQuerySuggestionsPlugin({
      searchClient,
      indexName: querySuggestionsIndexName,
      categoryAttribute: [
        indexName,
        'facets',
        'exact_matches',
        INSTANT_SEARCH_HIERARCHICAL_ATTRIBUTES[0],
      ],
      transformSource({ source }) {
        return {
          ...source,
          sourceId: 'querySuggestionsPlugin',
          onSelect({ item }) {
            const sanitizedInput = sanitizeInput(item.query);
            addQueryToRecentSearches(item.query);

            if (searchOnSuggestionClick && goToResultsPage) {
              goToResultsPage(item.query);
            }

            setInstantSearchUiState({
              query: sanitizedInput,
              category: item.__autocomplete_qsCategory || '',
            });

            if (searchOnSuggestionClick && goToResultsPage) {
              goToResultsPage(sanitizedInput);
            }
          },
          getItems(params) {
            if (!params.state.query) {
              return [];
            }

            return source.getItems(params);
          },
          templates: {
            ...source.templates,
            header({ items }) {
              if (!currentCategory || items.length === 0) {
                return <Fragment />;
              }

              return (
                <Fragment>
                  <span className="aa-SourceHeaderTitle">In other categories</span>
                  <span className="aa-SourceHeaderLine" />
                </Fragment>
              );
            },
          },
        };
      },
    });

    return [querySuggestions];
  }, [
    currentCategory,
    goToResultsPage,
    indexName,
    querySuggestionsIndexName,
    searchClient,
    searchOnSuggestionClick,
    addQueryToRecentSearches,
  ]);

  useEffect(() => {
    if (!autocompleteContainer.current) {
      return;
    }

    const focusInput = () => {
      if (autocompleteContainer.current) {
        const inputEl = autocompleteContainer.current.querySelector(
          '#search-modal-input'
        ) as HTMLInputElement;

        if (autoFocus && inputEl) {
          inputEl.focus();
        }
      }
    };

    const autocompleteInstance = autocomplete({
      autoFocus,
      detachedMediaQuery,
      openOnFocus,
      container: autocompleteContainer.current,
      id: 'search-modal',
      initialState: { query: sanitizedQuery },
      insights: true,
      plugins,
      placeholder,
      panelContainer: '.suggestions-panel-container',
      classNames: {
        form: clsx(
          'transition-all h-14 focus-within:!border-isc2-green focus-within:!border-2 focus-within:!rounded-full focus-within:!shadow-none',
          backgroundColorClass
        ),
        panel: '!relative !inset-x-0 !inset-y-0 !shadow-none !m-0',
        input: 'placeholder:!text-gray-70 !text-black-100 !font-normal',
        detachedSearchButtonIcon: 'w-30',
        panelLayout: '!p-0',
        clearButton: clearButtonClass,
      },
      onStateChange({ state, setQuery }) {
        const sanitizedQuery = sanitizeInput(state.query);
        if (sanitizedQuery !== state.query) {
          setQuery(sanitizedQuery);
        }
      },
      onReset() {
        setInstantSearchUiState({ query: '', category: currentCategory });
      },
      onSubmit({ state }) {
        const sanitizedInput = sanitizeInput(state.query);
        setQuery(sanitizedInput);
        setInstantSearchUiState({ query: sanitizedInput });

        if (goToResultsPage) {
          goToResultsPage(sanitizedInput);
        }
      },
      renderer: { createElement, Fragment },
      render({ children }, root) {
        if (!panelRootRef.current || rootRef.current !== root) {
          rootRef.current = root;

          panelRootRef.current?.unmount();
          panelRootRef.current = createRoot(root);
        }

        panelRootRef.current.render(children);
      },
    });

    focusInput();

    return () => autocompleteInstance.destroy();
  }, [
    plugins,
    goToResultsPage,
    detachedMediaQuery,
    openOnFocus,
    currentCategory,
    sanitizedQuery,
    placeholder,
    backgroundColorClass,
    addQueryToRecentSearches,
    clearButtonClass,
    autoFocus,
    setQuery,
  ]);

  return <div className="w-full" ref={autocompleteContainer} />;
}
