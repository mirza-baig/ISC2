import clsx from 'clsx';
import { Field } from '@sitecore-jss/sitecore-jss-nextjs';
import { useHits } from 'react-instantsearch-hooks-web';

import { useIntersectionObserver, useScrollDirection } from 'hooks/index';
import { useSearch } from 'providers/index';

import SearchOpenFiltersMenu from './SearchOpenFiltersMenu';
import SearchModal from 'components/Header/SearchModal/SearchModal';

type SearchBoxProps = {
  hideInput: boolean;
  filterLabel: Field<string>;
  resultsFoundLabel: Field<string>;
  hideFilters?: boolean;
  /** Overlay-filter mode (B2B PLP): show the Filter button + results bar on ALL breakpoints
   *  (not just mobile), so filtering is a "Filter" button → overlay everywhere. */
  overlayFilters?: boolean;
};

const SearchBox = ({
  hideInput,
  filterLabel,
  resultsFoundLabel,
  hideFilters = false,
  overlayFilters = false,
}: SearchBoxProps) => {
  const { scrollDirection, isAtVeryTop } = useScrollDirection();
  const { openFiltersMenu } = useSearch();
  const { isIntersecting, ref } = useIntersectionObserver({ threshold: 1 });
  const { results } = useHits();

  return (
    <div className="flex flex-col sm:flx-row sticky -top-px sm:relative z-50" ref={ref}>
      {!hideInput && (
        <section
          className={clsx(
            'bg-gray-10 w-full flex flex-col items-center justify-center md:space-y-6 pt-36 md:px-20',
            scrollDirection === 'down' && !isAtVeryTop && 'hidden sm:flex'
          )}
        >
          <SearchModal inputClassName="!bg-white" />
        </section>
      )}

      {Boolean(results?.nbHits) && !hideFilters && (
        <div
          className={clsx(
            'w-full py-6 px-5 bg-white-00 sm:p-0 sm:pb-1 flex flex-row justify-between items-center shadow-search-filters-pinned sm:flex-col sm:items-start sm:shadow-none',
            // Default: filter bar is mobile-only (desktop uses the persistent sidebar).
            // Overlay mode (B2B PLP): keep it visible on desktop too so the Filter button shows.
            !overlayFilters && 'sm:hidden',
            overlayFilters && 'sm:flex-row sm:items-center sm:py-4',
            scrollDirection === 'up' && hideInput && isIntersecting && '!pt-30 !sm:pt-6',
            isAtVeryTop && 'max-sm:fixed max-sm:bottom-0'
          )}
        >
          <label className="text-gray-70 body-s">
            {resultsFoundLabel?.value.replace('{0}', results?.nbHits.toString() || '')}
          </label>
          <SearchOpenFiltersMenu
            filterLabel={filterLabel}
            openMenu={openFiltersMenu}
            overlayFilters={overlayFilters}
          />
        </div>
      )}
    </div>
  );
};

export default SearchBox;
