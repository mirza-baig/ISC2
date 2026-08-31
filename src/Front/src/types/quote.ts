export type QuoteLineItem = {
  name: string;
  quantity: number;
  listPrice: string;
  discountedPrice: string;
  hasDiscount: boolean;
  tax: string;
  subtotal: string;
};

export type QuoteDocumentData = {
  organizationName?: string;
  buyerName: string;
  billingAddressLines: string[];
  shippingAddressLines: string[];
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
