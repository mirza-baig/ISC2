import {
  canEditQuantityForBuyerContext,
  resolveBuyerContext,
  resolveMiniCartCartHref,
  resolveMiniCartNavigation,
  shouldMiniCartGoToCheckout,
} from './b2bBuyerContext';

describe('resolveBuyerContext', () => {
  it('maps shopper context "myself" to Myself', () => {
    expect(resolveBuyerContext('myself')).toBe('Myself');
  });

  it('maps shopper context "organization" to Organization', () => {
    expect(resolveBuyerContext('organization')).toBe('Organization');
  });

  it('is null when no shopper context is selected', () => {
    expect(resolveBuyerContext(null)).toBeNull();
    expect(resolveBuyerContext(undefined)).toBeNull();
  });
});

describe('Mini Cart routing (ITDEV-1187)', () => {
  it('sends an Authorized Buyer shopping as Myself to the cart page', () => {
    expect(resolveMiniCartNavigation(true, 'Myself', '/cart')).toEqual({
      skipToCheckout: false,
      destination: '/cart',
    });
    expect(shouldMiniCartGoToCheckout(true, 'Myself')).toBe(false);
  });

  it('falls back to /cart when Myself has no authored CTA href', () => {
    expect(resolveMiniCartNavigation(true, 'Myself')).toEqual({
      skipToCheckout: false,
      destination: '/cart',
    });
  });

  it('keeps Organization Authorized Buyers on the checkout hop', () => {
    expect(resolveMiniCartNavigation(true, 'Organization', '/cart')).toEqual({
      skipToCheckout: true,
      destination: '/checkout',
    });
    expect(shouldMiniCartGoToCheckout(true, 'Organization')).toBe(true);
  });

  it('sends non-buyers to the cart page in either context', () => {
    expect(resolveMiniCartNavigation(false, 'Myself', '/cart').destination).toBe('/cart');
    expect(resolveMiniCartNavigation(false, 'Organization', '/cart').destination).toBe('/cart');
    expect(shouldMiniCartGoToCheckout(false, 'Organization')).toBe(false);
  });

  it('does not change checkout skip when shopper context is unset', () => {
    expect(shouldMiniCartGoToCheckout(true, null)).toBe(true);
    expect(resolveMiniCartNavigation(true, null, '/cart').destination).toBe('/checkout');
  });

  it('uses the authored cart href when present', () => {
    expect(resolveMiniCartCartHref('/en/cart')).toBe('/en/cart');
    expect(resolveMiniCartCartHref(undefined)).toBe('/cart');
  });
});

describe('Mini Cart quantity editing (ITDEV-1187)', () => {
  it('disables quantity controls for Myself, including Authorized Buyers', () => {
    expect(canEditQuantityForBuyerContext(true, 'Myself')).toBe(false);
    expect(canEditQuantityForBuyerContext(false, 'Myself')).toBe(false);
  });

  it('allows quantity controls for Organization Authorized Buyers', () => {
    expect(canEditQuantityForBuyerContext(true, 'Organization')).toBe(true);
  });

  it('does not grant quantity editing to non-buyers shopping for an organization', () => {
    expect(canEditQuantityForBuyerContext(false, 'Organization')).toBe(false);
  });

  it('keeps Authorized Buyer quantity editing when shopper context is unset', () => {
    expect(canEditQuantityForBuyerContext(true, null)).toBe(true);
  });
});
