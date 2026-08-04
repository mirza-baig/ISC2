import { useRef, useMemo } from 'react';
import { ChevronDownIcon } from 'icons/index';
import { SortOptions } from 'types/index';
import { useSearch } from 'providers/index';

interface SearchSortProps {
  sortByLabel: string;
  sortOptions: SortOptions[];
}

export default function SearchSort({ sortByLabel, sortOptions }: SearchSortProps) {
  const { algoliaIndexName, setAlgoliaIndexName } = useSearch();
  const selectRef = useRef<HTMLSelectElement>(null);

  const hideSort = useMemo(() => {
    if (sortOptions?.length) {
      const [firstSort] = sortOptions;

      return firstSort.FilterKey === '' && firstSort.FilterValue === '';
    }

    return false;
  }, [sortOptions]);

  if (hideSort || !Boolean(sortOptions)) {
    return null;
  }

  return (
    <div className="py-4 flex flex-row w-full items-center relative border-t">
      <label htmlFor="sortBy" className="cta truncate pb-0 border-0">
        {sortByLabel}:
      </label>
      <>
        <select
          id="sortBy"
          ref={selectRef}
          className="cta focus:ring-0 ml-2 border-none bg-transparent bg-none cursor-pointer flex-1 p-0"
          value={algoliaIndexName}
          onChange={(e) => setAlgoliaIndexName(e.target.value)}
        >
          {sortOptions.map(({ FilterKey, FilterValue }) => (
            <option key={FilterKey} value={FilterValue}>
              {FilterKey}
            </option>
          ))}
        </select>
        <ChevronDownIcon
          size={24}
          className="transition-all duration-500 absolute right-0 pointer-events-none"
        />
      </>
    </div>
  );
}
