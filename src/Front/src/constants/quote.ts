/**
 * Fallbacks for the eCommerce quote PDF. No quote number, no expiration date — MVP
 * carts are real-time and don't expire, unlike the Salesforce CPQ quotes this replaces.
 */
export const QUOTE_DOCUMENT_DEFAULT_LABELS = {
  documentTitle: 'Quote',
  createdDateLabel: 'Date',
  billToLabel: 'Bill To',
  shipToLabel: 'Ship To',
  buyerNameLabel: 'Contact',
  productColumnLabel: 'Product',
  quantityColumnLabel: 'Qty',
  listPriceColumnLabel: 'List Price',
  discountedPriceColumnLabel: 'Your Price',
  taxColumnLabel: 'Tax',
  subtotalColumnLabel: 'Total Price',
  subtotalLabel: 'Quote Subtotal',
  taxLabel: 'Tax Total',
  totalLabel: 'Quote Total',
  footerNote: 'ISC2 · Thank you for your business.',
  downloadQuoteCtaLabel: 'Download Quote',
} as const;
