/* eslint-disable @typescript-eslint/no-empty-function */
import { useBreakpoint } from 'hooks/index';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { SearchDefaultFilter } from 'types/index';

type SearchContextProps = {
  currentTerm: string;
  algoliaIndexName: string;
  defaultSortValue: string;
  isFiltersMenuOpen: boolean;
  defaultFilters: SearchDefaultFilter[];
  openFiltersMenu: () => void;
  closeFiltersMenu: () => void;
  setDefaultFilters: (defaultFiters: SearchDefaultFilter[]) => void;
  setAlgoliaIndexName: (indexName: string) => void;
  setDefaultSortValue: (sortValue: string) => void;
  setCurrentTerm: (currentTerm: string) => void;
};

const SearchContext = createContext<SearchContextProps>({
  algoliaIndexName: '',
  defaultSortValue: '',
  currentTerm: '',
  isFiltersMenuOpen: false,
  defaultFilters: [],
  openFiltersMenu: () => {},
  closeFiltersMenu: () => {},
  setDefaultFilters: () => {},
  setAlgoliaIndexName: () => {},
  setCurrentTerm: () => {},
  setDefaultSortValue: () => {},
});

type SearchProviderProps = {
  children: React.ReactNode;
};

const SearchProvider: React.FC<SearchProviderProps> = ({ children }) => {
  const [isFiltersMenuOpen, setIsFiltersMenuOpen] = useState(false);
  const [defaultFilters, setDefaultFilters] = useState<SearchDefaultFilter[]>([]);
  const [algoliaIndexName, setAlgoliaIndexName] = useState('');
  const [currentTerm, setCurrentTerm] = useState('');
  const [defaultSortValue, setDefaultSortValue] = useState('');

  const breakpoint = useBreakpoint();

  const openFiltersMenu = useCallback(() => setIsFiltersMenuOpen(true), []);

  const closeFiltersMenu = useCallback(() => setIsFiltersMenuOpen(false), []);

  useEffect(() => {
    const body = document.querySelector('body');

    if (['sm', 'max-sm'].includes(breakpoint) && body) {
      body.style.overflow = isFiltersMenuOpen ? 'hidden' : '';
    }

    if (!['sm', 'max-sm'].includes(breakpoint) && body) {
      body.style.overflow = '';

      if (isFiltersMenuOpen) {
        closeFiltersMenu();
      }
    }
  }, [breakpoint, isFiltersMenuOpen, closeFiltersMenu]);

  return (
    <SearchContext.Provider
      value={{
        isFiltersMenuOpen,
        openFiltersMenu,
        closeFiltersMenu,
        defaultFilters,
        setDefaultFilters,
        algoliaIndexName,
        setAlgoliaIndexName,
        currentTerm,
        setCurrentTerm,
        defaultSortValue,
        setDefaultSortValue,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};

const useSearch = () => useContext(SearchContext);

export { SearchProvider, useSearch };
