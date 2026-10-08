/**
 * @jest-environment jsdom
 */
import { LOCALSTORAGE_KEYS } from 'constants/index';

import {
  buildCartContextKey,
  clearAnonymousCartId,
  forgetCartId,
  readCartId,
  writeCartId,
} from './cartIdStore';

const EXTERNAL_ID = 'a7f1e780-3734-60ad-0dcc-d79c3b6fcdbb';
const OTHER_EXTERNAL_ID = 'b1c2d3e4-0000-0000-0000-000000000000';
const BUSINESS_ACCOUNT_ID = '001jI000000ExLEQA0';

const personalKey = buildCartContextKey(EXTERNAL_ID);
const businessKey = buildCartContextKey(EXTERNAL_ID, BUSINESS_ACCOUNT_ID);

beforeEach(() => {
  localStorage.clear();
});

describe('buildCartContextKey', () => {
  it('namespaces every key by the shopper, and keeps personal apart from a business account', () => {
    expect(personalKey).toBe(`${EXTERNAL_ID}:personal`);
    expect(businessKey).toBe(`${EXTERNAL_ID}:${BUSINESS_ACCOUNT_ID}`);
    expect(personalKey).not.toBe(businessKey);
  });

  it('has no key for a shopper who is not signed in', () => {
    expect(buildCartContextKey(undefined, BUSINESS_ACCOUNT_ID)).toBe('');
  });
});

describe('clearAnonymousCartId', () => {
  it('keeps the keyed carts so a signed-out shopper gets them back on the next sign-in', () => {
    writeCartId(personalKey, 'personal-cart');
    writeCartId(businessKey, 'business-cart');

    clearAnonymousCartId();

    expect(readCartId(personalKey)).toBe('personal-cart');
    expect(readCartId(businessKey)).toBe('business-cart');
  });

  it('drops the unkeyed id, so a personal context no longer inherits the anonymous cart', () => {
    localStorage.setItem(LOCALSTORAGE_KEYS.ACTIVE_CART_ID, 'anonymous-cart');

    clearAnonymousCartId();

    expect(localStorage.getItem(LOCALSTORAGE_KEYS.ACTIVE_CART_ID)).toBeNull();
    expect(readCartId(personalKey)).toBe('');
  });

  it('leaves nothing for the next shopper to pick up on a shared device', () => {
    writeCartId(businessKey, 'business-cart');
    localStorage.setItem(LOCALSTORAGE_KEYS.ACTIVE_CART_ID, 'anonymous-cart');

    clearAnonymousCartId();

    expect(readCartId(buildCartContextKey(OTHER_EXTERNAL_ID))).toBe('');
    expect(readCartId(buildCartContextKey(OTHER_EXTERNAL_ID, BUSINESS_ACCOUNT_ID))).toBe('');
  });
});

describe('readCartId', () => {
  it('falls back to the legacy unkeyed id for a personal context only', () => {
    localStorage.setItem(LOCALSTORAGE_KEYS.ACTIVE_CART_ID, '"legacy-cart"');

    expect(readCartId(personalKey)).toBe('legacy-cart');
    expect(readCartId(businessKey)).toBe('');
  });
});

describe('forgetCartId', () => {
  it('removes an unreachable cart from every context holding it', () => {
    writeCartId(personalKey, 'personal-cart');
    writeCartId(businessKey, 'business-cart');

    forgetCartId('business-cart');

    expect(readCartId(businessKey)).toBe('');
    expect(readCartId(personalKey)).toBe('personal-cart');
  });
});
