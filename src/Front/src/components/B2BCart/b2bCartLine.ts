import {
  getPickedProductFromBundleLine,
  getVariantAttributes,
  isBundleLineItem,
} from 'utils/index';
import type { CartLineItem } from 'types/index';

import { buildAnswersKey } from '../Search/B2BPrivateClassContext';
import { hasSessionStarted } from '../Search/b2bDates';

export const isTrainingProduct = (...values: (string | undefined)[]): boolean =>
  values.some((value) => value && /training|course|class|exam|bootcamp|seminar/i.test(value));

export const hasLineSessionStarted = (item: CartLineItem): boolean => {
  const attributes = getVariantAttributes(item.variant) as Record<string, string | undefined>;
  return hasSessionStarted({
    startDate: attributes.start_date,
    startTime: attributes.start_time,
    timeZone: attributes.time_zone_iana || attributes.time_zone,
  });
};

export const hasBlockingLines = (items: CartLineItem[]): boolean =>
  items.some(hasLineSessionStarted);

export const getLineDisplayName = (item: CartLineItem): string => {
  const attributes = getVariantAttributes(item.variant) as Record<string, string | undefined>;
  return attributes.copy_name || attributes.name || item.name;
};

export const getLineAnswersKey = (item: CartLineItem): string => {
  if (isBundleLineItem(item)) {
    return buildAnswersKey(item.bundleSku, getPickedProductFromBundleLine(item)?.variant?.sku);
  }
  return item.variant?.sku ?? item.id;
};
