/** One product row on the eCommerce quote PDF. */
export type QuoteLineItem = {
  name: string;
  quantity: number;
  /** Undiscounted unit price, pre-formatted for display (e.g. "USD 712.50"). */
  listPrice: string;
  /**
   * Always populated — equal to `listPrice` when the line has no discount, so the
   * "Your Price" column shows a real price rather than a dash.
   */
  discountedPrice: string;
  /** True only when discountedPrice actually differs from listPrice — governs the
   *  strikethrough on List Price. */
  hasDiscount: boolean;
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
  /** Placeholder until Legal supplies the real copy; rendered at the bottom of the PDF. */
  disclaimerText?: string;
};

export type QuoteSitecoreFields = {
  QuoteDocumentTitle?: string;
  QuoteCreatedDateLabel?: string;
  QuoteBillToLabel?: string;
  QuoteShipToLabel?: string;
  QuoteBuyerNameLabel?: string;
  QuoteProductColumnLabel?: string;
  QuoteQuantityColumnLabel?: string;
  QuoteListPriceColumnLabel?: string;
  QuoteDiscountedPriceColumnLabel?: string;
  QuoteTaxColumnLabel?: string;
  QuoteSubtotalColumnLabel?: string;
  QuoteSubtotalLabel?: string;
  QuoteTaxLabel?: string;
  QuoteTotalLabel?: string;
  QuoteFooterNote?: string;
  QuoteDownloadQuoteCtaLabel?: string;
  QuoteDisclaimerText?: string;
};
