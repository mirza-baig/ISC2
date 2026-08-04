import { Link, LinkField } from '@sitecore-jss/sitecore-jss-nextjs';
import { format, isBefore, parseISO, startOfToday } from 'date-fns';
import { useMemo } from 'react';
import { ProductThumbnail } from './ProductThumbnail';
import clsx from 'clsx';

import { AllocationsLabels, Allocation as TAllocation } from 'types/profile';
import { ALLOCATION_DETAIL_ORDER_NUMBER, ALLOCATION_DETAIL_PRODUCT_SKU } from 'constants/index';
import { getNumberOfAllocatedSeats } from 'utils/allocations';

export namespace Allocation {
  export type Props = {
    allocation: TAllocation;
    labels: AllocationsLabels;
    allocationDetailsCta?: LinkField;
    className?: string;
    withAllocationBorders?: boolean;
    icon?: string;
    imagesAreLoading?: boolean;
    hideOrderNumber?: boolean;
  };
}

export function Allocation({
  allocation,
  labels,
  allocationDetailsCta,
  className,
  withAllocationBorders = true,
  icon,
  imagesAreLoading = false,
  hideOrderNumber = false,
}: Allocation.Props) {
  const { total } = allocation.allocationSummary;
  const allocated = getNumberOfAllocatedSeats(allocation.allocationSummary);
  const showCompleteBeforeLabel =
    Boolean(allocation.completeBefore) &&
    !isBefore(parseISO(allocation.completeBefore), startOfToday());
  const completeBefore = allocation?.completeBefore
    ? format(parseISO(allocation?.completeBefore), 'MMM dd yyyy')
    : '';

  const date = allocation.date ? format(parseISO(allocation?.date), 'MM/dd/yyyy') : '';

  const allocationsDetailsUrl = useMemo(() => {
    if (allocationDetailsCta?.value) {
      const allocationsDetailsUrl = new URL(
        `${window.location.origin}${allocationDetailsCta.value.href}`
      );

      allocationsDetailsUrl.searchParams.set(ALLOCATION_DETAIL_PRODUCT_SKU, `${allocation.sku}`);
      allocationsDetailsUrl.searchParams.set(
        ALLOCATION_DETAIL_ORDER_NUMBER,
        `${allocation?.orderNumber}`
      );

      return allocationsDetailsUrl.toString();
    }

    return '';
  }, [allocation, allocationDetailsCta?.value]);

  return (
    <li
      className={clsx(
        'w-full flex flex-col items-start md:flex-row md:items-center py-8 first:pt-2',
        className
      )}
    >
      {showCompleteBeforeLabel && (
        <label className="text-xs font-bold block md:hidden">
          {labels.completeAllocationBeforeLabel.replace('{expiryDate}', completeBefore)}
        </label>
      )}

      {allocation.expired && (
        <div className="warning-pill block md:hidden">{labels.expiredFlagLabel}</div>
      )}

      <div className="flex flex-col w-full sm:flex-row gap-5">
        <div className="flex w-full items-start md:items-center space-x-2 md:space-x-5">
          <div className="w-20 md:w-30">
            {!imagesAreLoading && (
              <ProductThumbnail
                src={icon}
                alt={allocation.name}
                className="w-20 md:w-30 aspect-square"
              />
            )}
          </div>

          <div className="flex flex-col space-y-2 flex-1 break-all">
            {showCompleteBeforeLabel && (
              <label className="text-xs font-bold hidden md:block">
                {labels.completeAllocationBeforeLabel.replace('{expiryDate}', completeBefore)}
              </label>
            )}
            {allocation.expired && (
              <div className="warning-pill hidden md:block">{labels.expiredFlagLabel}</div>
            )}
            <div className="flex flex-col space-y-1">
              <p className="body-m xl:body-l">{allocation.name}</p>
              <p className="body-s xl:body-m text-gray-90 divide-x divide-gray-50 space-x-3">
                {allocation.trainingProvider && <label>{allocation.trainingProvider}</label>}
                {allocation.trainingMode && (
                  <label className="pl-3">{allocation.trainingMode}</label>
                )}
                {allocation.trainingDate && (
                  <label className="pl-3">{allocation.trainingDate}</label>
                )}
              </p>
            </div>
            <label className="text-xs text-gray-90 divide-x divide-gray-50 space-x-3">
              {!hideOrderNumber && allocation.orderNumber && (
                <label>
                  {labels.orderLabel}: #{allocation.orderNumber}
                </label>
              )}
              {date && (
                <label className={!hideOrderNumber && allocation.orderNumber ? 'pl-3' : ''}>
                  {labels.dateLabel}: {date}
                </label>
              )}
            </label>
          </div>
        </div>

        <div className="flex items-center gap-5 max-sm:self-center max-sm:flex-wrap max-sm:justify-center sm:gap-2 lg:gap-5">
          <div
            className={clsx(
              'flex flex-col justify-center text-center text-isc2-green w-178',
              withAllocationBorders && 'lg:border-x lg:border-gray-50'
            )}
          >
            <label className="text-3xl font-thin">
              {labels.allocationNumberLabel
                .replace('{allocatedNumber}', `${allocated}`)
                .replace('{availableNumber}', `${total}`)}
            </label>
            <label className="text-xs font-bold -mt-1">{labels.allocatedLabel}</label>
          </div>

          {allocationsDetailsUrl && (
            <Link
              field={{ text: allocationDetailsCta?.value.text, href: allocationsDetailsUrl }}
              className="primary-cta text-center whitespace-nowrap"
            />
          )}
        </div>
      </div>
    </li>
  );
}
