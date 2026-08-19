import { useMemo } from 'react';
import { CurrentRefinementsProps, useCurrentRefinements } from 'react-instantsearch-hooks-web';
import { Field } from '@sitecore-jss/sitecore-jss-nextjs';

import clsx from 'clsx';

import { FilterIcon } from 'icons/index';

interface SearchOpenFiltersMenuProps extends CurrentRefinementsProps {
  filterLabel: Field<string>;
  openMenu: () => void;
  /** Overlay-filter mode (B2B PLP): the overlay is the ONLY way to filter on all breakpoints,
   *  so the trigger must show on desktop too (default keeps it mobile-only). */
  overlayFilters?: boolean;
}

export default function SearchOpenFiltersMenu({
  openMenu,
  filterLabel,
  overlayFilters = false,
  ...otherProps
}: SearchOpenFiltersMenuProps) {
  const { items } = useCurrentRefinements(otherProps);

  const filtersCount = useMemo(() => {
    const count = items.reduce((memo, item) => (memo = memo + item.refinements.length), 0);
    if (count) {
      return `(${count})`;
    }

    return '';
  }, [items]);

  const label = filterLabel?.value || 'Filter';

  return (
    <button
      className={clsx(
        'cta flex items-center secondary-cta rounded-tag pl-4 pr-2 py-1',
        !overlayFilters && 'sm:hidden'
      )}
      onClick={openMenu}
      aria-label={`Filter ${label}`}
    >
      {label} {filtersCount} <FilterIcon className="ml-2" size={24} />
    </button>
  );
}
