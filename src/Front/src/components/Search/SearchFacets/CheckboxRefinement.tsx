import clsx from 'clsx';
import { useCallback, useMemo } from 'react';
import { RefinementListProps, useRefinementList } from 'react-instantsearch-hooks-web';

import { useToggle } from 'hooks/index';
import { ChevronDownIcon } from 'icons/index';
import { useSearch } from 'providers/index';
import { goToTop } from 'utils/goToTop';
import { useAnalyticsTracking } from 'hooks/index';
import { ANALYTICS_EVENTS } from 'constants/analytics';

interface CheckboxFacetProps extends RefinementListProps {
  className?: string;
  label: string;
  openByDefault: boolean;
  showMoreLabel: string;
}

export default function CheckboxFacet({
  className,
  label,
  openByDefault,
  showMoreLabel,
  ...otherProps
}: CheckboxFacetProps) {
  const { items, refine, canToggleShowMore, isShowingMore, toggleShowMore } = useRefinementList({
    limit: 10,
    showMore: true,
    showMoreLimit: 300,
    ...otherProps,
  });
  const { currentTerm, defaultFilters } = useSearch();

  const [isOpen, toggleIsOpen] = useToggle(openByDefault);
  const { track } = useAnalyticsTracking();

  const filteredItems = useMemo(() => {
    const featuredCountries = [
      'Canada',
      'Germany',
      'India',
      'Japan',
      'United Kingdom',
      'United States',
    ];
    return items
      .sort((a, b) => {
        if (otherProps.attribute === 'vendorName') {
          if (a.label === 'ISC2') return -1;
          if (b.label === 'ISC2') return 1;
          return a.label.localeCompare(b.label);
        }

        if (otherProps.attribute === 'country') {
          const aFeaturedIndex = featuredCountries.indexOf(a.label);
          const bFeaturedIndex = featuredCountries.indexOf(b.label);

          if (aFeaturedIndex !== -1 && bFeaturedIndex !== -1) {
            return aFeaturedIndex - bFeaturedIndex;
          } else if (aFeaturedIndex !== -1) {
            return -1;
          } else if (bFeaturedIndex !== -1) {
            return 1;
          }

          return a.label.localeCompare(b.label);
        }

        return 0;
      })
      .filter(({ value }) => {
        const isAppliedByDefault = defaultFilters.some(
          ({ FilterKey, FilterValue }) =>
            FilterKey === otherProps.attribute && FilterValue.split(',').includes(value)
        );
        return !isAppliedByDefault;
      });
  }, [items, defaultFilters, otherProps.attribute]);

  const itemsApplied = useMemo(() => {
    const applied = filteredItems.filter(({ isRefined }) => isRefined);
    if (applied.length) {
      return `(${applied.length})`;
    }

    return '';
  }, [filteredItems]);

  const applyFilter = useCallback(
    (item: { value: string }) => {
      refine(item.value);
      track({
        event: ANALYTICS_EVENTS.FILTER_SEARCH,
        search_term: currentTerm,
        filter_label: otherProps.attribute,
        filter_value: item.value,
      });

      if (otherProps.attribute === 'country') {
        const element = document.querySelector('.search-filters-wrap');
        if (element) {
          goToTop(500);
          element.scrollTo({
            top: element.scrollHeight + 500,
          });
        }
      } else {
        goToTop(300);
      }
    },
    [refine, otherProps, track, currentTerm]
  );

  if (!filteredItems.length) {
    return null;
  }

  return (
    <div className={clsx('flex-col w-full', className)}>
      <label
        className={clsx('flex w-full items-center justify-between py-4', isOpen && 'pb-5 sm:pb-4')}
        onClick={toggleIsOpen}
      >
        <h4 className="cta mr-3 truncate">
          {label} {itemsApplied}
        </h4>
        <button
          className="focus-isc2-green focus:rounded-md"
          tabIndex={0}
          aria-label={isOpen ? 'Collapse' : 'Expand'}
        >
          <ChevronDownIcon
            size={24}
            className={clsx('transition-all duration-500', isOpen && 'rotate-180')}
          />
        </button>
      </label>
      {isOpen && (
        <div className="flex flex-col space-y-4 pb-4">
          {items?.map((item, index) => (
            <button
              key={item?.label}
              className="flex items-center justify-start space-x-2"
              onClick={() => applyFilter(item)}
              tabIndex={0}
              aria-label={item?.label}
            >
              <input
                id={`checkbox-${index}`}
                tabIndex={0}
                type="checkbox"
                checked={item?.isRefined}
                readOnly={true}
                className="h-4 w-4 cursor-pointer rounded-sm border-black-100 checked:border-isc2-green bg-white-00 hover:text-isc2-green checked:text-isc2-green focus:ring-isc2-green"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    applyFilter(item);
                  }
                }}
              />
              <label
                htmlFor={`checkbox-${index}`}
                className="body-m cursor-pointer pointer-events-none truncate"
              >
                {item?.label} ({item?.count})
              </label>
            </button>
          ))}
          {canToggleShowMore && !isShowingMore && (
            <button
              className="cta mt-4 sm:mt-0 focus-underline-dark-green flex items-end p-0 border-0"
              onClick={toggleShowMore}
              tabIndex={0}
              aria-label="Show more"
            >
              <span>{showMoreLabel}</span>
              <ChevronDownIcon size={16} className="ml-1" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
