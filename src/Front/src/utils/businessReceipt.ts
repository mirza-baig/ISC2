import {
  BusinessReceiptData,
  CartLineItem,
  CartWithComputedData,
  OrderWithComputedData,
  PrintableOrder,
  ReceiptLineItem,
  TypedMoney,
  UserAddress,
} from 'types/index';
import { IN_PERSON_MODALITIES, LOCALSTORAGE_KEYS } from 'constants/index';

import { parseCustomFieldValue } from 'hooks/cart/cartCustomFields';

import { getVariantAttributes } from './cart';
import { parsePrice } from './price';
import { getCurrencySymbol } from './currencies';
import { formatDate } from './date';

const LOCATION_ATTRIBUTES = ['location', 'venue', 'city', 'location_name', 'venue_name'];

const MODALITY_ATTRIBUTE = 'modality';

const RECEIPT_ATTRIBUTES = [MODALITY_ATTRIBUTE, ...LOCATION_ATTRIBUTES];

type BuildReceiptInput = {
  order: OrderWithComputedData;
  cart: CartWithComputedData;
  buyerName: string;
  organizationName?: string;
  taxIdNumber?: string;
  intacctCustomerId?: string;
  paymentMethod?: string;
  enteredBillingAddress?: Partial<UserAddress>;
};

export const storeCheckoutBillingAddress = (address?: Partial<UserAddress>) => {
  if (typeof window === 'undefined' || !address?.street) {
    return;
  }

  try {
    localStorage.setItem(LOCALSTORAGE_KEYS.CHECKOUT_BILLING_ADDRESS, JSON.stringify(address));
  } catch {}
};

export const readCheckoutBillingAddress = (): Partial<UserAddress> | undefined => {
  if (typeof window === 'undefined') {
    return undefined;
  }

  try {
    const stored = localStorage.getItem(LOCALSTORAGE_KEYS.CHECKOUT_BILLING_ADDRESS);

    return stored ? (JSON.parse(stored) as Partial<UserAddress>) : undefined;
  } catch {
    return undefined;
  }
};

const resolveLocation = (attributes: Record<string, string>): string | undefined => {
  const modality = (attributes[MODALITY_ATTRIBUTE] || '').toLowerCase();

  if (!IN_PERSON_MODALITIES.some((value) => modality.includes(value))) {
    return undefined;
  }

  return LOCATION_ATTRIBUTES.map((name) => attributes[name]).find(Boolean);
};

const HTML_ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&nbsp;': ' ',
};

export const toReceiptPlainText = (value?: string): string | undefined => {
  if (!value) {
    return undefined;
  }

  const text = value
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/(p|div|li|h[1-6])>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&[a-z]+;|&#\d+;/gi, (entity) => HTML_ENTITIES[entity.toLowerCase()] ?? entity)
    .replace(/\s+/g, ' ')
    .trim();

  return text || undefined;
};

const formatMoney = (currencySymbol: string, money?: TypedMoney) =>
  `${currencySymbol}${parsePrice(money?.centAmount, money?.fractionDigits)}`;

/**
 * Payment methods arrive as raw service-layer identifiers ("card",
 * "preapproved_credit"), which read as unfinished on a formal document.
 */
const formatPaymentMethod = (value?: string) =>
  value
    ?.replace(/[_-]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase()) || undefined;

const buildLineItem = (lineItem: CartLineItem, currencySymbol: string): ReceiptLineItem => {
  const attributes = getVariantAttributes(lineItem.variant, RECEIPT_ATTRIBUTES);

  const listPrice = 'price' in lineItem ? lineItem.price.value : undefined;
  const discounted = 'price' in lineItem ? lineItem.price.discounted?.value : undefined;
  const total = 'totalPrice' in lineItem ? lineItem.totalPrice : undefined;

  return {
    name: lineItem.name,
    location: resolveLocation(attributes),
    quantity: lineItem.quantity ?? 1,
    listPrice: formatMoney(currencySymbol, listPrice),
    discountedPrice: formatMoney(currencySymbol, discounted ?? listPrice),
    hasDiscount: Boolean(discounted),
    subtotal: formatMoney(currencySymbol, total ?? discounted ?? listPrice),
  };
};

const flattenLineItems = (lineItems: CartLineItem[]): CartLineItem[] =>
  lineItems.flatMap((lineItem) =>
    'products' in lineItem ? flattenLineItems(lineItem.products) : [lineItem]
  );

const customField = (order: OrderWithComputedData, name: string): string | undefined => {
  const value = order.custom?.customFieldsRaw?.find((field) => field.name === name)?.value;

  return value === undefined || value === null
    ? undefined
    : parseCustomFieldValue(String(value)) || undefined;
};

export const buildBusinessReceiptData = ({
  order,
  cart,
  buyerName,
  organizationName,
  taxIdNumber,
  intacctCustomerId,
  paymentMethod,
  enteredBillingAddress,
}: BuildReceiptInput): BusinessReceiptData => {
  const currencySymbol = order.computed.currencySymbol;
  const address = order.shippingAddress;

  const orderAddressLines = [
    [address?.streetNumber, address?.streetName].filter(Boolean).join(' '),
    address?.apartment,
    [address?.city, address?.state, address?.postalCode].filter(Boolean).join(', '),
    address?.country,
  ].filter((line) => Boolean(line && line.trim()));
  const enteredAddressLines = addressLines(enteredBillingAddress);
  const billingAddressLines = enteredAddressLines.length ? enteredAddressLines : orderAddressLines;

  return {
    orderNumber: order.orderNumber,
    orderDate: formatDate({ value: order.createdAt }),
    orderStatus: order.orderState,
    currencyCode: order.totalPrice?.currencyCode ?? '',
    organizationName: customField(order, 'organization') || organizationName,
    buyerName: customField(order, 'buyer') || buyerName,
    buyerEmail: order.customerEmail,
    billingAddressLines,
    poNumber: customField(order, 'poNumber'),
    customerOrderReference: customField(order, 'customerOrderReference'),
    taxIdNumber,
    intacctCustomerId,
    lineItems: flattenLineItems(cart.lineItems ?? []).map((lineItem) =>
      buildLineItem(lineItem, currencySymbol)
    ),
    subtotal: `${currencySymbol}${cart.computed.subtotal?.toFixed(2) ?? '0.00'}`,
    tax: `${currencySymbol}${cart.computed.taxValue ?? '0.00'}`,
    total: `${currencySymbol}${cart.computed.totalPrice}`,
    paymentMethod: formatPaymentMethod(paymentMethod),
  };
};

const addressLines = (address?: Partial<UserAddress>): string[] =>
  [
    address?.street,
    address?.streetTwo,
    [address?.city, address?.state || address?.stateCode, address?.postalCode]
      .filter(Boolean)
      .join(', '),
    address?.country || address?.countryCode,
  ].filter((line): line is string => Boolean(line && line.trim()));

type BuildFromPrintableOrderInput = {
  order: PrintableOrder;
  buyerName: string;
  buyerEmail: string;
  organizationName?: string;
  taxIdNumber?: string;
  intacctCustomerId?: string;
};

export const buildBusinessReceiptDataFromPrintableOrder = ({
  order,
  buyerName,
  buyerEmail,
  organizationName,
  taxIdNumber,
  intacctCustomerId,
}: BuildFromPrintableOrderInput): BusinessReceiptData => {
  const currencyCode = order.orderTotal?.currencyCode ?? '';
  const currencySymbol = getCurrencySymbol(currencyCode || 'USD');
  const billingAddress = order.isSameAddress ? order.mailingAddress : order.billingAddress;

  return {
    orderNumber: order.orderId,
    orderDate: formatDate({ value: order.orderDate }),
    orderStatus: order.orderStatus,
    currencyCode,
    organizationName,
    buyerName,
    buyerEmail,
    billingAddressLines: addressLines(billingAddress ?? order.mailingAddress),
    poNumber: order.poNumber,
    customerOrderReference: order.customerOrderReference,
    taxIdNumber,
    intacctCustomerId,
    lineItems: (order.products ?? []).map((product) => ({
      name: product.productItemName,
      quantity: product.productQuantity ?? 1,
      listPrice: formatMoney(currencySymbol, product.productItemPrice),
      discountedPrice: formatMoney(currencySymbol, product.productItemPrice),
      hasDiscount: false,
      subtotal: formatMoney(currencySymbol, product.productItemPrice),
    })),
    subtotal: formatMoney(currencySymbol, order.subTotal),
    tax: formatMoney(currencySymbol, order.tax),
    total: formatMoney(currencySymbol, order.orderTotal),
    paymentMethod: formatPaymentMethod(order.paymentType),
  };
};
