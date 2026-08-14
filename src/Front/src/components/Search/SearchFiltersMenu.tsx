import { ClearRefinements } from 'react-instantsearch-hooks-web';
import { Field } from '@sitecore-jss/sitecore-jss-nextjs';
import clsx from 'clsx';

import { CloseIcon } from 'icons/index';
import { FacetKeyValues, SortOptions } from 'types/index';
import { useSearch } from 'providers/index';

import SearchCurrentRefinements from './SearchCurrentRefinements';
import SearchSort from './SearchSort/SearchSort';
import { renderSearchFacets } from './renderSearchFacets';

interface SearchFiltersMenuProps {
  filterLabel: Field<string>;
  clearFiltersLabel: Field<string>;
  seeResultsLabel: Field<string>;
  filterKeyValues: FacetKeyValues[];
  sortByLabel: string;
  sortOptions: SortOptions[];
  showMoreLabel: string;
  isSortAvailable?: boolean;
  /** Overlay-filter mode (B2B PLP): the overlay is used on ALL breakpoints, so it must not be
   *  hidden on desktop (default behavior keeps it mobile-only). */
  overlayFilters?: boolean;
}

const SearchFiltersMenu = ({
  filterLabel,
  clearFiltersLabel,
  seeResultsLabel,
  filterKeyValues,
  sortByLabel,
  sortOptions,
  showMoreLabel,
  isSortAvailable,
  overlayFilters = false,
}: SearchFiltersMenuProps) => {
  const { isFiltersMenuOpen, closeFiltersMenu } = useSearch();

  return (
    <section
      className={clsx(
        'hidden h-dynamic-screen flex-col fixed overflow-hidden top-0 left-0 right-0 m-auto bg-white-00 shadow-md backdrop-filter backdrop-blur-md bg-opacity-90',
        isFiltersMenuOpen &&
          (overlayFilters ? '!flex z-filters-menu' : '!flex !sm:hidden z-filters-menu')
      )}
    >
      <main className="flex flex-col grow pt-20 items-start px-5 divide-y divide-gray-50 overflow-y-auto">
        <header className="w-full">
          <section className="flex justify-between items-center pb-7">
            <label className="body-l">{filterLabel?.value}</label>
            <button onClick={closeFiltersMenu} aria-label="Close">
              <CloseIcon size={24} />
            </button>
          </section>
          <SearchCurrentRefinements className="!pt-1" clearFiltersLabel={clearFiltersLabel} />
        </header>

        {isSortAvailable && <SearchSort sortByLabel={sortByLabel} sortOptions={sortOptions} />}

        {renderSearchFacets(filterKeyValues, showMoreLabel)}
      </main>

      <footer className="p-5 flex space-x-7 border-t border-gray-50">
        <ClearRefinements
          classNames={{ root: 'grow', button: 'cta secondary-cta w-full' }}
          translations={{
            resetButtonText: clearFiltersLabel?.value,
          }}
        />
        <button
          className="cta primary-cta grow"
          onClick={closeFiltersMenu}
          aria-label="Close Filters"
        >
          {seeResultsLabel?.value}
        </button>
      </footer>
    </section>
  );
};

export default SearchFiltersMenu;
