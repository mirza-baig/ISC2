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
  /**
   * Business purchase details, collected at checkout step one. Optional because
   * `salesforceGetOrders` does not return them yet — they are exported as blank columns
   * until it does.
   */
  poNumber?: string;
  customerOrderReference?: string;
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
