/**
 * @jest-environment jsdom
 */
import { LOCALSTORAGE_KEYS } from 'constants/index';
import { randomUUID } from 'crypto';

import { getAllocationDetailOrderNumber, getOrCreateAllocationDetailRef } from './allocations';

jest.mock('providers/index', () => ({}));
jest.mock('hooks/index', () => ({}));

const KEY = LOCALSTORAGE_KEYS.ALLOCATION_DETAIL_REFS;

Object.defineProperty(globalThis, 'crypto', { value: { randomUUID }, configurable: true });

describe('allocation detail refs', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns an empty string for an empty order number', () => {
    expect(getOrCreateAllocationDetailRef('')).toBe('');
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it('creates a token that does not contain the order number and stores the mapping', () => {
    const ref = getOrCreateAllocationDetailRef('ORD-1001');

    expect(ref).toBeTruthy();
    expect(ref).not.toContain('ORD-1001');
    expect(JSON.parse(localStorage.getItem(KEY) as string)).toEqual({ [ref]: 'ORD-1001' });
  });

  it('reuses the existing token for the same order number', () => {
    const first = getOrCreateAllocationDetailRef('ORD-1001');
    const second = getOrCreateAllocationDetailRef('ORD-1001');

    expect(second).toBe(first);
  });

  it('creates distinct tokens for different order numbers', () => {
    const a = getOrCreateAllocationDetailRef('ORD-1001');
    const b = getOrCreateAllocationDetailRef('ORD-1002');

    expect(a).not.toBe(b);
    expect(getAllocationDetailOrderNumber(a)).toBe('ORD-1001');
    expect(getAllocationDetailOrderNumber(b)).toBe('ORD-1002');
  });

  it('tolerates corrupt stored JSON', () => {
    localStorage.setItem(KEY, '{not json');

    const ref = getOrCreateAllocationDetailRef('ORD-1001');

    expect(getAllocationDetailOrderNumber(ref)).toBe('ORD-1001');
  });

  it('tolerates a non-object stored value', () => {
    localStorage.setItem(KEY, '[1,2]');

    expect(getAllocationDetailOrderNumber('anything')).toBe('');
    expect(getOrCreateAllocationDetailRef('ORD-1')).toBeTruthy();
  });

  it('returns an empty string for a missing or empty ref', () => {
    expect(getAllocationDetailOrderNumber('unknown')).toBe('');
    expect(getAllocationDetailOrderNumber('')).toBe('');
  });
});
