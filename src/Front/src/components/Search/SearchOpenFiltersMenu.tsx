import { useMemo } from 'react';
import { CurrentRefinementsProps, useCurrentRefinements } from 'react-instantsearch-hooks-web';
import { Field } from '@sitecore-jss/sitecore-jss-nextjs';

import { FilterIcon } from 'icons/index';

interface SearchOpenFiltersMenuProps extends CurrentRefinementsProps {
  filterLabel: Field<string>;
  openMenu: () => void;
}

export default function SearchOpenFiltersMenu({
  openMenu,
  filterLabel,
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

  return (
    <button
      className="sm:hidden cta flex items-center secondary-cta rounded-tag pl-4 pr-2 py-1"
      onClick={openMenu}
      aria-label={`Filter ${filterLabel?.value}`}
    >
      {filterLabel?.value} {filtersCount} <FilterIcon className="ml-2" size={24} />
    </button>
  );
}
