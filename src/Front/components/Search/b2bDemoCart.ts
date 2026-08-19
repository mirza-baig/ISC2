import { useEffect, useSyncExternalStore } from 'react';

import { clampToAtLeastOne } from 'hooks/cart/b2bLineQuantity';

/**
 * TEMPORARY demo-cart store — remove before release (paired with B2BDemoPrivateClassRow).
 *
 * The demo private-class product uses a made-up SKU, so it can't be added to the real
 * commercetools cart. This tiny client-side store lets the demo row, the on-page mini-cart, and
 * SearchWrapper's cart-open logic share a fake "in cart" state so the whole flow (add → cart
 * opens → private-class fields in the cart) can be previewed. The scheduling answers themselves
 * still flow through the real B2BPrivateClassContext (keyed by DEMO_SKU), so the row and the
 * cart line stay in sync exactly like production.
 *
 * To remove: delete this file, B2BDemoPrivateClassRow.tsx, and their usages in SearchResults,
 * B2BPlpCart, SearchWrapper, B2BCartConnected and B2BCart/useB2BCartExtraLines.ts (all marked
 * "TEMP"/"demo") — the last of those is what the cart page and the mini cart ask before they decide
 * a cart is empty, so making it return `false` is enough to put both back on commercetools alone.
 */

export const DEMO_SKU = 'DEMO-CLASSROOM-001';
export const DEMO_TITLE = 'CCSP Classroom Training: 5 Days (DEMO)';
export const DEMO_META = '5 Days • Instructor-Led • In Person';
export const DEMO_MORE_INFO =
  'Temporary demo product for previewing the private-class questions. It uses a made-up SKU, so Add/Update/Remove here do not touch commercetools.';
export const DEMO_UNIT_PRICE = 1039;
export const DEMO_ORIGINAL_PRICE = 1299;

interface DemoCartState {
  inCart: boolean;
  quantity: number;
}

const INITIAL_STATE: DemoCartState = { inCart: false, quantity: 0 };

let state: DemoCartState = INITIAL_STATE;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((listener) => listener());
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
const getSnapshot = () => state;
const getServerSnapshot = () => INITIAL_STATE;

const STORAGE_KEY = 'b2b-demo-cart';
let hydrated = false;

const persist = () => {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    void error;
  }
};

const hydrateFromSession = () => {
  if (hydrated || typeof window === 'undefined') {
    return;
  }
  hydrated = true;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }
    const stored = JSON.parse(raw) as Partial<DemoCartState> | null;
    if (stored?.inCart) {
      state = { inCart: true, quantity: clampToAtLeastOne(Number(stored.quantity)) };
      emit();
    }
  } catch (error) {
    void error;
  }
};

export const b2bDemoCartActions = {
  add(quantity: number) {
    state = { inCart: true, quantity: clampToAtLeastOne(quantity) };
    persist();
    emit();
  },
  setQuantity(quantity: number) {
    state = { ...state, quantity: clampToAtLeastOne(quantity) };
    persist();
    emit();
  },
  remove() {
    state = INITIAL_STATE;
    persist();
    emit();
  },
};

export function useB2BDemoCart(): DemoCartState {
  useEffect(hydrateFromSession, []);
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
