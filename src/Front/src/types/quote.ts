/** One product row on the eCommerce quote PDF. */
export type QuoteLineItem = {
  name: string;
  quantity: number;
  /** Undiscounted unit price, pre-formatted for display (e.g. "USD 712.50"). */
  listPrice: string;
  /** Discounted unit price, present only when the line actually carries a discount. */
  discountedPrice?: string;
  tax: string;
  subtotal: string;
};

/**
 * Deliberately carries no quote number and no expiration date — MVP eCommerce carts are
 * real-time and don't expire, unlike the Salesforce CPQ quotes this replaces.
 */
export type QuoteDocumentData = {
  organizationName?: string;
  buyerName: string;
  billingAddressLines: string[];
  shippingAddressLines: string[];
  /** Formatted for display; the cart has no expiration in the eCommerce flow. */
  createdDate: string;
  currencyCode: string;
  lineItems: QuoteLineItem[];
  subtotal: string;
  tax: string;
  total: string;
};

export type QuoteDocumentLabels = {
  documentTitle?: string;
  createdDateLabel?: string;
  billToLabel?: string;
  shipToLabel?: string;
  buyerNameLabel?: string;
  productColumnLabel?: string;
  quantityColumnLabel?: string;
  listPriceColumnLabel?: string;
  discountedPriceColumnLabel?: string;
  taxColumnLabel?: string;
  subtotalColumnLabel?: string;
  subtotalLabel?: string;
  taxLabel?: string;
  totalLabel?: string;
  footerNote?: string;
  downloadQuoteCtaLabel?: string;
};
