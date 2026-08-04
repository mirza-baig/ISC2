import clsx from 'clsx';
import { useCallback, useEffect, useMemo, useState } from 'react';

import DateSelectorTabs from './DateSelectorTabs';
import { CloseIcon, ClassRoomIcon } from 'icons/index';
import { useDisableScroll } from 'hooks/index';
import {
  CALENDAR_TABS,
  FormAdditionalData,
  INNER_PROVIDER_KEY,
  ProductDate,
  ProductDateGroup,
  ProductHit,
  ProductHitKeyValuePair,
} from 'types/forms';
import { dateListGenerator } from 'utils/product-form';
import { useProductForm } from 'providers/productForm';

interface DateSelectorMenuProps {
  isOpen: boolean;
  onMenuClose: () => void;
  onDateConfirmed: () => void;
  formLabels: { [name: string]: string };
  activeTab: number;
  setActiveTab: (val: number) => void;
}

export default function DateSelectorMenu({
  isOpen,
  onMenuClose,
  onDateConfirmed,
  formLabels,
  activeTab,
  setActiveTab,
}: DateSelectorMenuProps) {
  const {
    confirmedDate,
    scheduleData,
    updateConfirmedDate,
    setScheduleData,
    productVariants,
    inventoryEntries,
  } = useProductForm();
  const [selectedDate, setSelectedDate] = useState<ProductDate | null>(confirmedDate);
  const addMonths = (months: number, isNextDay?: boolean): Date => {
    const result = new Date();
    const month = months > 0 ? months : 0;
    result.setMonth(result.getMonth() + month);
    if (isNextDay) {
      result.setDate(result.getDate() + 1);
    }
    return result;
  };

  useEffect(() => {
    const mappedData = new Map<number, ProductDateGroup>();
    // here is build of the structure of the tabs
    const dateTabFilter = CALENDAR_TABS.map((val) => {
      return {
        key: val.key,
        label: val.label,
        start: val.start ? addMonths(val.start) : new Date(),
        ...(val.end !== undefined && { end: addMonths(val.end) }),
      };
    });

    dateTabFilter.forEach((date) => {
      mappedData.set(date.key, {
        key: date.key,
        text: date.label,
        dates: [],
      });
    });

    productVariants?.forEach((item: ProductHit) => {
      const source = dateTabFilter.find(
        (tab) =>
          item.isoStart &&
          new Date(item.isoStart) >= tab.start &&
          (tab.end === undefined || new Date(item.isoStart) < tab.end)
      );
      const key = source?.key;
      const text = source?.label;
      const isNotThirdParty =
        !item?.trainingProvider?.key ||
        (item?.trainingProvider as ProductHitKeyValuePair)?.key === INNER_PROVIDER_KEY;
      if (key !== undefined && isNotThirdParty) {
        const data: ProductDateGroup | undefined = mappedData.get(key);
        mappedData.set(key, {
          ...data,
          key,
          text,
          dates: dateListGenerator(data?.dates, item),
        });
      }
    });
    const res = Array.from(mappedData, (data) => data[1]);
    setScheduleData(res);
    const confirmedDateSkuInResults =
      confirmedDate?.sku && productVariants?.some((val) => val.sku === confirmedDate?.sku);

    if (!confirmedDateSkuInResults) {
      updateConfirmedDate(null);
      setSelectedDate(null);
      setActiveTab(0);
    }
  }, [confirmedDate, productVariants, setActiveTab, setScheduleData, updateConfirmedDate]);

  useDisableScroll({ disable: isOpen });

  useEffect(() => {
    if (confirmedDate && isOpen) {
      setSelectedDate(confirmedDate);
    }
  }, [confirmedDate, isOpen]);

  const onConfirmDateClick = useCallback(() => {
    if (selectedDate) {
      onDateConfirmed();
      updateConfirmedDate(selectedDate);
    }
  }, [onDateConfirmed, selectedDate, updateConfirmedDate]);

  const isDisabled = useCallback(
    (sku: string) => {
      const currentItemDate = productVariants.find((item) => item?.sku == sku);
      const isCurrentItemDateExpired =
        currentItemDate?.isoStart && new Date(currentItemDate.isoStart) < new Date();

      return Boolean(
        !inventoryEntries[sku] || inventoryEntries[sku] <= 0 || isCurrentItemDateExpired
      );
    },
    [inventoryEntries, productVariants]
  );

  const onDateClick = useCallback(
    (date: ProductDate) => {
      if (isDisabled(date.sku)) {
        return;
      }
      if (selectedDate === date) {
        return setSelectedDate(null);
      }
      setSelectedDate(date);
    },
    [isDisabled, selectedDate]
  );

  const DateSelectorContent = useMemo(() => {
    const tab = scheduleData?.[activeTab];
    if (!tab?.dates?.length) {
      return (
        <div className="flex-1 w-full mb-5">
          <div className="bg-white w-full flex items-center p-4 shadow-lg rounded-lg space-x-6">
            <div className="bg-gray-50 rounded-full size-15 text-isc2-green">
              <ClassRoomIcon size={60} />
            </div>
            <div className="flex flex-col space-y-2">
              <h4 className="body-m">
                {formLabels?.[FormAdditionalData.NoDatesForSelectedOptions.key]}
              </h4>
              <h6 className="body-s">
                {formLabels?.[FormAdditionalData.ChooseAnotherTimeline.key]}
              </h6>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 overflow-y-auto py-6 flex flex-col w-full border border-gray-70 rounded-lg mb-5">
        <h4 className="body-l px-4">{formLabels?.[FormAdditionalData.ClassesDetails.key]}</h4>
        {tab.dates.map((date) => (
          <button
            type="button"
            key={date.sku}
            onClick={() => onDateClick(date)}
            className="body-m py-4 px-1 mx-4 border-b border-b-gray-50 text-left flex items-center outline-isc2-green"
            disabled={isDisabled(date.sku)}
            aria-label="Select date"
          >
            <input
              type="radio"
              disabled
              className="h-4 w-4 mr-2 pointer-events-none border checked:border-isc2-green bg-white-00 hover:text-isc2-green checked:text-isc2-green outline-none rounded-lg"
              checked={selectedDate?.sku === date.sku}
            />
            <span className={clsx('flex flex-col', isDisabled(date.sku) && 'opacity-40')}>
              <span className="font-bold">{date.text}</span>
              <span>{date.weekScheduleText}</span>
            </span>
            {inventoryEntries[date.sku] > 0 && inventoryEntries[date.sku] <= 5 && (
              <span className="pill ml-3">
                {formLabels?.[FormAdditionalData.SmallQtyWarning.key]}
              </span>
            )}
            {isDisabled(date.sku) && (
              <span className="pill ml-3">{formLabels?.[FormAdditionalData.NoQtyWarning.key]}</span>
            )}
          </button>
        ))}
      </div>
    );
  }, [
    scheduleData,
    activeTab,
    selectedDate,
    inventoryEntries,
    formLabels,
    onDateClick,
    isDisabled,
  ]);

  return (
    <div
      className={clsx(
        'h-dynamic-screen w-dynamic-screen inset-0 fixed !m-0 bg-black-50 transition-all duration-500',
        isOpen ? 'z-date-selector opacity-100' : '-z-1 opacity-0'
      )}
      role="dialog"
      aria-label="Date selector"
    >
      <section
        className={clsx(
          'h-dynamic-screen w-dynamic-screen fixed transition-all duration-500 bg-gray-10 max-md:left-0 right-0 bottom-0 top-0 md:w-547 translate-x-0 px-5 py-7 flex flex-col',
          !isOpen && '!translate-x-full'
        )}
      >
        <button
          onClick={onMenuClose}
          type="button"
          title="Close"
          className="self-end outline-isc2-green"
          aria-label="Close"
        >
          <CloseIcon size={24} />
        </button>

        <h3 className="headline-s mt-3">{formLabels?.[FormAdditionalData.SelectDates.key]}</h3>

        <DateSelectorTabs
          tabs={scheduleData}
          activeTab={activeTab}
          onActiveTabChange={setActiveTab}
        />

        {DateSelectorContent}

        <button
          type="button"
          className="primary-cta"
          onClick={onConfirmDateClick}
          disabled={!selectedDate?.sku}
          aria-label={formLabels?.[FormAdditionalData.ConfirmDateSelection.key]}
        >
          {formLabels?.[FormAdditionalData.ConfirmDateSelection.key]}
        </button>
      </section>
    </div>
  );
}
