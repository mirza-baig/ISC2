import clsx from 'clsx';
import { useMemo, useEffect, useState } from 'react';
import { useHits } from 'react-instantsearch-hooks-web';
import { Field } from '@sitecore-jss/sitecore-jss-nextjs';

import { FacetKeyValues, SortOptions } from 'types/index';
import { useScrollDirection } from 'hooks/index';

import SearchCurrentRefinements from './SearchCurrentRefinements';
import SearchSort from './SearchSort/SearchSort';
import { renderSearchFacets } from './renderSearchFacets';

interface SearchFiltersProps {
  className?: string;
  clearFiltersLabel: Field<string>;
  filterKeyValues: FacetKeyValues[];
  resultsFoundLabel: Field<string>;
  sortByLabel: string;
  sortOptions: SortOptions[];
  showMoreLabel: string;
  isTrainingFinder?: string;
  isSortAvailable?: boolean;
}

export default function SearchFilters({
  className,
  filterKeyValues,
  clearFiltersLabel,
  resultsFoundLabel,
  sortByLabel,
  sortOptions,
  showMoreLabel,
  isSortAvailable,
}: SearchFiltersProps) {
  const { results } = useHits();
  const { scrollDirection } = useScrollDirection();
  const [countryFilterSelected, setCountryFilterSelected] = useState(false);

  const FacetsContent = useMemo(
    () =>
      renderSearchFacets(
        filterKeyValues,
        showMoreLabel,
        (filter) =>
          (filter.FacetAttribute !== 'state' && filter.FacetAttribute !== 'city') ||
          ((filter.FacetAttribute === 'state' || filter.FacetAttribute === 'city') &&
            countryFilterSelected)
      ),
    [filterKeyValues, showMoreLabel, countryFilterSelected]
  );

  useEffect(() => {
    const checkURL = () => {
      const currentUrl = decodeURIComponent(window.location.href);

      setCountryFilterSelected(currentUrl.includes('[refinementList][country]'));
    };

    checkURL();

    const intervalId = setInterval(checkURL, 500);

    return () => {
      clearInterval(intervalId);
    };
  }, [countryFilterSelected, setCountryFilterSelected]);

  const SortByContent = useMemo(
    () =>
      isSortAvailable ? <SearchSort sortByLabel={sortByLabel} sortOptions={sortOptions} /> : null,
    [sortByLabel, sortOptions, isSortAvailable]
  );

  return (
    <section
      className={clsx(
        'sm:pr-10 lg:pr-20 pl-1 sticky sm:block bg-white-00 max-h-screen search-filters-wrap scrollbar-hide',
        scrollDirection === 'down'
          ? 'top-4 md:max-h-[calc(100vh-1rem)]'
          : 'top-36 md:max-h-[calc(100vh-8rem)]',
        className
      )}
    >
      <label className="text-gray-70 py-2 body-s hidden sm:flex px-1">
        {resultsFoundLabel?.value.replace('{0}', results?.nbHits.toString() || '')}
      </label>
      <SearchCurrentRefinements
        className="hidden sm:flex sm:flex-col"
        clearFiltersLabel={clearFiltersLabel}
      />
      <div className="w-full hidden sm:flex flex-col divide-y px-1">
        {SortByContent}
        {FacetsContent}
      </div>
    </section>
  );
}
