import type { PrintableOrder, TypedMoney } from 'types/index';

import {
  filterOrdersForShopperContext,
  isOrganizationOrder,
  normalizePrintableOrder,
} from './orderHistory';

const usd = (centAmount: number): TypedMoney => ({
  type: 'centPrecision',
  centAmount,
  currencyCode: 'USD',
  fractionDigits: 2,
});

const order = (overrides: Partial<PrintableOrder> = {}): PrintableOrder => ({
  orderId: 'order-1',
  orderDate: '2026-08-28',
  orderStatus: 'Confirmed',
  paymentType: 'Card',
  orderTotal: usd(10000),
  tax: usd(0),
  subTotal: usd(10000),
  origin: 'Online',
  products: [{ productItemName: 'ISSAP Exam', productItemPrice: usd(10000), productQuantity: 1 }],
  isSameAddress: true,
  ...overrides,
});

const myself = { type: 'myself' as const, organization: null };
const organization = (id = 'acct-500', name = 'Business Co. Canada Ltd') => ({
  type: 'organization' as const,
  organization: { id, name },
});

describe('isOrganizationOrder', () => {
  it('is true when the order is tagged with an account', () => {
    expect(isOrganizationOrder(order({ accountId: 'acct-500' }))).toBe(true);
    expect(isOrganizationOrder(order({ accountName: 'Business Co. Canada Ltd' }))).toBe(true);
  });

  it('is true when any line quantity is greater than one', () => {
    expect(
      isOrganizationOrder(
        order({
          products: [
            { productItemName: 'ISSAP Exam', productItemPrice: usd(145557), productQuantity: 3 },
          ],
        })
      )
    ).toBe(true);
    expect(
      isOrganizationOrder(
        order({
          products: [
            {
              productItemName: 'ISSAP Exam',
              productItemPrice: usd(145557),
              productQuantity: '3' as unknown as number,
            },
          ],
        })
      )
    ).toBe(true);
  });

  it('is false for a personal qty-1 purchase', () => {
    expect(isOrganizationOrder(order())).toBe(false);
  });

  it('is true when buyer or PO fields are present even at quantity 1', () => {
    expect(isOrganizationOrder(order({ buyerFullName: 'Sam Guy' }))).toBe(true);
    expect(isOrganizationOrder(order({ poNumber: '0001224' }))).toBe(true);
  });
});

describe('filterOrdersForShopperContext', () => {
  const personal = order({
    orderId: 'personal',
    products: [{ productItemName: 'CISSP Exam', productItemPrice: usd(51569), productQuantity: 1 }],
  });
  const orgA = order({
    orderId: 'org-a',
    accountId: 'acct-500',
    accountName: 'Business Co. Canada Ltd',
    products: [
      { productItemName: 'ISSAP Exam', productItemPrice: usd(145557), productQuantity: 3 },
    ],
  });
  const orgB = order({
    orderId: 'org-b',
    accountId: 'acct-900',
    accountName: 'Northwind Traders LLC',
  });
  const qtyOnlyOrg = order({
    orderId: 'qty-org',
    products: [
      { productItemName: 'ISSAP Exam', productItemPrice: usd(145557), productQuantity: 3 },
    ],
  });

  it('returns the full list when no shopper context is selected', () => {
    expect(filterOrdersForShopperContext([personal, orgA], null)).toEqual([personal, orgA]);
  });

  it('keeps only personal orders when shopping as Myself', () => {
    expect(filterOrdersForShopperContext([personal, orgA, qtyOnlyOrg], myself)).toEqual([personal]);
  });

  it('keeps only the selected organization when account fields are present', () => {
    expect(filterOrdersForShopperContext([personal, orgA, orgB], organization())).toEqual([orgA]);
  });

  it('matches organization by accountName even if accountId differs', () => {
    const orgByName = organization('different-id', 'Business Co. Canada Ltd');
    expect(filterOrdersForShopperContext([personal, orgA, orgB], orgByName)).toEqual([orgA]);
  });

  it('keeps only organization-like orders when account fields are missing', () => {
    expect(filterOrdersForShopperContext([personal, qtyOnlyOrg], organization())).toEqual([
      qtyOnlyOrg,
    ]);
  });
});

describe('normalizePrintableOrder', () => {
  it('maps placeholder API names onto account and buyer fields', () => {
    const normalized = normalizePrintableOrder({
      ...order(),
      businessName: 'Test OTP Business Account',
      userName: 'QA Buyer',
      products: [{ productItemName: 'CISSP Exam', productItemPrice: usd(51569), quantity: 2 }],
    });

    expect(normalized.accountName).toBe('Test OTP Business Account');
    expect(normalized.buyerFullName).toBe('QA Buyer');
    expect(normalized.products[0].productQuantity).toBe(2);
  });
});
