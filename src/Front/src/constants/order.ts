export const BUSINESS_ORDER_CONFIRMATION_DEFAULT_LABELS = {
  businessHeadline: 'Order Confirmed!',
  businessSubheadline: 'Thank you for your purchase',
  businessConfirmationCopy:
    'Your order details are below, and an email has been sent to {userEmail} with your purchase information.',
  orderNumberLabel: 'Order Number',
  orderDateLabel: 'Order Date',
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
export const BUSINESS_RECEIPT_DEFAULT_LABELS = {
  documentTitle: 'Transaction Receipt',
  ReceiptConfirmText:
    'This document is a transaction receipt confirming payment and is not a payment invoice or a request for payment.',
  orderNumberLabel: 'Order Number',
  orderDateLabel: 'Order Date',
  orderStatusLabel: 'Status',
  currencyLabel: 'Currency',
  organizationLabel: 'Organization',
  billToLabel: 'Bill To',
  purchaseDetailsLabel: 'Purchase Details',
  buyerNameLabel: 'Buyer',
  emailLabel: 'Email',
  poNumberLabel: 'PO Number',
  customerOrderReferenceLabel: 'Customer Order Reference',
  taxIdLabel: 'Tax ID Number',
  intacctCustomerIdLabel: 'Customer ID',
  productColumnLabel: 'Line Item',
  locationColumnLabel: 'Location',
  quantityColumnLabel: 'Qty',
  listPriceColumnLabel: 'List Price',
  discountedPriceColumnLabel: 'Your Price',
  subtotalColumnLabel: 'Line Total',
  subtotalLabel: 'Subtotal',
  taxLabel: 'Tax',
  totalLabel: 'Total',
  paymentMethodLabel: 'Payment Method',
  downloadReceiptCtaLabel: 'Print Your Receipt',
  footerNote: 'ISC2 · Thank you for your business.',
} as const;

export const ORDER_HISTORY_EXPORT_DEFAULT_LABELS = {
  exportExcelCtaLabel: 'Export to Excel',
} as const;

/** Product types that make the in-person class location relevant on the receipt. */
export const IN_PERSON_MODALITIES = ['in person', 'in-person', 'classroom', 'onsite', 'on-site'];
