import { Cart } from 'types/index';

import { fetchActiveCart, shouldLookUpSavedCart } from './fetchActiveCart';

const usdCart = { id: 'org-cart', totalPrice: { currencyCode: 'USD' } } as unknown as Cart;
const sgdCart = { id: 'new-cart', totalPrice: { currencyCode: 'SGD' } } as unknown as Cart;

const signedInLookup = {
  currency: 'SGD',
  country: 'SG',
  userEmailAddress: 'buyer@example.com',
  userExternalId: 'ext-1',
  shopperContext: { type: 'organization', businessAccountId: 'acct-1' },
};

describe('shouldLookUpSavedCart', () => {
  it('looks up the saved cart for a signed-in shopper with no cart id in this browser', () => {
    expect(shouldLookUpSavedCart(signedInLookup)).toBe(true);
  });

  it('skips the lookup when the browser already holds a cart id', () => {
    expect(shouldLookUpSavedCart({ ...signedInLookup, cartID: 'cart-1' })).toBe(false);
  });

  it('skips the lookup for anonymous shoppers', () => {
    expect(shouldLookUpSavedCart({ currency: 'USD', country: 'US' })).toBe(false);
  });
});

describe('fetchActiveCart (ITDEV-1537)', () => {
  it('returns the saved cart in its own currency when signing in from a new browser', async () => {
    const post = jest.fn().mockResolvedValue({ data: { isc2GetCart: usdCart } });

    await expect(fetchActiveCart(post, signedInLookup)).resolves.toBe(usdCart);
    expect(post).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledWith({ ...signedInLookup, currency: undefined });
  });

  it('falls back to the currency request when no saved cart exists', async () => {
    const post = jest
      .fn()
      .mockResolvedValueOnce({ data: null, errors: [{ message: 'Missing currency.' }] })
      .mockResolvedValueOnce({ data: { isc2GetCart: sgdCart } });

    await expect(fetchActiveCart(post, signedInLookup)).resolves.toBe(sgdCart);
    expect(post).toHaveBeenLastCalledWith(signedInLookup);
  });

  it('sends a single request when the cart id is known', async () => {
    const post = jest.fn().mockResolvedValue({ data: { isc2GetCart: usdCart } });
    const cartInfo = { ...signedInLookup, cartID: 'org-cart' };

    await expect(fetchActiveCart(post, cartInfo)).resolves.toBe(usdCart);
    expect(post).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledWith(cartInfo);
  });

  it('throws the service layer error from the currency request', async () => {
    const error = { message: 'Cart not found' };
    const post = jest.fn().mockResolvedValue({ data: null, errors: [error] });

    await expect(fetchActiveCart(post, { cartID: 'gone', currency: 'USD' })).rejects.toBe(error);
  });
});
