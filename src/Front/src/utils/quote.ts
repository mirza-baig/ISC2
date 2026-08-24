import {
  CartLineItem,
  CartWithComputedData,
  LineItem,
  PersonalInformation,
  QuoteDocumentData,
  QuoteLineItem,
  TypedMoney,
} from 'types/index';

import { formatMoneyWithCurrencyCode } from './price';
import { formatDate } from './date';

const formatMoney = (currencyCode: string, money?: TypedMoney) =>
  formatMoneyWithCurrencyCode(currencyCode, money);

const buildQuoteLineItem = (lineItem: CartLineItem, currencyCode: string): QuoteLineItem => {
  const listPrice = 'price' in lineItem ? lineItem.price.value : undefined;
  const discounted = 'price' in lineItem ? lineItem.price.discounted?.value : undefined;
  const tax = 'taxedPrice' in lineItem ? lineItem.taxedPrice?.totalTax : undefined;
  const total = 'totalPrice' in lineItem ? lineItem.totalPrice : undefined;

  return {
    name: lineItem.name,
    quantity: lineItem.quantity ?? 1,
    listPrice: formatMoney(currencyCode, listPrice),
    ...(discounted && { discountedPrice: formatMoney(currencyCode, discounted) }),
    tax: formatMoney(currencyCode, tax),
    subtotal: formatMoney(currencyCode, total ?? discounted ?? listPrice),
  };
};

/**
 * Flattens a bundle into its nested products so every printed row is a real product — a
 * bundle line item carries the `bundle` product type and no price of its own.
 */
const flattenLineItems = (lineItems: CartLineItem[]): LineItem[] =>
  lineItems.flatMap((lineItem) =>
    'products' in lineItem ? flattenLineItems(lineItem.products) : [lineItem]
  );

const addressLines = (address?: PersonalInformation['billingAddress']): string[] =>
  [
    address?.street,
    address?.streetTwo,
    [address?.city, address?.stateCode, address?.postalCode].filter(Boolean).join(', '),
    address?.countryCode,
  ].filter((line): line is string => Boolean(line && line.trim()));

type BuildQuoteDataInput = {
  cart: CartWithComputedData;
  personalInformation?: PersonalInformation;
  organizationName?: string;
};

/**
 * Assembles everything the quote PDF renders from the current cart and checkout Step
 * One data. Called fresh on every "Download Quote" click, so a buyer who edits products
 * or quantities and downloads again always gets a quote reflecting the live cart —
 * there is no separate "stale quote" state to invalidate.
 */
export const buildQuoteData = ({
  cart,
  personalInformation,
  organizationName,
}: BuildQuoteDataInput): QuoteDocumentData => {
  const currencyCode = cart.computed.currencyCode || 'USD';
  const billingAddress = personalInformation?.billingAddress;
  const shippingAddress = personalInformation?.isSameAddress
    ? billingAddress
    : personalInformation?.mailingAddress || billingAddress;

  const buyerName = [personalInformation?.firstName, personalInformation?.lastName]
    .filter(Boolean)
    .join(' ');

  return {
    organizationName,
    buyerName,
    billingAddressLines: addressLines(billingAddress),
    shippingAddressLines: addressLines(shippingAddress),
    createdDate: formatDate({ value: new Date().toISOString() }),
    currencyCode,
    lineItems: flattenLineItems(cart.lineItems ?? []).map((lineItem) =>
      buildQuoteLineItem(lineItem, currencyCode)
    ),
    // computed.subtotal/taxValue/totalPrice are already display-ready decimal strings
    // (see getComputedFieldsFromCart in utils/cart) — not cent amounts, so they're
    // prefixed directly rather than run back through formatMoney.
    subtotal: `${currencyCode} ${(cart.computed.subtotal ?? 0).toFixed(2)}`,
    tax: `${currencyCode} ${cart.computed.taxValue ?? '0.00'}`,
    total: `${currencyCode} ${cart.computed.totalPrice ?? '0.00'}`,
  };
};
