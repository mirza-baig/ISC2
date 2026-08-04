import { ChangeEvent, MouseEventHandler, useCallback, useRef } from 'react';
import clsx from 'clsx';

import { SearchIcon, CloseIcon } from 'icons/index';
import { useAllocationDetails } from 'providers/index';
import { AllocationUser } from 'types/profile';

export default function AllocationDetailsSearch({ list }: { list: AllocationUser[] }) {
  const { labels, searchTerm, setSearchTerm } = useAllocationDetails();

  const inputRef = useRef<HTMLInputElement>(null);

  const onTextChange = (ev: ChangeEvent<HTMLInputElement>) => {
    if (list.length > 0) {
      setSearchTerm(ev.target.value);
    }
  };

  const onClearButtonPress: MouseEventHandler = useCallback(
    (ev) => {
      ev.preventDefault();
      ev.stopPropagation();

      setSearchTerm('');
      inputRef.current?.focus();
    },
    [setSearchTerm]
  );

  return (
    <div
      className={clsx(
        'flex w-full items-start sm:justify-end sm:items-center ml-1 sm:space-x-7 flex-wrap sm:flex-row'
      )}
    >
      <div className="w-full sm:max-w-[21.625rem] relative flex items-center sm:flex-1 order-2 sm:order-none">
        <SearchIcon size={24} className="absolute left-3" />

        <input
          type="text"
          disabled={list.length === 0}
          placeholder={labels?.searchUsersByEmailPlaceholder}
          ref={inputRef}
          className={
            'border border-black rounded-full h-12 pl-10 pr-8 body-m w-full placeholder:text-gray-70 outline-isc2-green focus:ring-isc2-green focus:border-isc2-green'
          }
          value={searchTerm}
          onChange={onTextChange}
        />

        {Boolean(searchTerm) && (
          <button
            type="button"
            aria-label="Clear search query"
            onClick={onClearButtonPress}
            className="absolute right-3 text-gray-70 bg-gray-30 size-7 rounded-full flex items-center justify-center"
          >
            <CloseIcon size={22} />
          </button>
        )}
      </div>
    </div>
  );
}
