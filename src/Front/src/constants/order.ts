/**
 * Fallbacks for the business order confirmation copy. Sitecore authors override these by
 * adding the matching keys to the Order Details item's "Labels, Tooltips And More" field;
 * until then the confirmation renders the agreed copy.
 *
 * Same arrangement as the business keys on StepOneLabels in types/checkout.
 *
 * `{userEmail}` and `{orderId}` are replaced at render time, matching how the individual
 * confirmation already substitutes them.
 */
export const BUSINESS_ORDER_CONFIRMATION_DEFAULT_LABELS = {
  // Prefixed with `business` because these share the Order Details item's single
  // "Labels, Tooltips And More" field with the individual confirmation's own keys.
  businessHeadline: 'Order Confirmed!',
  businessSubheadline: 'Thank you for your purchase',
  businessConfirmationCopy:
    'Your order details are below, and an email has been sent to {userEmail} with your purchase information.',
  orderNumberLabel: 'Order Number',
  orderDateLabel: 'Order Date',
  // "Attendees" comes from the prototype, which shows a classroom course. It reads wrong
  // against an exam or a kit — if the copy owner wants a per-product-type word, that is a
  // content change here, not a component change.
  quantitySingularLabel: '{quantity} Attendee',
  quantityLabel: '{quantity} Attendees',
  unitPriceLabel: '{price} ea.',
  subtotalLabel: 'Subtotal',
  taxLabel: 'Tax',
  totalLabel: 'Total',
  paymentMethodLabel: 'Payment Method',
  whatHappensNextTitle: 'What Happens Next?',
  emailConfirmationStepTitle: 'Email Confirmation',
  emailConfirmationStepCopy:
    "You'll receive an order confirmation email at {userEmail} within the next few minutes.",
  orderAllocationStepTitle: 'Order Allocation',
  orderAllocationStepCopy: "You can open your dashboard now to allocate products you've purchased.",
  printReceiptCtaLabel: 'Print Receipt',
  openDashboardCtaLabel: 'Open Dashboard',
  supportCopy: 'Questions about your order?',
  /**
   * Business-only defaults for the support line. Hardcoded so the B2B confirmation
   * always renders the same "Contact Support" link, independent of what Sitecore
   * authored in "Labels, Tooltips And More" for the individual variant.
   */
  supportLinkLabel: 'Contact Support',
  supportLinkUrl: 'https://www.isc2.org/contact-us',
} as const;

/**
 * The conditional "Invoice Processing" step, keyed by the payment method the cart was
 * checked out with. A method with no entry here renders no step, which is the intended
 * behaviour for the card/PayPal methods a business buyer can also use.
 */
export const BUSINESS_PAYMENT_METHOD_DEFAULT_STEPS = {
  'preapproved-credit': {
    title: 'Invoice Processing',
    copy: 'Your invoice will be sent to the billing contact within 2 business days with Net 30 payment terms.',
  },
  'prepaid-account': {
    title: 'Prepaid Account',
    copy: 'This order has been deducted from your prepaid account balance.',
  },
} as const;
/**
 * Business transaction receipt copy. Authors override any of these via the same
 * "labels, tooltips and more" field the confirmation screen reads; until then the PDF
 * renders the agreed wording.
 *
 * The disclaimer is required by the story — the receipt has to be unambiguously
 * distinguishable from a payment invoice — so it is deliberately not optional here.
 */
export const BUSINESS_RECEIPT_DEFAULT_LABELS = {
  documentTitle: 'Transaction Receipt',
  disclaimer:
    'This document is a transaction receipt confirming payment and is not a payment invoice or a request for payment.',
  orderNumberLabel: 'Order Number',
  orderDateLabel: 'Order Date',
  orderStatusLabel: 'Status',
  currencyLabel: 'Currency',
  organizationLabel: 'Organization',
  isc2EntityLabel: 'ISC2 Entity',
  billToLabel: 'Bill To',
  purchaseDetailsLabel: 'Purchase Details',
  buyerNameLabel: 'Buyer',
  emailLabel: 'Email',
  poNumberLabel: 'PO Number',
  customerOrderReferenceLabel: 'Customer Order Reference',
  taxIdLabel: 'Tax ID Number',
  intacctCustomerIdLabel: 'Customer ID',
  productColumnLabel: 'Product',
  locationColumnLabel: 'Location',
  quantityColumnLabel: 'Qty',
  listPriceColumnLabel: 'List Price',
  discountedPriceColumnLabel: 'Discounted',
  subtotalColumnLabel: 'Subtotal',
  subtotalLabel: 'Subtotal',
  taxLabel: 'Tax',
  totalLabel: 'Total',
  paymentMethodLabel: 'Payment Method',
  downloadReceiptCtaLabel: 'Print Your Receipt',
  footerNote: 'ISC2 · Thank you for your business.',
} as const;

/**
 * Fallback for the Order History export CTA. Authors override it by adding
 * `exportExcelCtaLabel` to the Order History item's "Labels And More" field, the same
 * arrangement the rest of the order history copy already uses.
 */
export const ORDER_HISTORY_EXPORT_DEFAULT_LABELS = {
  exportExcelCtaLabel: 'Export to Excel',
} as const;

/** Product types that make the in-person class location relevant on the receipt. */
export const IN_PERSON_MODALITIES = ['in person', 'in-person', 'classroom', 'onsite', 'on-site'];
