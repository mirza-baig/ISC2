import {
  ComponentRendering,
  Field,
  GetStaticComponentProps,
  LinkField,
  useComponentProps,
  withDatasourceCheck,
} from '@sitecore-jss/sitecore-jss-nextjs';
import { formatDate } from 'date-fns';
import { createPortal } from 'react-dom';
import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';

import { getGraphQLResult, parseFieldsFromURLString, groupAllocationsByOrder } from 'utils/index';
import { AlgoliaSettings, AllocationsLabels } from 'types/index';
import { Allocation as AllocationType } from 'types/profile';
import {
  AllocationFilterState,
  AllocationSortOption,
  DEFAULT_FILTER_STATE,
  SortDirection,
  filterAllocations,
  sortAllocations,
} from 'utils/allocations';

import AllocationFilters from './AllocationFilters';

import { useLoggedUser, useGetAllocations, useGetAlgoliaSitecoreData } from 'hooks/index';
import { Allocation, LoadingIndicator } from 'ui/index';
import { ChevronDownIcon } from 'icons/index';

import MyAccountSectionContainer from 'components/MyAccount/MyAccountSectionContainer';
import MyAccountSectionFooter from 'components/MyAccount/MyAccountSectionFooter';
import { LineItemsProvider, useLineItems } from 'providers/lineItems';
import { SEARCH_SETTINGS_QUERY_FOR_ALGOLIA } from 'queries/searchSettings';
import { useUserSession } from 'providers/index';

type AllocationsFields = {
  seeAllLink: LinkField;
  allocationDetailsCta: LinkField;
  labelsTitlesAndMore: Field<string>;
  allocationLabels: Field<string>;
  isCompactComponent: Field<boolean>;
};

type AllocationsProps = {
  fields?: AllocationsFields;
  rendering: ComponentRendering;
};

const MAX_ALLOCATION_QUANTITY = 3;

const AllocationItems = ({
  allocations,
  labels,
  componentStyles,
  allocationDetailsCta,
  groupedByOrder,
}: {
  allocations: AllocationType[];
  labels: AllocationsLabels;
  allocationDetailsCta?: LinkField;
  componentStyles: {
    container: string;
    element: string;
  };
  groupedByOrder?: boolean;
}) => {
  const { algoliaIndex } = useLineItems();
  const productKeysList = allocations.map((element) => element.key);
  const { algoliaBulkData, algoliaDataIsLoading } = useGetAlgoliaSitecoreData({
    productKeysList,
    algoliaIndex,
  });

  const allocationsByOrder = useMemo(
    () => (groupedByOrder ? groupAllocationsByOrder(allocations) : null),
    [allocations, groupedByOrder]
  );

  const renderAllocationCard = (allocation: AllocationType, hideOrderNumber?: boolean) => (
    <Allocation
      key={`${allocation.orderNumber}-${allocation.id}`}
      allocation={allocation}
      icon={algoliaBulkData?.find((product) => product.objectID === allocation.key)?.thumbnailImage}
      labels={labels}
      className={componentStyles.element}
      allocationDetailsCta={allocationDetailsCta}
      imagesAreLoading={algoliaDataIsLoading}
      hideOrderNumber={hideOrderNumber}
    />
  );

  if (allocationsByOrder) {
    return (
      <ul className={clsx('flex flex-col w-full', componentStyles.container)}>
        {allocationsByOrder.map(({ orderNumber, products }) => (
          <li key={orderNumber} className="flex flex-col gap-y-5">
            <p className="text-sm font-semibold text-gray-90">
              {labels.orderLabel}: #{orderNumber}
              {products.length > 1 && (
                <span className="font-normal ml-1">({products.length} products)</span>
              )}
            </p>
            <ul className={clsx('flex flex-col w-full', componentStyles.container)}>
              {products.map((allocation) => renderAllocationCard(allocation, true))}
            </ul>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className={clsx('flex flex-col w-full', componentStyles.container)}>
      {allocations.map((allocation) => renderAllocationCard(allocation, false))}
    </ul>
  );
};

const SORT_OPTIONS: { value: AllocationSortOption; label: string }[] = [
  { value: 'default', label: 'Default' },
  { value: 'availability', label: 'Availability' },
  { value: 'expirationDate', label: 'Allocation Expiration Date' },
  { value: 'createDate', label: 'Allocation Create Date' },
  { value: 'orderNumber', label: 'Order Number' },
  { value: 'product', label: 'Product Name' },
];

const SORT_PANEL_LABELS = {
  sortBy: 'Sort By:',
  direction: 'Sort Order',
  ascending: 'Ascending',
  descending: 'Descending',
  collapse: 'Collapse',
  expand: 'Expand',
} as const;

const SortPanel = ({
  sortBy,
  sortDir,
  isDirOpen,
  onSortChange,
  onDirChange,
  onToggleDir,
}: {
  sortBy: AllocationSortOption;
  sortDir: SortDirection;
  isDirOpen: boolean;
  onSortChange: (v: AllocationSortOption) => void;
  onDirChange: (v: SortDirection) => void;
  onToggleDir: () => void;
}) => (
  <>
    <div className="relative border-b border-gray-50">
      <div className="flex items-center lg:w-full mx-3 lg:pr-3 py-7 lg:py-6 text-black-100 body-m text-xsm">
        <label htmlFor="allocation-sort" className="truncate">
          {SORT_PANEL_LABELS.sortBy}
        </label>
        <select
          id="allocation-sort"
          className="focus:ring-0 ml-2 border-none bg-transparent bg-none cursor-pointer flex-1 p-0 body-m text-xsm"
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as AllocationSortOption)}
        >
          {SORT_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <ChevronDownIcon
        size={16}
        className="transition-all duration-500 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none"
      />
    </div>
    <div>
      <div className="relative cursor-pointer" onClick={onToggleDir}>
        <div className="lg:w-full mx-3 lg:pr-3 py-7 lg:py-6 text-black-100 body-m text-xsm">
          <span>{SORT_PANEL_LABELS.direction}</span>
        </div>
        <button
          className="absolute right-0 top-1/2 -translate-y-1/2 focus-isc2-green focus:rounded-md"
          tabIndex={0}
          aria-label={isDirOpen ? SORT_PANEL_LABELS.collapse : SORT_PANEL_LABELS.expand}
        >
          <ChevronDownIcon
            size={16}
            className={clsx('transition-all duration-500', isDirOpen && 'rotate-180')}
          />
        </button>
      </div>
      {isDirOpen && (
        <div className="flex flex-col space-y-4 mx-3 pb-4">
          <button
            className="flex items-center justify-start space-x-2"
            onClick={() => onDirChange('asc')}
          >
            <input
              type="radio"
              checked={sortDir === 'asc'}
              readOnly
              className="h-4 w-4 cursor-pointer rounded-sm border-black-100 checked:border-isc2-green bg-white-00 text-isc2-green focus:ring-isc2-green"
            />
            <span className="body-m text-xsm cursor-pointer">{SORT_PANEL_LABELS.ascending}</span>
          </button>
          <button
            className="flex items-center justify-start space-x-2"
            onClick={() => onDirChange('desc')}
          >
            <input
              type="radio"
              checked={sortDir === 'desc'}
              readOnly
              className="h-4 w-4 cursor-pointer rounded-sm border-black-100 checked:border-isc2-green bg-white-00 text-isc2-green focus:ring-isc2-green"
            />
            <span className="body-m text-xsm cursor-pointer">{SORT_PANEL_LABELS.descending}</span>
          </button>
        </div>
      )}
    </div>
    <hr className="hidden lg:block my-4 border-t border-gray-700 lg:border-b-2" />
  </>
);

const SORT_STORAGE_KEY = 'allocation-sort-isc2';
const SORT_DIR_STORAGE_KEY = 'allocation-sort-dir-isc2';
const FILTER_STORAGE_KEY = 'allocation-filters-isc2';
const DEFAULT_SORT: AllocationSortOption = 'default';
const DEFAULT_DIR: SortDirection = 'asc';

const Allocations = ({ fields, rendering }: AllocationsProps) => {
  const { isB2BAdminUser } = useLoggedUser();
  const { isConsentAllocation, setIsConsentAllocation } = useUserSession();
  const algoliaSettings = useComponentProps<AlgoliaSettings>(rendering.uid);
  const [sortBy, setSortBy] = useState<AllocationSortOption>(DEFAULT_SORT);
  const [sortDir, setSortDir] = useState<SortDirection>(DEFAULT_DIR);
  const [isDirOpen, setIsDirOpen] = useState(false);
  const [portalTarget, setPortalTarget] = useState<Element | null>(null);
  const [filters, setFilters] = useState<AllocationFilterState>(DEFAULT_FILTER_STATE);

  useEffect(() => {
    try {
      const savedSort = sessionStorage.getItem(SORT_STORAGE_KEY) as AllocationSortOption;
      const savedDir = sessionStorage.getItem(SORT_DIR_STORAGE_KEY) as SortDirection;
      const savedFilters = sessionStorage.getItem(FILTER_STORAGE_KEY);
      if (savedSort) setSortBy(savedSort);
      if (savedDir) setSortDir(savedDir);
      if (savedFilters) setFilters(JSON.parse(savedFilters));
    } catch {}
  }, []);

  useEffect(() => {
    setPortalTarget(document.getElementById('allocation-sort-portal'));
  }, []);

  const handleSortChange = (value: AllocationSortOption) => {
    setSortBy(value);
    try {
      sessionStorage.setItem(SORT_STORAGE_KEY, value);
    } catch {}
  };

  const handleDirChange = (value: SortDirection) => {
    setSortDir(value);
    try {
      sessionStorage.setItem(SORT_DIR_STORAGE_KEY, value);
    } catch {}
  };

  const handleFilterChange = (next: AllocationFilterState) => {
    setFilters(next);
    try {
      sessionStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(next));
    } catch {}
  };

  const handleFilterReset = () => {
    setFilters(DEFAULT_FILTER_STATE);
    try {
      sessionStorage.removeItem(FILTER_STORAGE_KEY);
    } catch {}
  };

  const { allocationList, isGettingAllocationList } = useGetAllocations({
    maxQuantity: fields?.isCompactComponent.value ? MAX_ALLOCATION_QUANTITY : undefined,
  });

  const sortedAllocations = useMemo(
    () => sortAllocations(filterAllocations(allocationList, filters), sortBy, sortDir),
    [allocationList, filters, sortBy, sortDir]
  );

  const labels = useMemo(
    () => parseFieldsFromURLString<AllocationsLabels>(fields?.labelsTitlesAndMore),
    [fields?.labelsTitlesAndMore]
  );

  const componentStyles = useMemo(() => {
    return fields?.isCompactComponent
      ? {
          container: 'divide-y divide-gray-50',
          element: '',
        }
      : {
          container: 'gap-y-5',
          element: 'border border-gray-30 rounded-md px-5 lg:px-6 !py-5',
        };
  }, [fields?.isCompactComponent]);

  const expiryDate = useMemo(() => {
    if (!fields?.isCompactComponent.value) {
      const lastAllocation = allocationList.at(-1);

      if (lastAllocation?.expirationDate) {
        return formatDate(lastAllocation.expirationDate, 'MM/dd/yyyy');
      }
    }

    return '';
  }, [allocationList, fields?.isCompactComponent.value]);

  if (!fields || !isB2BAdminUser || !algoliaSettings) {
    return null;
  }

  if (isGettingAllocationList || !isConsentAllocation) {
    return <LoadingIndicator className="self-center" />;
  }

  if (!allocationList.length) {
    return <p>{labels.noAllocationsLabel}</p>;
  }

  const sortPanelProps = {
    sortBy,
    sortDir,
    isDirOpen,
    onSortChange: handleSortChange,
    onDirChange: handleDirChange,
    onToggleDir: () => setIsDirOpen((v) => !v),
  };

  const filterPanelProps = {
    filters,
    labels,
    onChange: handleFilterChange,
    onReset: handleFilterReset,
  };

  if (!fields?.isCompactComponent?.value) {
    return (
      <LineItemsProvider algoliaSettings={algoliaSettings}>
        <section className="flex flex-col">
          <div className="flex items-center pb-5">
            <input
              type="checkbox"
              className="h-4 w-4 border bg-white-00 disabled:bg-gray-400 checked:hover:bg-gray-400"
              disabled={isConsentAllocation}
              checked={isConsentAllocation}
              required
              id="allocation-consent"
            />
            <label className="body-m space-y-2 pl-2" htmlFor="allocation-consent">
              {labels.allocationConsentCheckboxLabel
                .split('{consentTermsAndConditionsLink}')
                .map((part, index) => {
                  if (index === 0) {
                    return (
                      <span key={`allocation-consent-label-${index}`}>
                        {part}
                        <button
                          className="text-isc2-green font-semibold hover:underline"
                          onClick={() => setIsConsentAllocation(false)}
                        >
                          {labels.consentTermsAndConditionsLinkLabel}
                        </button>
                      </span>
                    );
                  }
                  return <span key={`allocation-consent-label-${index}`}>{part}</span>;
                })}
            </label>
          </div>
          {labels.allocatedProductsExpiryMessage && expiryDate && (
            <label className="body-m mb-6">
              {labels.allocatedProductsExpiryMessage.replace('{expiryDate}', expiryDate)}
            </label>
          )}
          <div className="lg:hidden mb-6">
            <AllocationFilters {...filterPanelProps} />
            <SortPanel {...sortPanelProps} />
          </div>
          {sortedAllocations.length === 0 ? (
            <div className="flex flex-col items-start gap-y-2">
              <p className="body-m text-xsm text-black-100">{labels.noResultsLabel}</p>
              <button
                className="text-isc2-green hover:underline body-m text-xsm"
                onClick={handleFilterReset}
              >
                {labels.clearFiltersLabel}
              </button>
            </div>
          ) : (
            <AllocationItems
              allocations={sortedAllocations}
              labels={labels}
              componentStyles={componentStyles}
              allocationDetailsCta={fields?.allocationDetailsCta}
              groupedByOrder
            />
          )}
        </section>
        {portalTarget &&
          createPortal(
            <>
              <AllocationFilters {...filterPanelProps} />
              <SortPanel {...sortPanelProps} />
            </>,
            portalTarget
          )}
      </LineItemsProvider>
    );
  }

  return (
    <MyAccountSectionContainer fields={{ title: labels.title }}>
      <LineItemsProvider algoliaSettings={algoliaSettings}>
        <AllocationItems
          allocations={allocationList}
          labels={labels}
          componentStyles={componentStyles}
          allocationDetailsCta={fields?.allocationDetailsCta}
          groupedByOrder
        />

        {Boolean(fields.seeAllLink.value.href) && (
          <MyAccountSectionFooter
            primaryCTA={{
              href: fields.seeAllLink.value.href,
              label: fields.seeAllLink.value.text,
            }}
          />
        )}
      </LineItemsProvider>
    </MyAccountSectionContainer>
  );
};

export default withDatasourceCheck()<AllocationsProps>(Allocations);

export const getStaticProps: GetStaticComponentProps = async (): Promise<AlgoliaSettings> => {
  return await getGraphQLResult<AlgoliaSettings>(SEARCH_SETTINGS_QUERY_FOR_ALGOLIA);
};
