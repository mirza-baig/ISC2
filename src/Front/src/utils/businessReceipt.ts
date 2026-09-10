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
import { IN_PERSON_MODALITIES } from 'constants/index';

import { getVariantAttributes } from './cart';
import { parsePrice } from './price';
import { getCurrencySymbol } from './currencies';
import { formatDate } from './date';

const LOCATION_ATTRIBUTES = ['location', 'venue', 'city', 'location_name', 'venue_name'];

const MODALITY_ATTRIBUTE = 'modality';

const RECEIPT_ATTRIBUTES = [MODALITY_ATTRIBUTE, ...LOCATION_ATTRIBUTES];

type BuildReceiptInput = {
  order: OrderWithComputedData;
  /** Totals come from the checked-out cart, matching the confirmation screen. */
  cart: CartWithComputedData;
  buyerName: string;
  organizationName?: string;
  taxIdNumber?: string;
  intacctCustomerId?: string;
  paymentMethod?: string;
};

/** Only in-person classes carry a venue worth printing; everything else omits the row. */
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

/**
 * Flattens a bundle into its nested products so every printed row is a real product — a
 * bundle line item carries the `bundle` product type and no price of its own.
 */
const flattenLineItems = (lineItems: CartLineItem[]): CartLineItem[] =>
  lineItems.flatMap((lineItem) =>
    'products' in lineItem ? flattenLineItems(lineItem.products) : [lineItem]
  );

/** Order custom fields are the only place the checkout-entered PO details could land. */
const customField = (order: OrderWithComputedData, name: string): string | undefined =>
  order.custom?.customFieldsRaw?.find((field) => field.name === name)?.value || undefined;

export const buildBusinessReceiptData = ({
  order,
  cart,
  buyerName,
  organizationName,
  taxIdNumber,
  intacctCustomerId,
  paymentMethod,
}: BuildReceiptInput): BusinessReceiptData => {
  const currencySymbol = order.computed.currencySymbol;
  const address = order.shippingAddress;

  const billingAddressLines = [
    [address?.streetNumber, address?.streetName].filter(Boolean).join(' '),
    address?.apartment,
    [address?.city, address?.state, address?.postalCode].filter(Boolean).join(', '),
    address?.country,
  ].filter((line) => Boolean(line && line.trim()));

  return {
    orderNumber: order.orderNumber,
    orderDate: formatDate({ value: order.createdAt }),
    orderStatus: order.orderState,
    currencyCode: order.totalPrice?.currencyCode ?? '',
    organizationName,
    buyerName,
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

const addressLines = (address?: UserAddress): string[] =>
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

/**
 * Order history variant.
 *
 * `PrintableOrder` is a flatter shape than the confirmation screen's order. Everything it
 * carries (number, date, status, currency, addresses, products, totals, payment type, PO
 * number, customer order reference) maps straight across; the organization and identifier
 * rows come from the caller, since they live outside the order payload.
 *
 * `salesforceGetOrders` does not return `poNumber` / `customerOrderReference` yet, so those
 * rows fall back to the receipt's placeholder until it does. The mapping is written either
 * way, so the receipt fills in with no further change — the same reason the Order History
 * export writes those columns regardless.
 */
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
