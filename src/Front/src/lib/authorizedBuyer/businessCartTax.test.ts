import { BUSINESS_PAYMENT_METHODS } from 'constants/checkout';
import { Cart, LineItem } from 'types/index';

import {
  buildZeroTaxCartActions,
  getConcreteLineItems,
  isBusinessTaxExempt,
  shouldRecalculateTaxForPaymentMethod,
  shouldRefreshPaymentIntentForPaymentMethod,
  withZeroTaxedPrice,
} from './businessCartTax';

const money = (centAmount: number) => ({
  type: 'centPrecision' as const,
  currencyCode: 'USD',
  centAmount,
  fractionDigits: 2,
});

const lineItem = (id: string, centAmount: number): LineItem =>
  ({
    id,
    totalPrice: money(centAmount),
  } as LineItem);

const cart = (overrides?: Partial<Cart>): Cart =>
  ({
    id: 'cart-1',
    totalPrice: money(10000),
    shippingAddress: { country: 'US', state: 'TX', streetName: '1 Main', city: 'Austin' },
    lineItems: [lineItem('li-1', 6000), lineItem('li-2', 4000)],
    ...overrides,
  } as Cart);

describe('businessCartTax', () => {
  describe('isBusinessTaxExempt', () => {
    it('is true only when the B2B flag is on and the account is tax exempt', () => {
      expect(isBusinessTaxExempt(true, true)).toBe(true);
      expect(isBusinessTaxExempt(false, true)).toBe(false);
      expect(isBusinessTaxExempt(true, false)).toBe(false);
      expect(isBusinessTaxExempt(true, undefined)).toBe(false);
    });
  });

  describe('shouldRecalculateTaxForPaymentMethod', () => {
    it('retriggers when the payment method changes while the B2B flag is on', () => {
      expect(
        shouldRecalculateTaxForPaymentMethod(
          true,
          'stripe',
          BUSINESS_PAYMENT_METHODS.PREPAID_ACCOUNT
        )
      ).toBe(true);
      expect(
        shouldRecalculateTaxForPaymentMethod(
          true,
          BUSINESS_PAYMENT_METHODS.PREPAID_ACCOUNT,
          'stripe'
        )
      ).toBe(true);
      expect(shouldRecalculateTaxForPaymentMethod(true, 'stripe', 'preapproved-credit')).toBe(true);
      expect(shouldRecalculateTaxForPaymentMethod(true, 'preapproved-credit', 'paypal')).toBe(true);
      expect(
        shouldRecalculateTaxForPaymentMethod(
          true,
          undefined,
          BUSINESS_PAYMENT_METHODS.PREPAID_ACCOUNT
        )
      ).toBe(true);
    });

    it('does not retrigger when the flag is off or the method did not change', () => {
      expect(
        shouldRecalculateTaxForPaymentMethod(
          false,
          'stripe',
          BUSINESS_PAYMENT_METHODS.PREPAID_ACCOUNT
        )
      ).toBe(false);
      expect(
        shouldRecalculateTaxForPaymentMethod(
          true,
          BUSINESS_PAYMENT_METHODS.PREPAID_ACCOUNT,
          BUSINESS_PAYMENT_METHODS.PREPAID_ACCOUNT
        )
      ).toBe(false);
    });
  });

  describe('shouldRefreshPaymentIntentForPaymentMethod', () => {
    it('refreshes the payment intent only when prepaid is involved', () => {
      expect(
        shouldRefreshPaymentIntentForPaymentMethod(
          'stripe',
          BUSINESS_PAYMENT_METHODS.PREPAID_ACCOUNT
        )
      ).toBe(true);
      expect(
        shouldRefreshPaymentIntentForPaymentMethod(
          BUSINESS_PAYMENT_METHODS.PREPAID_ACCOUNT,
          'stripe'
        )
      ).toBe(true);
      expect(shouldRefreshPaymentIntentForPaymentMethod('stripe', 'paypal')).toBe(false);
      expect(
        shouldRefreshPaymentIntentForPaymentMethod(
          'stripe',
          BUSINESS_PAYMENT_METHODS.PREAPPROVED_CREDIT
        )
      ).toBe(false);
    });
  });

  describe('withZeroTaxedPrice', () => {
    it('sets cart tax to zero and keeps the merchandise total', () => {
      const taxed = withZeroTaxedPrice(cart());

      expect(taxed.taxedPrice?.totalTax.centAmount).toBe(0);
      expect(taxed.taxedPrice?.totalGross.centAmount).toBe(10000);
      expect(taxed.taxedPrice?.totalNet.centAmount).toBe(10000);
    });
  });

  describe('getConcreteLineItems', () => {
    it('flattens bundle component lines', () => {
      const items = getConcreteLineItems(
        cart({
          lineItems: [
            {
              id: 'bundle-1',
              products: [lineItem('child-1', 2500)],
            } as Cart['lineItems'][number],
            lineItem('solo-1', 1000),
          ],
        })
      );

      expect(items.map((item) => item.id)).toEqual(['child-1', 'solo-1']);
    });
  });

  describe('buildZeroTaxCartActions', () => {
    it('writes zero tax amounts for each line and the cart total', () => {
      const actions = buildZeroTaxCartActions(cart());

      expect(actions).toHaveLength(3);
      expect(actions[0]).toEqual({
        setLineItemTaxAmount: {
          lineItemId: 'li-1',
          externalTaxAmount: {
            totalGross: { currencyCode: 'USD', centAmount: 6000 },
            taxRate: {
              name: 'tax-exempt',
              amount: 0,
              includedInPrice: false,
              country: 'US',
              state: 'TX',
            },
          },
        },
      });
      expect(actions[2]).toEqual({
        setCartTotalTax: {
          externalTotalGross: { currencyCode: 'USD', centAmount: 10000 },
        },
      });
    });

    it('returns no actions without a shipping country', () => {
      expect(buildZeroTaxCartActions(cart({ shippingAddress: { city: 'Austin' } }))).toEqual([]);
    });
  });
});
