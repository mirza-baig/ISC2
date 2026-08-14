/* eslint-disable @typescript-eslint/no-empty-function */
import { useBreakpoint } from 'hooks/index';
import { createContext, useCallback, useContext, useEffect, useState, type Dispatch } from 'react';

import { SearchDefaultFilter } from 'types/index';

type SearchContextProps = {
  currentTerm: string;
  algoliaIndexName: string;
  defaultSortValue: string;
  isFiltersMenuOpen: boolean;
  defaultFilters: SearchDefaultFilter[];
  openFiltersMenu: () => void;
  closeFiltersMenu: () => void;
  /** When true, the filters menu is used as an overlay on ALL breakpoints (B2B PLP), so it
   *  must NOT be auto-closed on desktop (default behavior keeps it mobile-only). */
  overlayFiltersMode: boolean;
  setOverlayFiltersMode: Dispatch<boolean>;
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
  overlayFiltersMode: false,
  setOverlayFiltersMode: () => {},
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
  const [overlayFiltersMode, setOverlayFiltersMode] = useState(false);
  const [defaultFilters, setDefaultFilters] = useState<SearchDefaultFilter[]>([]);
  const [algoliaIndexName, setAlgoliaIndexName] = useState('');
  const [currentTerm, setCurrentTerm] = useState('');
  const [defaultSortValue, setDefaultSortValue] = useState('');

  const breakpoint = useBreakpoint();

  const openFiltersMenu = useCallback(() => setIsFiltersMenuOpen(true), []);

  const closeFiltersMenu = useCallback(() => setIsFiltersMenuOpen(false), []);

  useEffect(() => {
    const body = document.querySelector('body');
    if (!body) {
      return;
    }

    const isMobileBreakpoint = ['sm', 'max-sm'].includes(breakpoint);

    // The filters menu is an overlay on mobile always, and on desktop only in overlayFiltersMode
    // (B2B PLP). In those cases, lock body scroll while open. On desktop in the normal (sidebar)
    // mode, the overlay isn't used, so close it if somehow open.
    if (isMobileBreakpoint || overlayFiltersMode) {
      body.style.overflow = isFiltersMenuOpen ? 'hidden' : '';
    } else {
      body.style.overflow = '';

      if (isFiltersMenuOpen) {
        closeFiltersMenu();
      }
    }
  }, [breakpoint, isFiltersMenuOpen, closeFiltersMenu, overlayFiltersMode]);

  return (
    <SearchContext.Provider
      value={{
        isFiltersMenuOpen,
        openFiltersMenu,
        closeFiltersMenu,
        overlayFiltersMode,
        setOverlayFiltersMode,
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
