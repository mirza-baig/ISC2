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

export type OrderCompanyData = {
  city?: string;
  companyName?: string;
  address?: string;
  state?: string;
  zipCode?: string;
  country?: string;
};
