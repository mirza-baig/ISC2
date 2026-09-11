import { getCountryByNameOrShortName, getProvinceByNameOrShortName } from 'node-countries';

import {
  CartAddress,
  CartLineItem,
  CartWithComputedData,
  LineItem,
  PersonalInformation,
  QuoteDocumentData,
  QuoteDocumentLabels,
  QuoteLineItem,
  QuoteSitecoreFields,
  TypedMoney,
} from 'types/index';

import { formatMoneyWithCurrencyCode } from './price';
import { formatDate } from './date';
import { getVariantAttributes } from './cart';

const formatMoney = (currencyCode: string, money?: TypedMoney) =>
  formatMoneyWithCurrencyCode(currencyCode, money);

const resolveLineItemName = (lineItem: CartLineItem): string => {
  const attributes = getVariantAttributes(lineItem.variant);

  return attributes.copy_name || attributes.name || lineItem.name;
};

const resolveChildSku = (lineItem: LineItem): string =>
  (lineItem as { variant?: { sku?: string } }).variant?.sku ?? resolveLineItemName(lineItem);

const buildQuoteLineItem = (lineItem: CartLineItem, currencyCode: string): QuoteLineItem => {
  const listPrice = 'price' in lineItem ? lineItem.price.value : undefined;
  const discountedPerQuantity =
    'discountedPricePerQuantity' in lineItem ? lineItem.discountedPricePerQuantity : undefined;
  const discounted =
    ('price' in lineItem ? lineItem.price.discounted?.value : undefined) ??
    discountedPerQuantity?.[0]?.discountedPrice?.value;
  const tax = 'taxedPrice' in lineItem ? lineItem.taxedPrice?.totalTax : undefined;
  const total = 'totalPrice' in lineItem ? lineItem.totalPrice : undefined;

  return {
    name: resolveLineItemName(lineItem),
    quantity: lineItem.quantity ?? 1,
    listPrice: formatMoney(currencyCode, listPrice),
    discountedPrice: formatMoney(currencyCode, discounted ?? listPrice),
    hasDiscount: Boolean(discounted),
    tax: formatMoney(currencyCode, tax),
    subtotal: formatMoney(currencyCode, total ?? discounted ?? listPrice),
  };
};

const buildBundleQuoteLineItem = (
  bundleLineItem: CartLineItem & { products: LineItem[] },
  currencyCode: string
): QuoteLineItem => {
  const listPrice = 'price' in bundleLineItem ? bundleLineItem.price.value : undefined;
  const discounted = 'price' in bundleLineItem ? bundleLineItem.price.discounted?.value : undefined;
  const bundleTotal = 'totalPrice' in bundleLineItem ? bundleLineItem.totalPrice : undefined;

  const bundleTaxCents = bundleLineItem.products.reduce((sum, child) => {
    const childTax = 'taxedPrice' in child ? child.taxedPrice?.totalTax?.centAmount ?? 0 : 0;
    return sum + childTax;
  }, 0);

  const taxMoney: TypedMoney | undefined = bundleTaxCents
    ? ({
        type: 'centPrecision',
        centAmount: bundleTaxCents,
        currencyCode,
        fractionDigits: bundleLineItem.products[0]
          ? 'taxedPrice' in bundleLineItem.products[0]
            ? bundleLineItem.products[0].taxedPrice?.totalTax?.fractionDigits ?? 2
            : 2
          : 2,
      } as TypedMoney)
    : undefined;

  return {
    name: resolveLineItemName(bundleLineItem),
    quantity: bundleLineItem.quantity ?? 1,
    listPrice: formatMoney(currencyCode, listPrice),
    discountedPrice: formatMoney(currencyCode, discounted ?? listPrice),
    hasDiscount: Boolean(discounted),
    tax: formatMoney(currencyCode, taxMoney),
    subtotal: formatMoney(currencyCode, bundleTotal ?? discounted ?? listPrice),
    children: bundleLineItem.products.map((child) => ({
      name: resolveLineItemName(child as CartLineItem),
      sku: resolveChildSku(child),
    })),
  };
};

const buildQuoteLineItems = (lineItems: CartLineItem[], currencyCode: string): QuoteLineItem[] =>
  lineItems.map((lineItem) =>
    'products' in lineItem
      ? buildBundleQuoteLineItem(lineItem as CartLineItem & { products: LineItem[] }, currencyCode)
      : buildQuoteLineItem(lineItem, currencyCode)
  );

export const mapQuoteLabelsFromSitecoreFields = (
  fields: QuoteSitecoreFields
): QuoteDocumentLabels => ({
  documentTitle: fields.QuoteDocumentTitle,
  createdDateLabel: fields.QuoteCreatedDateLabel,
  billToLabel: fields.QuoteBillToLabel,
  shipToLabel: fields.QuoteShipToLabel,
  buyerNameLabel: fields.QuoteBuyerNameLabel,
  productColumnLabel: fields.QuoteProductColumnLabel,
  quantityColumnLabel: fields.QuoteQuantityColumnLabel,
  listPriceColumnLabel: fields.QuoteListPriceColumnLabel,
  discountedPriceColumnLabel: fields.QuoteDiscountedPriceColumnLabel,
  taxColumnLabel: fields.QuoteTaxColumnLabel,
  subtotalColumnLabel: fields.QuoteSubtotalColumnLabel,
  subtotalLabel: fields.QuoteSubtotalLabel,
  taxLabel: fields.QuoteTaxLabel,
  totalLabel: fields.QuoteTotalLabel,
  footerNote: fields.QuoteFooterNote,
  downloadQuoteCtaLabel: fields.QuoteDownloadQuoteCtaLabel,
});

const resolveCountryName = (countryCode?: string): string | undefined => {
  if (!countryCode) {
    return undefined;
  }

  return getCountryByNameOrShortName(countryCode)?.name || countryCode;
};

const resolveStateName = (countryCode?: string, stateCode?: string): string | undefined => {
  if (!stateCode) {
    return undefined;
  }

  const country = countryCode ? getCountryByNameOrShortName(countryCode) : undefined;

  if (!country) {
    return stateCode;
  }

  return getProvinceByNameOrShortName(country, stateCode)?.name || stateCode;
};

/** Cart addresses (billing/shipping) come back from commercetools as streetName/state/country. */
const addressLinesFromCart = (address?: CartAddress): string[] => {
  const stateName = resolveStateName(address?.country, address?.state);
  const countryName = resolveCountryName(address?.country);

  return [
    address?.streetName,
    [address?.city, stateName, address?.postalCode].filter(Boolean).join(', '),
    countryName,
  ].filter((line): line is string => Boolean(line && line.trim()));
};

/**
 * The Salesforce account's address (from accountContactRelations) uses the checkout
 * form's Address shape instead — street/streetTwo/stateCode/countryCode.
 */
const addressLinesFromAddress = (address?: PersonalInformation['billingAddress']): string[] => {
  const stateName = resolveStateName(address?.countryCode, address?.stateCode);
  const countryName = resolveCountryName(address?.countryCode);

  return [
    address?.street,
    address?.streetTwo,
    [address?.city, stateName, address?.postalCode].filter(Boolean).join(', '),
    countryName,
  ].filter((line): line is string => Boolean(line && line.trim()));
};

type BuildQuoteDataInput = {
  cart: CartWithComputedData;
  personalInformation?: PersonalInformation;
  organizationName?: string;
  /**
   * The selected B2B account's Salesforce shipping address (accountContactRelations) —
   * the authoritative Ship To for a business purchase, independent of whatever ended up
   * on the commercetools cart. Bill To mirrors it when the buyer checked "same as
   * shipping"; otherwise Bill To is whatever was entered on the checkout form. Undefined
   * for an individual/B2C buyer, who has no account — the cart's own shipping address is
   * used in that case, as before.
   */
  accountShippingAddress?: PersonalInformation['billingAddress'];
};

export const buildQuoteData = ({
  cart,
  personalInformation,
  organizationName,
  accountShippingAddress,
}: BuildQuoteDataInput): QuoteDocumentData => {
  const currencyCode = cart.computed.currencyCode || 'USD';

  const buyerName = [personalInformation?.firstName, personalInformation?.lastName]
    .filter(Boolean)
    .join(' ');

  const shippingAddressLines = accountShippingAddress
    ? addressLinesFromAddress(accountShippingAddress)
    : addressLinesFromCart(cart.shippingAddress);

  // Read from the checkout form's own billing address rather than the cart's — the
  // service layer's Cart type isn't confirmed to expose a separate billingAddress field,
  // and this value is already the same one the buyer entered/confirmed at checkout.
  const billingAddressLines = personalInformation?.isSameAddress
    ? shippingAddressLines
    : addressLinesFromAddress(personalInformation?.billingAddress);

  return {
    organizationName,
    buyerName,
    billingAddressLines,
    shippingAddressLines,
    createdDate: formatDate({ value: new Date().toISOString() }),
    currencyCode,
    lineItems: buildQuoteLineItems(cart.lineItems ?? [], currencyCode),
    subtotal: `${currencyCode} ${(cart.computed.subtotal ?? 0).toFixed(2)}`,
    tax: `${currencyCode} ${cart.computed.taxValue ?? '0.00'}`,
    total: `${currencyCode} ${cart.computed.totalPrice ?? '0.00'}`,
  };
};
