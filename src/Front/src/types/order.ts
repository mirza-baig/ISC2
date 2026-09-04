import { UserAddress } from '.';
import { TypedMoney } from './pricing';

export type OrderWithComputedData = Order & {
  computed: {
    currencySymbol: string;
    totalPrice: string;
  };
};

export type Order = {
  cartRef: { id: string };
  orderNumber: string;
  /** ISO timestamp; rendered as the Order Date on the confirmation screen. */
  createdAt: string;
  customerEmail: string;
  orderState: string;
  paymentInfo: {
    payments: {
      paymentMethodInfo: {
        method: string;
        name: string;
      };
    }[];
  };
  custom?: {
    customFieldsRaw?: {
      [name: string]: string;
    };
  };
  paymentState: string | null;
  shippingAddress: {
    firstName: string;
    lastName: string;
    streetName: string;
    streetNumber: string;
    postalCode: string;
    city: string;
    state: string;
    country: string;
    company: string;
    department: string;
    building: string;
    apartment: string;
    pOBox: string;
  };
  totalPrice: TypedMoney;
};

export type OrderProduct = {
  productItemName: string;
  productItemPrice: TypedMoney;
  productItemDescription?: string;
  productItemSchedule?: string;
  productQuantity?: number;
  shippedBy?: string;
};

export type PrintableOrder = {
  orderId: string;
  orderDate: string;
  orderStatus: string;
  paymentType: string;
  orderTotal: TypedMoney;
  tax: TypedMoney;
  subTotal: TypedMoney;
  origin: string;
  /** Optional business / integration fields */
  accountId?: string;
  accountName?: string;
  buyerId?: string;
  buyerFullName?: string;
  buyerEmail?: string;
  poNumber?: string;
  customerOrderReference?: string;
  orderNumber?: string;
  products: OrderProduct[];
  mailingAddress?: UserAddress;
  billingAddress?: UserAddress;
  isSameAddress: boolean;
  lineItems?: {
    name: string;
    price: TypedMoney;
    quantity?: number;
    labels: string[];
  }[];
};

/**
 * Business order confirmation copy, parsed from the Order Details item's
 * "Labels, Tooltips And More" field.
 *
 * Every key is optional because authors add them per environment;
 * BUSINESS_ORDER_CONFIRMATION_DEFAULT_LABELS supplies the value until they do. Same
 * arrangement as the business keys on StepOneLabels in types/checkout.
 */
export type BusinessOrderConfirmationLabels = {
  businessHeadline?: string;
  businessSubheadline?: string;
  businessConfirmationCopy?: string;
  orderNumberLabel?: string;
  orderDateLabel?: string;
  /** Supports a `{quantity}` token, e.g. "{quantity} Attendees". */
  quantityLabel?: string;
  /** Singular form of `quantityLabel`, used when a line item has a quantity of one. */
  quantitySingularLabel?: string;
  /** Supports a `{price}` token, e.g. "{price} ea.". */
  unitPriceLabel?: string;
  subtotalLabel?: string;
  taxLabel?: string;
  totalLabel?: string;
  paymentMethodLabel?: string;
  whatHappensNextTitle?: string;
  emailConfirmationStepTitle?: string;
  /** Supports a `{userEmail}` token. */
  emailConfirmationStepCopy?: string;
  preapprovedCreditStepTitle?: string;
  preapprovedCreditStepCopy?: string;
  prepaidAccountStepTitle?: string;
  prepaidAccountStepCopy?: string;
  orderAllocationStepTitle?: string;
  orderAllocationStepCopy?: string;
  printReceiptCtaLabel?: string;
  openDashboardCtaLabel?: string;
  supportCopy?: string;
  supportLinkLabel?: string;
  supportLinkUrl?: string;
  supportPhoneCopy?: string;
};

export type OrderCompanyData = {
  city?: string;
  companyName?: string;
  address?: string;
  state?: string;
  zipCode?: string;
  country?: string;
};

/** One product row on the business transaction receipt. */
export type ReceiptLineItem = {
  name: string;
  /** Venue for an in-person (public or private) class; omitted for every other modality. */
  location?: string;
  quantity: number;
  /** Undiscounted unit price, pre-formatted for display. */
  listPrice: string;
  /** Discounted unit price, present only when the line actually carries a discount. */
  discountedPrice?: string;
  subtotal: string;
};

/**
 * Everything the business transaction receipt PDF renders. Assembled once by
 * `buildBusinessReceiptData` so the document component stays free of lookups and can be
 * rendered from the confirmation screen, order history, or a test with the same shape.
 *
 * Optional members are the ones with no source yet: PO number and customer order
 * reference are not persisted onto the order, and the tax / Intacct identifiers are not
 * in the account payload. Each row is hidden when its value is absent.
 */
export type BusinessReceiptData = {
  orderNumber: string;
  orderDate: string;
  orderStatus: string;
  currencyCode: string;
  organizationName?: string;
  isc2EntityName?: string;
  buyerName: string;
  buyerEmail: string;
  billingAddressLines: string[];
  poNumber?: string;
  customerOrderReference?: string;
  taxIdNumber?: string;
  intacctCustomerId?: string;
  lineItems: ReceiptLineItem[];
  subtotal: string;
  tax: string;
  total: string;
  paymentMethod?: string;
};

export type BusinessReceiptLabels = {
  documentTitle?: string;
  disclaimer?: string;
  orderNumberLabel?: string;
  orderDateLabel?: string;
  orderStatusLabel?: string;
  currencyLabel?: string;
  organizationLabel?: string;
  isc2EntityLabel?: string;
  billToLabel?: string;
  purchaseDetailsLabel?: string;
  buyerNameLabel?: string;
  emailLabel?: string;
  poNumberLabel?: string;
  customerOrderReferenceLabel?: string;
  taxIdLabel?: string;
  intacctCustomerIdLabel?: string;
  productColumnLabel?: string;
  locationColumnLabel?: string;
  quantityColumnLabel?: string;
  listPriceColumnLabel?: string;
  discountedPriceColumnLabel?: string;
  subtotalColumnLabel?: string;
  subtotalLabel?: string;
  taxLabel?: string;
  totalLabel?: string;
  paymentMethodLabel?: string;
  downloadReceiptCtaLabel?: string;
  footerNote?: string;
};
