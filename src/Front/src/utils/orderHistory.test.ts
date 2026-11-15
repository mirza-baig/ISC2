import type { PrintableOrder, TypedMoney } from 'types/index';

import {
  collapseSalesforceOrderShells,
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

  it('is false when quantity is greater than one but the order has no account tags', () => {
    expect(
      isOrganizationOrder(
        order({
          products: [
            { productItemName: 'ISSAP Exam', productItemPrice: usd(145557), productQuantity: 3 },
          ],
        })
      )
    ).toBe(false);
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
    ).toBe(false);
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

  it('keeps personal and untagged quantity orders when shopping as Myself', () => {
    expect(filterOrdersForShopperContext([personal, orgA, qtyOnlyOrg], myself)).toEqual([
      personal,
      qtyOnlyOrg,
    ]);
  });

  it('keeps only the selected organization when account fields are present', () => {
    expect(filterOrdersForShopperContext([personal, orgA, orgB], organization())).toEqual([orgA]);
  });

  it('matches organization by accountName even if accountId differs', () => {
    const orgByName = organization('different-id', 'Business Co. Canada Ltd');
    expect(filterOrdersForShopperContext([personal, orgA, orgB], orgByName)).toEqual([orgA]);
  });

  it('does not treat untagged quantity orders as organization purchases', () => {
    expect(filterOrdersForShopperContext([personal, qtyOnlyOrg], organization())).toEqual([]);
  });
});

describe('collapseSalesforceOrderShells', () => {
  const zero: TypedMoney = { ...usd(0), fractionDigits: 0 };
  const exam = (productItemName: string, centAmount: number) => [
    { productItemName, productItemPrice: usd(centAmount), productQuantity: 1 },
  ];
  const ctOrder = order({
    orderId: '142026102077270273',
    orderDate: '2026-10-20',
    origin: 'Commercetools',
    accountName: 'Test SP B2B accountQA',
    buyerFullName: 'Test SPQAContactSS',
    orderTotal: usd(59900),
    products: exam('ISSEP Exam', 59900),
  });
  const ownShell = order({
    orderId: '00006512',
    orderDate: '2026-10-20',
    origin: 'Salesforce',
    accountName: 'Test SP B2B accountQA',
    buyerFullName: 'Test SPQAContactSS',
    orderTotal: zero,
    products: exam('ISSEP Exam', 59900),
  });
  const otherBuyerShell = order({
    orderId: '00006552',
    orderDate: '2026-10-23',
    origin: 'Salesforce',
    accountName: 'Test SP B2B accountQA',
    buyerFullName: 'htest B2B',
    orderTotal: zero,
    products: exam('CGRC Exam', 59900),
  });

  it('replaces a Salesforce shell with its commercetools order', () => {
    expect(collapseSalesforceOrderShells([ownShell, ctOrder])).toEqual([ctOrder]);
  });

  it("keeps another buyer's Salesforce order that has no commercetools order", () => {
    expect(collapseSalesforceOrderShells([otherBuyerShell, ownShell, ctOrder])).toEqual([
      otherBuyerShell,
      ctOrder,
    ]);
  });

  it('drops a second shell for a commercetools order that is already paired', () => {
    const duplicateShell = { ...ownShell, orderId: '00006496' };

    expect(collapseSalesforceOrderShells([ownShell, duplicateShell, ctOrder])).toEqual([ctOrder]);
  });

  it("keeps another buyer's Salesforce order for the same product on the same day", () => {
    const otherBuyerSameProduct = { ...ownShell, orderId: '00029629', buyerFullName: 'htest B2B' };

    expect(
      collapseSalesforceOrderShells([otherBuyerSameProduct, ownShell, ctOrder]).map(
        ({ orderId }) => orderId
      )
    ).toEqual(['00029629', '142026102077270273']);
  });

  it('drops a Salesforce order that carries the number of a commercetools order in the list', () => {
    const withReference = { ...ownShell, orderReferenceNumber: ctOrder.orderId };

    expect(collapseSalesforceOrderShells([withReference, ctOrder])).toEqual([ctOrder]);
  });

  it('shows another buyer Salesforce order under its commercetools number with buyer and account', () => {
    const otherBuyerWithReference = {
      ...otherBuyerShell,
      orderReferenceNumber: '142026102377000001',
    };
    const [collapsed] = collapseSalesforceOrderShells([otherBuyerWithReference, ctOrder]);

    expect(collapsed).toMatchObject({
      orderId: '142026102377000001',
      buyerFullName: 'htest B2B',
      accountName: 'Test SP B2B accountQA',
    });
    expect(
      filterOrdersForShopperContext(
        [collapsed],
        organization('001Nq00001jnUvSIAU', 'Test SP B2B accountQA')
      )
    ).toEqual([collapsed]);
  });

  it('pairs the orders by buyer email when the buyer names differ', () => {
    const salesforceRecord = {
      ...ownShell,
      buyerFullName: 'Completely Different Name',
      buyerEmail: 'Buyer@Example.com',
    };
    const commercetoolsRecord = { ...ctOrder, buyerEmail: 'buyer@example.com' };

    expect(collapseSalesforceOrderShells([salesforceRecord, commercetoolsRecord])).toEqual([
      commercetoolsRecord,
    ]);
  });

  it('keeps both orders when the buyer emails differ even if the names match', () => {
    const salesforceRecord = { ...ownShell, buyerEmail: 'one@example.com' };
    const commercetoolsRecord = { ...ctOrder, buyerEmail: 'two@example.com' };

    expect(
      collapseSalesforceOrderShells([salesforceRecord, commercetoolsRecord]).map(
        ({ orderId }) => orderId
      )
    ).toEqual(['00006512', '142026102077270273']);
  });

  it('shows the Salesforce buyer name on the commercetools order it replaces', () => {
    const withReference = {
      ...ownShell,
      buyerFullName: 'Test SPQAContactSS Contact',
      orderReferenceNumber: ctOrder.orderId,
    };

    expect(
      collapseSalesforceOrderShells([withReference, ctOrder]).map(
        ({ buyerFullName }) => buyerFullName
      )
    ).toEqual(['Test SPQAContactSS Contact']);
  });

  it('pairs the orders when the Salesforce buyer name is longer than the commercetools one', () => {
    const longNameShell = { ...ownShell, buyerFullName: 'Test SPQAContactSS Contact' };

    expect(collapseSalesforceOrderShells([longNameShell, ctOrder])).toEqual([ctOrder]);
  });

  it('keeps a Salesforce order with a longer buyer name when the subtotal differs', () => {
    const otherPurchase = {
      ...ownShell,
      orderId: '00029630',
      buyerFullName: 'Test SPQAContactSS Contact',
      subTotal: usd(20000),
    };

    expect(
      collapseSalesforceOrderShells([otherPurchase, ctOrder]).map(({ orderId }) => orderId)
    ).toEqual(['00029630', '142026102077270273']);
  });

  it('keeps a Salesforce order when only one word of the buyer name matches', () => {
    const otherBuyerSameProduct = { ...ownShell, orderId: '00029629', buyerFullName: 'Test Other' };

    expect(
      collapseSalesforceOrderShells([otherBuyerSameProduct, ctOrder]).map(({ orderId }) => orderId)
    ).toEqual(['00029629', '142026102077270273']);
  });

  it("shows another buyer's order when shopping for the organization", () => {
    const orders = collapseSalesforceOrderShells([otherBuyerShell, ownShell, ctOrder]);

    expect(
      filterOrdersForShopperContext(
        orders,
        organization('001Nq00001jnUvSIAU', 'Test SP B2B accountQA')
      ).map(({ orderId }) => orderId)
    ).toEqual(['00006552', '142026102077270273']);
  });
});

describe('normalizePrintableOrder', () => {
  it('maps and cleans the current order-history organization and buyer fields', () => {
    const normalized = normalizePrintableOrder({
      ...order(),
      organization: '"Meridian Partners LLC"',
      buyer: '"Test SPcontact"',
    });

    expect(normalized.accountName).toBe('Meridian Partners LLC');
    expect(normalized.buyerFullName).toBe('Test SPcontact');
  });

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

  it('maps the Salesforce contact id onto the buyer id', () => {
    const normalized = normalizePrintableOrder({ ...order(), buyerContactId: '003Nq00000ABC' });

    expect(normalized.buyerId).toBe('003Nq00000ABC');
  });

  it('scales a Salesforce order total sent in cents with zero fraction digits', () => {
    const normalized = normalizePrintableOrder(
      order({
        origin: 'Salesforce',
        orderTotal: { ...usd(1123900), fractionDigits: 0 },
        subTotal: usd(1123900),
      })
    );

    expect(normalized.orderTotal).toEqual(usd(1123900));
  });

  it('keeps a Salesforce order total that already has matching fraction digits', () => {
    const salesforceOrder = order({
      origin: 'Salesforce',
      orderTotal: usd(59900),
      subTotal: usd(59900),
    });

    expect(normalizePrintableOrder(salesforceOrder).orderTotal).toEqual(usd(59900));
  });

  it('keeps a commercetools order total as it is', () => {
    const commercetoolsOrder = order({
      origin: 'Commercetools',
      orderTotal: { ...usd(1198834), fractionDigits: 0 },
      subTotal: usd(1123900),
    });

    expect(normalizePrintableOrder(commercetoolsOrder).orderTotal.fractionDigits).toBe(0);
  });
});
