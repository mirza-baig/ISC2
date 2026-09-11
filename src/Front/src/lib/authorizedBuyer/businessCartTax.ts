import { BUSINESS_PAYMENT_METHODS } from 'constants/checkout';
import { BundleLineItem, Cart, CartLineItem, CartWithComputedData, LineItem } from 'types/index';

type TaxableCart = Cart | CartWithComputedData;

const isBundleLineItem = (item: CartLineItem): item is BundleLineItem => 'products' in item;

const isConcreteLineItem = (item: CartLineItem): item is LineItem =>
  Boolean(item.id) && Boolean(item.totalPrice) && !isBundleLineItem(item);

export const getConcreteLineItems = (cart?: TaxableCart | null): LineItem[] =>
  (cart?.lineItems || []).flatMap((item) => {
    if (isBundleLineItem(item)) {
      return item.products.filter((product) => product.id && product.totalPrice);
    }

    return isConcreteLineItem(item) ? [item] : [];
  });

export const isBusinessTaxExempt = (isB2BFeatureEnabled: boolean, taxExempt?: boolean | null) =>
  isB2BFeatureEnabled && Boolean(taxExempt);

export const shouldRecalculateTaxForPaymentMethod = (
  isB2BFeatureEnabled: boolean,
  previousMethod?: string,
  nextMethod?: string
) => {
  if (!isB2BFeatureEnabled || !nextMethod || previousMethod === nextMethod) {
    return false;
  }

  return true;
};

export const shouldRefreshPaymentIntentForPaymentMethod = (
  previousMethod?: string,
  nextMethod?: string
) => {
  const prepaid = BUSINESS_PAYMENT_METHODS.PREPAID_ACCOUNT;

  return previousMethod === prepaid || nextMethod === prepaid;
};

export const withZeroTaxedPrice = <T extends TaxableCart>(cart: T): T => {
  const money = cart.totalPrice;

  if (!money) {
    return cart;
  }

  return {
    ...cart,
    taxedPrice: {
      totalNet: money,
      totalGross: money,
      totalTax: {
        ...money,
        centAmount: 0,
      },
    },
  };
};

export const buildZeroTaxCartActions = (cart: TaxableCart) => {
  const country = cart.shippingAddress?.country;

  if (!country) {
    return [];
  }

  const state = cart.shippingAddress?.state;
  const lineItems = getConcreteLineItems(cart);

  const lineActions = lineItems.map((item) => ({
    setLineItemTaxAmount: {
      lineItemId: item.id,
      externalTaxAmount: {
        totalGross: {
          currencyCode: item.totalPrice.currencyCode,
          centAmount: item.totalPrice.centAmount,
        },
        taxRate: {
          name: 'tax-exempt',
          amount: 0,
          includedInPrice: false,
          country,
          ...(state ? { state } : {}),
        },
      },
    },
  }));

  if (!cart.totalPrice) {
    return lineActions;
  }

  return [
    ...lineActions,
    {
      setCartTotalTax: {
        externalTotalGross: {
          currencyCode: cart.totalPrice.currencyCode,
          centAmount: cart.totalPrice.centAmount,
        },
      },
    },
  ];
};
