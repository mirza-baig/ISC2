import {
  Allocation,
  AllocationUser,
  SalesforceAllocationDetailsGetApi,
  SalesforceAllocationsGetApi,
} from 'types/profile';
import {
  ALLOCATION_USER_SUCCESS_STATUSES,
  ALLOCATION_USER_ERROR_STATUSES,
} from 'constants/account';

import { capitalize } from './string';
import { getShortIsoDate } from './date';
import { ALLOCATED_FIELDS, PRODUCT_REDEEM_MODAL_ERRORS } from 'constants/index';
import { ProductRedeemLabels } from 'components/MyAccount/ProductRedeem/ProductRedeemModal';
import { ProductScheduledModalLabels } from 'components/ProductForm/ProductForm';

export const getAllocationDetailsData = (
  data: SalesforceAllocationDetailsGetApi,
  orderNumber?: string
): Allocation => {
  const users = data?.users || [];

  return {
    id: data?.productInfo?.code,
    expirationDate: data?.expirationDate,
    expired: data?.isOrderExpired || data?.expirationDate < getShortIsoDate(new Date(), '-'),
    date: data?.orderStartDate,
    name: data?.productInfo?.name,
    completeBefore: data?.expirationDate,
    trainingProvider: data?.productInfo?.['3rdPartyPlatform'],
    trainingDate: data?.trainingDate, // TODO we do not receiving with current test data from SF - check after BE correction
    trainingMode: data?.trainingMode, // TODO we do not receiving with current test data from SF - check after BE correction
    allocationSummary: data?.allocationSummary,
    orderNumber,
    key: data?.productInfo?.key,
    sku: data?.productInfo?.sku,
    users,
  };
};

/**
 * Groups allocations by order number so each order appears once with its products.
 * Returns array of { orderNumber, products } for display.
 */
export const groupAllocationsByOrder = (allocations: Allocation[]) => {
  const orderMap = new Map<string, Allocation[]>();
  allocations.forEach((allocation) => {
    const orderNum = allocation.orderNumber || '';
    const existing = orderMap.get(orderNum) || [];
    existing.push(allocation);
    orderMap.set(orderNum, existing);
  });
  return Array.from(orderMap.entries()).map(([orderNumber, products]) => ({
    orderNumber,
    products,
  }));
};

export const getAllocationListData = (data: SalesforceAllocationsGetApi): Allocation[] => {
  return Object.entries(data)
    ?.reduce((acc, [orderId, orderProducts]) => {
      const products = orderProducts?.reduce((productAcc, productItem) => {
        return [
          ...productAcc,
          ...Object.values(productItem).map((item) => getAllocationDetailsData(item, orderId)),
        ];
      }, []);
      return [...acc, ...products];
    }, [])
    .sort((a, b) => {
      if (!(a.expirationDate || b.expirationDate)) {
        return 0;
      }
      const dateA = a.expirationDate && new Date(a.expirationDate);
      const dateB = b.expirationDate && new Date(b.expirationDate);
      return dateB > dateA ? -1 : dateA > dateB ? 1 : 0;
    })
    .sort((a, b) => {
      const availableA = Boolean(a.allocationSummary.available);
      const availableB = Boolean(b.allocationSummary.available);
      return availableB && !availableA ? 1 : availableA && !availableB ? -1 : 0;
    })
    .sort((a, b) => {
      const expiredA = a.expired;
      const expiredB = b.expired;
      return !expiredB && expiredA ? 1 : !expiredA && expiredB ? -1 : 0;
    });
};

export const getAllocationStatus = (key: keyof AllocationUser) => {
  if (ALLOCATION_USER_SUCCESS_STATUSES.includes(key)) {
    return 'success';
  }

  if (ALLOCATION_USER_ERROR_STATUSES.includes(key)) {
    return 'error';
  }

  return 'neutral';
};

export const getAllocationErrorMessage = (
  labels: ProductRedeemLabels | ProductScheduledModalLabels,
  allocationErrorCode?: PRODUCT_REDEEM_MODAL_ERRORS
) => {
  if (!allocationErrorCode) {
    return undefined;
  }

  switch (allocationErrorCode) {
    case PRODUCT_REDEEM_MODAL_ERRORS.EXPIRED:
      return labels.isExpiredLabel?.value?.toString();
    case PRODUCT_REDEEM_MODAL_ERRORS.CANCELLED:
      return labels.isCancelledLabel?.value?.toString();
    case PRODUCT_REDEEM_MODAL_ERRORS.ALREADY_ACCEPTED:
    case PRODUCT_REDEEM_MODAL_ERRORS.ALREADY_REDEEMED:
      return labels.isAllocatedLabel?.value?.toString();
    case PRODUCT_REDEEM_MODAL_ERRORS.WRONG_ID:
    case PRODUCT_REDEEM_MODAL_ERRORS.NO_CONSENT:
    case PRODUCT_REDEEM_MODAL_ERRORS.DEFAULT:
    default:
      return labels.unsuccessDescription?.value?.toString();
  }
};

export const getNumberOfAllocatedSeats = (summary: Record<string, number>) =>
  ALLOCATED_FIELDS.reduce((accum, field) => accum + summary[field], 0);

export const isAllocated = (userAllocation: Record<string, unknown>) =>
  !userAllocation['isAvailableToAllocate'] &&
  ALLOCATED_FIELDS.some((field) => userAllocation[`is${capitalize(field)}`]);

export type AllocationSortOption =
  | 'default'
  | 'availability'
  | 'expirationDate'
  | 'createDate'
  | 'orderNumber'
  | 'product';

export type AllocationFilterState = {
  productName: string;
  orderNumber: string;
  createDateFrom: string;
  createDateTo: string;
  expirationDateFrom: string;
  expirationDateTo: string;
};

export const DEFAULT_FILTER_STATE: AllocationFilterState = {
  productName: '',
  orderNumber: '',
  createDateFrom: '',
  createDateTo: '',
  expirationDateFrom: '',
  expirationDateTo: '',
};

export type SortDirection = 'asc' | 'desc';

export const filterAllocations = (
  allocations: Allocation[],
  filters: AllocationFilterState
): Allocation[] => {
  return allocations.filter((a) => {
    if (
      filters.productName &&
      !(a.name ?? '').toLowerCase().includes(filters.productName.toLowerCase())
    )
      return false;
    if (
      filters.orderNumber &&
      !(a.orderNumber || '').toLowerCase().includes(filters.orderNumber.toLowerCase())
    )
      return false;
    if (filters.createDateFrom && a.date && a.date < filters.createDateFrom) return false;
    if (filters.createDateTo && a.date && a.date > filters.createDateTo) return false;
    if (
      filters.expirationDateFrom &&
      a.expirationDate &&
      a.expirationDate < filters.expirationDateFrom
    )
      return false;
    if (filters.expirationDateTo && a.expirationDate && a.expirationDate > filters.expirationDateTo)
      return false;
    return true;
  });
};

export const sortAllocations = (
  allocations: Allocation[],
  sortBy: AllocationSortOption,
  direction: SortDirection = 'asc'
): Allocation[] => {
  const sorted = [...allocations];
  const dir = direction === 'asc' ? 1 : -1;

  switch (sortBy) {
    case 'availability':
      return sorted.sort((a, b) => {
        const availA = a.allocationSummary.available;
        const availB = b.allocationSummary.available;
        return (availA - availB) * dir;
      });
    case 'expirationDate':
      return sorted.sort((a, b) => {
        if (!a.expirationDate) return dir;
        if (!b.expirationDate) return -dir;
        return (new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime()) * dir;
      });
    case 'createDate':
      return sorted.sort((a, b) => {
        if (!a.date) return dir;
        if (!b.date) return -dir;
        return (new Date(a.date).getTime() - new Date(b.date).getTime()) * dir;
      });
    case 'orderNumber':
      return sorted.sort((a, b) => {
        const orderA = a.orderNumber || '';
        const orderB = b.orderNumber || '';
        return orderA.localeCompare(orderB) * dir;
      });
    case 'product':
      return sorted.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '') * dir);
    case 'default':
    default:
      return sorted.sort((a, b) => {
        if (a.expired !== b.expired) return a.expired ? 1 : -1;
        const aFull = !a.allocationSummary?.available;
        const bFull = !b.allocationSummary?.available;
        if (aFull !== bFull) return aFull ? 1 : -1;
        if (!a.expirationDate) return 1;
        if (!b.expirationDate) return -1;
        return (new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime()) * dir;
      });
  }
};
