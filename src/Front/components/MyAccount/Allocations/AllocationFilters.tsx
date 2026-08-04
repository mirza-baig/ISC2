import { useRef, useState } from 'react';
import clsx from 'clsx';

import { AllocationFilterState } from 'utils/allocations';
import { AllocationsLabels } from 'types/index';
import { ChevronDownIcon } from 'icons/index';

type DateFieldKey = 'createDateFrom' | 'createDateTo' | 'expirationDateFrom' | 'expirationDateTo';

type AllocationFiltersProps = {
  filters: AllocationFilterState;
  labels: AllocationsLabels;
  onChange: (next: AllocationFilterState) => void;
  onReset: () => void;
};

const isActive = (filters: AllocationFilterState) => Object.values(filters).some((v) => v !== '');

const FilterSection = ({
  isOpen,
  onToggle,
  title,
  children,
}: {
  isOpen: boolean;
  onToggle: () => void;
  title: string;
  children: React.ReactNode;
}) => (
  <div className="border-b border-gray-50">
    <div className="relative cursor-pointer" onClick={onToggle}>
      <div className="lg:w-full mx-3 lg:pr-3 py-7 lg:py-6 text-black-100 body-m text-xsm">
        <span>{title}</span>
      </div>
      <button
        className="absolute right-0 top-1/2 -translate-y-1/2 focus-isc2-green focus:rounded-md"
        tabIndex={0}
        aria-label={isOpen ? 'Collapse' : 'Expand'}
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
      >
        <ChevronDownIcon
          size={16}
          className={clsx('transition-all duration-500', isOpen && 'rotate-180')}
        />
      </button>
    </div>
    {isOpen && <div className="mx-3 pb-4">{children}</div>}
  </div>
);

const AllocationFilters = ({ filters, labels, onChange, onReset }: AllocationFiltersProps) => {
  const [openProductName, setOpenProductName] = useState(false);
  const [openOrderNumber, setOpenOrderNumber] = useState(false);
  const [openCreateDate, setOpenCreateDate] = useState(false);
  const [openExpirationDate, setOpenExpirationDate] = useState(false);
  const [badDateInputs, setBadDateInputs] = useState<Partial<Record<DateFieldKey, boolean>>>({});
  const dateRefs = useRef<Partial<Record<DateFieldKey, HTMLInputElement | null>>>({});

  const hasBadInput = Object.values(badDateInputs).some(Boolean);

  const set = (patch: Partial<AllocationFilterState>) => onChange({ ...filters, ...patch });

  const handleDateChange = (key: DateFieldKey, e: React.ChangeEvent<HTMLInputElement>) => {
    setBadDateInputs((prev) => ({ ...prev, [key]: e.target.validity.badInput }));
    set({ [key]: e.target.value });
  };

  const handleDateBlur = (key: DateFieldKey, e: React.FocusEvent<HTMLInputElement>) => {
    setBadDateInputs((prev) => ({ ...prev, [key]: e.target.validity.badInput }));
  };

  const handleReset = () => {
    setBadDateInputs({});
    Object.values(dateRefs.current).forEach((input) => {
      if (input) input.value = '';
    });
    onReset();
  };

  return (
    <>
      <div className="border-b border-gray-50">
        <div className="flex items-center justify-between lg:w-full mx-3 lg:pr-3 py-7 lg:py-6 text-black-100 body-m text-xsm">
          <span className="font-semibold">{labels.filterByLabel}</span>
          {(isActive(filters) || hasBadInput) && (
            <button
              className="text-isc2-green hover:underline body-m text-xsm"
              onClick={handleReset}
            >
              {labels.clearFiltersLabel}
            </button>
          )}
        </div>
      </div>

      <FilterSection
        isOpen={openProductName}
        onToggle={() => setOpenProductName((v) => !v)}
        title={labels.productNameFilterLabel}
      >
        <input
          type="text"
          value={filters.productName}
          placeholder={labels.productNameFilterLabel}
          onChange={(e) => set({ productName: e.target.value })}
          className="border border-gray-50 rounded-sm p-3 text-xsm body-m w-full focus:ring-isc2-green focus:outline-none"
        />
      </FilterSection>

      <FilterSection
        isOpen={openOrderNumber}
        onToggle={() => setOpenOrderNumber((v) => !v)}
        title={labels.orderNumberFilterLabel}
      >
        <input
          type="text"
          inputMode="numeric"
          value={filters.orderNumber}
          placeholder={labels.orderNumberFilterLabel}
          onChange={(e) => set({ orderNumber: e.target.value })}
          className="border border-gray-50 rounded-sm p-3 text-xsm body-m w-full focus:ring-isc2-green focus:outline-none"
        />
      </FilterSection>

      <FilterSection
        isOpen={openCreateDate}
        onToggle={() => setOpenCreateDate((v) => !v)}
        title={labels.createDateFilterLabel}
      >
        <div className="flex flex-col gap-y-2">
          <label className="body-m text-xsm text-black-100">{labels.fromDateLabel}</label>
          <input
            ref={(el) => {
              dateRefs.current.createDateFrom = el;
            }}
            type="date"
            value={filters.createDateFrom}
            onChange={(e) => handleDateChange('createDateFrom', e)}
            onBlur={(e) => handleDateBlur('createDateFrom', e)}
            className={clsx(
              'border rounded-sm p-3 text-xsm body-m w-full focus:ring-isc2-green focus:outline-none',
              badDateInputs.createDateFrom ? 'border-red-warning' : 'border-gray-50'
            )}
          />
          {badDateInputs.createDateFrom && (
            <p className="text-red-warning body-s font-semibold">{labels.invalidDateErrorLabel}</p>
          )}
          <label className="body-m text-xsm text-black-100">{labels.toDateLabel}</label>
          <input
            ref={(el) => {
              dateRefs.current.createDateTo = el;
            }}
            type="date"
            value={filters.createDateTo}
            onChange={(e) => handleDateChange('createDateTo', e)}
            onBlur={(e) => handleDateBlur('createDateTo', e)}
            className={clsx(
              'border rounded-sm p-3 text-xsm body-m w-full focus:ring-isc2-green focus:outline-none',
              badDateInputs.createDateTo ? 'border-red-warning' : 'border-gray-50'
            )}
          />
          {badDateInputs.createDateTo && (
            <p className="text-red-warning body-s font-semibold">{labels.invalidDateErrorLabel}</p>
          )}
        </div>
      </FilterSection>

      <FilterSection
        isOpen={openExpirationDate}
        onToggle={() => setOpenExpirationDate((v) => !v)}
        title={labels.expirationDateFilterLabel}
      >
        <div className="flex flex-col gap-y-2">
          <label className="body-m text-xsm text-black-100">{labels.fromDateLabel}</label>
          <input
            ref={(el) => {
              dateRefs.current.expirationDateFrom = el;
            }}
            type="date"
            value={filters.expirationDateFrom}
            onChange={(e) => handleDateChange('expirationDateFrom', e)}
            onBlur={(e) => handleDateBlur('expirationDateFrom', e)}
            className={clsx(
              'border rounded-sm p-3 text-xsm body-m w-full focus:ring-isc2-green focus:outline-none',
              badDateInputs.expirationDateFrom ? 'border-red-warning' : 'border-gray-50'
            )}
          />
          {badDateInputs.expirationDateFrom && (
            <p className="text-red-warning body-s font-semibold">{labels.invalidDateErrorLabel}</p>
          )}
          <label className="body-m text-xsm text-black-100">{labels.toDateLabel}</label>
          <input
            ref={(el) => {
              dateRefs.current.expirationDateTo = el;
            }}
            type="date"
            value={filters.expirationDateTo}
            onChange={(e) => handleDateChange('expirationDateTo', e)}
            onBlur={(e) => handleDateBlur('expirationDateTo', e)}
            className={clsx(
              'border rounded-sm p-3 text-xsm body-m w-full focus:ring-isc2-green focus:outline-none',
              badDateInputs.expirationDateTo ? 'border-red-warning' : 'border-gray-50'
            )}
          />
          {badDateInputs.expirationDateTo && (
            <p className="text-red-warning body-s font-semibold">{labels.invalidDateErrorLabel}</p>
          )}
        </div>
      </FilterSection>

      <hr className="hidden lg:block my-4 border-t border-gray-700 lg:border-b-2" />
    </>
  );
};

export default AllocationFilters;
