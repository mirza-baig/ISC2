import { TypedMoney } from './pricing';
import { Field, LinkField } from '@sitecore-jss/sitecore-jss-nextjs';

import { CUSTOMER_GROUP_NAMES } from 'constants/index';

export interface MiniCartLabels {
  cartTitle: string;
  subtotalLabel: string;
  inventoryLabel: string;
  totalLabel: string;
  taxLabel: string;
  withoutTaxesLabel: string;
  productNotAvailableNotice: string;
  taxTbd: string;
  yourPriceLabel: string;
}

export interface MiniCartFields {
  heading: Field<string>;
  description: Field<string>;
  richText: Field<string>;
  checkoutCta: LinkField;
  labelsAndOtherProperties: Field<string>;
}

export type LineItemIncludedDiscount = {
  discountedAmount: TypedMoney;
  discount: {
    name: string;
  };
};

export type LineItemDiscount = {
  discountedPrice: {
    value: TypedMoney;
    includedDiscounts: LineItemIncludedDiscount[];
  };
};

export type LocalizedAttributeValue = {
  key: string;
  label: string;
};

export type LineItemVariantAttribute = {
  name: string;
  value: string | boolean | LocalizedAttributeValue;
};

export type LineItem = {
  id: string;
  productId: string;
  productKey: string;
  productType: null | {
    id: string;
    name: string;
  };
  name: string;
  quantity: number;
  nonMemberPrice: TypedMoney;
  availableQuantity: number;
  custom: {
    customFieldsRaw: {
      name: string;
      value: string;
    }[];
  };
  variant: {
    id: number;
    sku: string;
    attributesRaw: LineItemVariantAttribute[];
  };
  discountedPricePerQuantity: null | LineItemDiscount[];
  totalPrice: TypedMoney;
  taxedPrice: { totalTax: TypedMoney } | null;
  price: {
    discounted: null | {
      discount: {
        name: string;
      };
      value: TypedMoney;
    };
    value: TypedMoney;
  };
};

export type BundleLineItem = {
  /**
   * The OCCURRENCE this row is: a bundle SKU on its own for anything added before multi-occurrence
   * support (and by any caller that did not opt in), or `<bundleSku>::<pickedSkus>` once it did.
   * Unique per row either way, which is all the UI needs of it — use `bundleSku` to name the
   * product.
   */
  id: string;
  /**
   * Which bundle PRODUCT this row is an occurrence of. Not derivable from `id` any more, and a cart
   * can now hold two rows that share it (the same class bought for two different dates).
   */
  bundleSku: string;
  products: LineItem[];
  /** Seats. One for every bundle the PDP adds; the B2B listing can sell several at once. */
  quantity: number;
  productType: {
    id: 'bundle';
    name: 'bundle';
  };
  productKey: string;
  variant: {
    id?: number;
    sku: string;
    attributesRaw?: LineItemVariantAttribute[];
  };
  name: string;
  availableQuantity: number;
  totalPrice: TypedMoney;
  nonMemberPrice: TypedMoney;
  price: {
    value: TypedMoney;
    discounted: null;
  };
};

export type CartDiscount = {
  discountCode?: { code: string; id: string; name: string };
  discountedAmount: TypedMoney;
  discount: { name: string; id: string };
};

export type Bundle = {
  description: string;
  name: string;
  productKey: string;
  originalPrice: TypedMoney;
  skus: string[];
  totalPrice: TypedMoney;
  /**
   * Both optional because the cart service only started returning them alongside multi-occurrence
   * support, and a cart response can be served from a cache written before that.
   */
  bundleSku?: string;
  quantity?: number;
};

export type CartLineItem = LineItem | BundleLineItem;

export type Cart = {
  id: string;
  bundles: Record<string, Bundle>;
  version: string;
  country: string;
  customerGroup: {
    name: (typeof CUSTOMER_GROUP_NAMES)[keyof typeof CUSTOMER_GROUP_NAMES];
  };
  customerId: null | string;
  customerEmail: null | string;
  cartState: 'Active' | 'Merged' | 'Ordered' | 'Completed' | 'Locked';
  lineItems: CartLineItem[];
  totalLineItemQuantity: number;
  nonMemberPrice: {
    [key: string]: {
      value: TypedMoney;
    };
  };
  inventories: {
    [key: string]: {
      availableQuantity: number;
    };
  };
  discountCodes: null | CartDiscount[];
  totalPrice: TypedMoney;
  discountOnTotalPrice?: {
    includedDiscounts: CartDiscount[];
  };
  shippingAddress?: {
    city?: string;
    country?: string;
    phone?: string;
    postalCode?: string;
    state?: string;
    streetName?: string;
  };
  taxedPrice?: {
    totalGross: TypedMoney;
    totalNet: TypedMoney;
    totalTax: TypedMoney;
  } | null;
  custom: {
    customFieldsRaw: {
      name: string;
      value: string;
    }[];
  };
};

export type CartWithComputedData = Partial<Cart> & {
  computed: {
    isEmpty?: boolean;
    isFetchedAndEmpty?: boolean;
    currencyCode?: string;
    currencySymbol: string;
    totalPrice: string;
    subtotal: number;
    itemsQuantity: number;
    hasNotAvailableProducts: boolean;
    isCheckoutDisabled: boolean;
    taxValue?: string | number;
    isB2B: boolean;
    includesSubscription: boolean;
  };
};

export type ServiceLayerError = {
  extensions?: {
    code?: string;
    reason?: string;
  };
  message: string;
};

export type ServiceLayerResponse<T> = {
  data: T;
  errors: ServiceLayerError[];
};

export type UpdateCartResponse = ServiceLayerResponse<{
  isc2CartUpdate: Cart;
  isc2CartTaxUpdate?: Cart;
}>;
