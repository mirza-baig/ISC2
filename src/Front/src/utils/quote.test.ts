import { CartWithComputedData, LineItem, PersonalInformation, TypedMoney } from 'types/index';

import { buildQuoteData } from './quote';

const money = (centAmount: number, currencyCode = 'USD'): TypedMoney => ({
  type: 'centPrecision',
  centAmount,
  currencyCode,
  fractionDigits: 2,
});

const baseLineItem = (overrides: Partial<LineItem> = {}): LineItem => ({
  id: 'line-1',
  productId: 'product-1',
  productKey: 'product-1',
  productType: { id: 'exam', name: 'Exam' },
  name: 'CISSP Exam',
  quantity: 1,
  nonMemberPrice: money(71250),
  availableQuantity: 10,
  custom: { customFieldsRaw: [] },
  variant: { id: 1, sku: 'CISSP', attributesRaw: [] },
  discountedPricePerQuantity: null,
  totalPrice: money(71250),
  taxedPrice: { totalTax: money(4988) },
  price: { value: money(71250), discounted: null },
  ...overrides,
});

const basePersonalInformation = (
  overrides: Partial<PersonalInformation> = {}
): PersonalInformation => ({
  firstName: 'Nick',
  lastName: 'Candidate',
  employer: 'Kalyane B2B Test',
  email: 'nickcandidate@mailinator.com',
  billingAddress: {
    street: '123 billing street',
    city: 'Tampa',
    stateCode: 'FL',
    postalCode: '33067',
    countryCode: 'US',
  },
  isSameAddress: true,
  agreeTerms: true,
  isB2Bcart: true,
  ...overrides,
});

const baseCart = (overrides: Partial<CartWithComputedData> = {}): CartWithComputedData => ({
  lineItems: [baseLineItem()],
  shippingAddress: {
    streetName: '123 billing street',
    city: 'Tampa',
    state: 'FL',
    postalCode: '33067',
    country: 'US',
  },
  computed: {
    currencyCode: 'USD',
    currencySymbol: '$',
    totalPrice: '762.38',
    subtotal: 712.5,
    itemsQuantity: 1,
    hasNotAvailableProducts: false,
    isCheckoutDisabled: false,
    taxValue: '49.88',
    isB2B: true,
    includesSubscription: false,
  },
  ...overrides,
});

describe('buildQuoteData', () => {
  it('carries no quote number or expiration date', () => {
    const data = buildQuoteData({
      cart: baseCart(),
      personalInformation: basePersonalInformation(),
    });

    expect(data).not.toHaveProperty('quoteNumber');
    expect(data).not.toHaveProperty('expirationDate');
  });

  it('formats totals with an explicit currency-code prefix', () => {
    const data = buildQuoteData({
      cart: baseCart(),
      personalInformation: basePersonalInformation(),
    });

    expect(data.subtotal).toBe('USD 712.50');
    expect(data.tax).toBe('USD 49.88');
    expect(data.total).toBe('USD 762.38');
  });

  it('maps a line item with quantity, list price, tax and subtotal', () => {
    const data = buildQuoteData({
      cart: baseCart(),
      personalInformation: basePersonalInformation(),
    });

    expect(data.lineItems).toEqual([
      {
        name: 'CISSP Exam',
        quantity: 1,
        listPrice: 'USD 712.50',
        discountedPrice: 'USD 712.50',
        hasDiscount: false,
        tax: 'USD 49.88',
        subtotal: 'USD 712.50',
      },
    ]);
  });

  it('prefers copy_name over the raw product name, matching the cart Order Summary', () => {
    const cart = baseCart({
      lineItems: [
        baseLineItem({
          name: 'CISSP-EXAM-SKU-001',
          variant: {
            id: 1,
            sku: 'CISSP',
            attributesRaw: [{ name: 'copy_name', value: 'CISSP Certification Exam' }],
          },
        }),
      ],
    });

    const data = buildQuoteData({ cart, personalInformation: basePersonalInformation() });

    expect(data.lineItems[0].name).toBe('CISSP Certification Exam');
  });

  it('falls back to the name attribute, then the raw product name, when copy_name is absent', () => {
    const cartWithNameAttribute = baseCart({
      lineItems: [
        baseLineItem({
          name: 'CISSP-EXAM-SKU-001',
          variant: {
            id: 1,
            sku: 'CISSP',
            attributesRaw: [{ name: 'name', value: 'CISSP Exam (attribute)' }],
          },
        }),
      ],
    });

    expect(
      buildQuoteData({
        cart: cartWithNameAttribute,
        personalInformation: basePersonalInformation(),
      }).lineItems[0].name
    ).toBe('CISSP Exam (attribute)');

    expect(
      buildQuoteData({ cart: baseCart(), personalInformation: basePersonalInformation() })
        .lineItems[0].name
    ).toBe('CISSP Exam');
  });

  it('mirrors listPrice into discountedPrice and sets hasDiscount false when undiscounted', () => {
    const data = buildQuoteData({
      cart: baseCart(),
      personalInformation: basePersonalInformation(),
    });

    expect(data.lineItems[0].discountedPrice).toBe(data.lineItems[0].listPrice);
    expect(data.lineItems[0].hasDiscount).toBe(false);
  });

  it('reports the real discounted price and hasDiscount true when the line is discounted', () => {
    const cart = baseCart({
      lineItems: [
        baseLineItem({
          price: {
            value: money(71250),
            discounted: { value: money(60000), discount: { name: 'promo' } },
          },
        }),
      ],
    });

    const data = buildQuoteData({ cart, personalInformation: basePersonalInformation() });

    expect(data.lineItems[0].discountedPrice).toBe('USD 600.00');
    expect(data.lineItems[0].hasDiscount).toBe(true);
  });

  it('flattens bundle line items into their nested products', () => {
    const cart = baseCart({
      lineItems: [
        {
          id: 'bundle-1',
          bundleSku: 'bundle-sku',
          products: [baseLineItem({ id: 'line-2', name: 'Bundled Course' })],
          quantity: 1,
          productType: { id: 'bundle', name: 'bundle' },
          productKey: 'bundle-sku',
          variant: { sku: 'bundle-sku' },
          name: 'Bundle',
          availableQuantity: 5,
          totalPrice: money(71250),
          nonMemberPrice: money(71250),
          price: { value: money(71250), discounted: null },
        },
      ],
    });

    const data = buildQuoteData({ cart, personalInformation: basePersonalInformation() });

    expect(data.lineItems).toHaveLength(1);
    expect(data.lineItems[0].name).toBe('Bundled Course');
  });

  it('uses the checkout form billing address for Bill To when "same as shipping" is unchecked', () => {
    const personalInformation = basePersonalInformation({
      isSameAddress: false,
      billingAddress: {
        street: '999 entered billing street',
        city: 'Somewhere Else',
        stateCode: 'CA',
        postalCode: '90001',
        countryCode: 'US',
      },
    });

    const data = buildQuoteData({ cart: baseCart(), personalInformation });

    expect(data.billingAddressLines).toContain('999 entered billing street');
  });

  it('spells out country/state codes instead of printing raw codes', () => {
    const personalInformation = basePersonalInformation({
      isSameAddress: false,
      billingAddress: {
        street: 'G1-G2, Jio World Drive',
        city: 'Mumbai',
        stateCode: 'MH',
        postalCode: '400051',
        countryCode: 'IN',
      },
    });

    const data = buildQuoteData({ cart: baseCart(), personalInformation });

    expect(data.billingAddressLines).toContain('Mumbai, Maharashtra, 400051');
    expect(data.billingAddressLines).toContain('India');
    expect(data.billingAddressLines).not.toContain('IN');
  });

  it('falls back to the raw code when the country/state is unrecognized', () => {
    const personalInformation = basePersonalInformation({
      isSameAddress: false,
      billingAddress: {
        street: '1 Nowhere Lane',
        city: 'Nowhere',
        stateCode: 'ZZ',
        postalCode: '00000',
        countryCode: 'ZZ',
      },
    });

    const data = buildQuoteData({ cart: baseCart(), personalInformation });

    expect(data.billingAddressLines).toContain('Nowhere, ZZ, 00000');
    expect(data.billingAddressLines).toContain('ZZ');
  });

  it('reads billing from the checkout form and shipping from the cart when they differ and are not "same"', () => {
    // A real case this covers: buyer bills to HQ but ships to a branch office. Bill To
    // must not silently fall back to whatever Ship To happens to be, or vice versa.
    const cart = baseCart({
      shippingAddress: {
        streetName: '2 Branch Office Way',
        city: 'Orlando',
        state: 'FL',
        postalCode: '32801',
        country: 'US',
      },
    });

    const personalInformation = basePersonalInformation({
      isSameAddress: false,
      billingAddress: {
        street: '1 HQ Plaza',
        city: 'Minneapolis',
        stateCode: 'MN',
        postalCode: '55402',
        countryCode: 'US',
      },
    });

    const data = buildQuoteData({ cart, personalInformation });

    expect(data.billingAddressLines).toContain('1 HQ Plaza');
    expect(data.shippingAddressLines).toContain('2 Branch Office Way');
    expect(data.billingAddressLines).not.toEqual(data.shippingAddressLines);
  });

  it('uses the account shipping address (accountContactRelations) for Ship To when given', () => {
    const accountShippingAddress = {
      street: 'G1-G2, Jio World Drive, Bandra Kurla Complex, Bandra East,',
      city: 'Mumbai',
      stateCode: 'MH',
      postalCode: '400051',
      countryCode: 'IN',
    };

    const data = buildQuoteData({
      cart: baseCart(),
      personalInformation: basePersonalInformation({ isSameAddress: false }),
      accountShippingAddress,
    });

    expect(data.shippingAddressLines).toContain(
      'G1-G2, Jio World Drive, Bandra Kurla Complex, Bandra East,'
    );
    expect(data.shippingAddressLines).toContain('Mumbai, Maharashtra, 400051');
    // Not the cart's own shippingAddress fixture ("123 billing street").
    expect(data.shippingAddressLines).not.toContain('123 billing street');
  });

  it('mirrors the account shipping address onto Bill To when "same as shipping" is checked', () => {
    const accountShippingAddress = {
      street: 'G1-G2, Jio World Drive',
      city: 'Mumbai',
      stateCode: 'MH',
      postalCode: '400051',
      countryCode: 'IN',
    };

    const data = buildQuoteData({
      cart: baseCart(),
      personalInformation: basePersonalInformation({ isSameAddress: true }),
      accountShippingAddress,
    });

    expect(data.billingAddressLines).toEqual(data.shippingAddressLines);
    expect(data.billingAddressLines).toContain('G1-G2, Jio World Drive');
  });

  it('uses the checkout form billing address, not the account address, when "same as shipping" is unchecked', () => {
    const accountShippingAddress = {
      street: 'G1-G2, Jio World Drive',
      city: 'Mumbai',
      stateCode: 'MH',
      postalCode: '400051',
      countryCode: 'IN',
    };

    const personalInformation = basePersonalInformation({
      isSameAddress: false,
      billingAddress: {
        street: '1 Entered Billing St',
        city: 'Denver',
        stateCode: 'CO',
        postalCode: '80014',
        countryCode: 'US',
      },
    });

    const data = buildQuoteData({
      cart: baseCart(),
      personalInformation,
      accountShippingAddress,
    });

    expect(data.billingAddressLines).toContain('1 Entered Billing St');
    expect(data.billingAddressLines).not.toEqual(data.shippingAddressLines);
  });

  it('falls back to the cart shipping address when there is no account (individual/B2C buyer)', () => {
    const data = buildQuoteData({
      cart: baseCart(),
      personalInformation: basePersonalInformation(),
    });

    expect(data.shippingAddressLines).toContain('123 billing street');
  });

  it('builds the buyer name from first and last name', () => {
    const data = buildQuoteData({
      cart: baseCart(),
      personalInformation: basePersonalInformation(),
    });

    expect(data.buyerName).toBe('Nick Candidate');
  });
});
