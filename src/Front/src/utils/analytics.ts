import { CartDiscount, CUSTOMER_PRICING_GROUP_MAP, StandalonePriceMapping } from 'types/index';
import { calculateDiscount, parsePriceFromMoney } from './price';
import { PriceForRole } from 'providers/index';
import { FREE_PRICE } from 'constants/index';

export const formatAnalyticsPrice = ({
  prices,
  showPriceForRole,
}: {
  prices?: StandalonePriceMapping['key'];
  showPriceForRole: PriceForRole;
}) => {
  const defaultPricing = {
    price: undefined,
    discount: undefined,
  };

  if (!prices) {
    return defaultPricing;
  }

  const regularPrice = prices[CUSTOMER_PRICING_GROUP_MAP.NON_MEMBERS];
  const candidatePrice = prices[CUSTOMER_PRICING_GROUP_MAP.CANDIDATES];
  const memberPrice = prices[CUSTOMER_PRICING_GROUP_MAP.MEMBERS];
  const associatePrice = prices[CUSTOMER_PRICING_GROUP_MAP.ASSOCIATES];

  if (Boolean(regularPrice) && showPriceForRole.forRegularUser) {
    return {
      price: parsePriceFromMoney(regularPrice.discounted?.value || regularPrice.value, 1),
      discount: calculateDiscount(regularPrice.value, regularPrice.discounted?.value),
    };
  }

  if (Boolean(candidatePrice) && showPriceForRole.forCandidateUser) {
    return {
      price: parsePriceFromMoney(candidatePrice.discounted?.value || candidatePrice.value, 1),
      discount: calculateDiscount(
        candidatePrice.value,
        candidatePrice.discounted?.value,
        regularPrice?.discounted?.value || regularPrice?.value
      ),
    };
  }

  if (Boolean(memberPrice) && showPriceForRole.forMemberUser) {
    return {
      price: parsePriceFromMoney(memberPrice.discounted?.value || memberPrice.value, 1),
      discount: calculateDiscount(
        memberPrice.value,
        memberPrice.discounted?.value,
        regularPrice?.discounted?.value || regularPrice?.value
      ),
    };
  }

  if (Boolean(associatePrice) && showPriceForRole.forAssociateUser) {
    return {
      price: parsePriceFromMoney(associatePrice.discounted?.value || associatePrice.value, 1),
      discount: calculateDiscount(
        associatePrice.value,
        associatePrice.discounted?.value,
        regularPrice?.discounted?.value || regularPrice?.value
      ),
    };
  }

  return defaultPricing;
};

export const formatAnalyticsCouponCodes = (discountCodes: CartDiscount[] | null | undefined) => {
  return discountCodes?.length
    ? discountCodes
        .map((item) => item.discountCode?.code)
        .filter(Boolean)
        .join(',')
    : undefined;
};

export const buildPurchaseEcommercePayload = ({
  transactionId,
  currencyCode,
  subtotal,
  taxValue,
  mappedItems,
  discountCodes,
}: {
  transactionId: string | undefined;
  currencyCode: string | undefined;
  subtotal: string | number | undefined;
  taxValue: string | number | undefined;
  mappedItems: unknown[] | undefined;
  discountCodes: CartDiscount[] | null | undefined;
}) => {
  const coupon = formatAnalyticsCouponCodes(discountCodes);
  return {
    transaction_id: transactionId,
    currency: currencyCode,
    value: Number(subtotal),
    tax: Number(taxValue) || Number(FREE_PRICE),
    items: mappedItems,
    ...(coupon !== undefined && { coupon }),
  };
};

export const getListIdAndNameFromURL = (): { item_list_id: string; item_list_name: string } => {
  if (typeof window === 'undefined') {
    return { item_list_id: 'training', item_list_name: 'Training' };
  }
  const { pathname, hash } = window.location;

  const pathParts = pathname
    .replace(/^\/+|\/+$/g, '')
    .split('/')
    .filter(Boolean);

  const item_list_id = pathParts.length > 0 ? pathParts.join('-').toLowerCase() : 'home';

  const toTitleCase = (str: string) =>
    str
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

  let item_list_name = pathParts.map(toTitleCase).join(' ');

  if (hash) {
    const decodedHash = decodeURIComponent(hash.replace('#', ''));
    if (decodedHash) {
      item_list_name = item_list_name ? `${item_list_name} - ${decodedHash}` : decodedHash;
    }
  }

  return { item_list_id, item_list_name };
};
