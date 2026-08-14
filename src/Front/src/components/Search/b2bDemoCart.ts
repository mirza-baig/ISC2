import { useSyncExternalStore } from 'react';

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
 * B2BPlpCart, and SearchWrapper (all marked "TEMP"/"demo").
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

let state: DemoCartState = { inCart: false, quantity: 0 };
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((listener) => listener());
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
const getSnapshot = () => state;

export const b2bDemoCartActions = {
  add(quantity: number) {
    state = { inCart: true, quantity: Math.max(1, quantity) };
    emit();
  },
  setQuantity(quantity: number) {
    state = { ...state, quantity: Math.max(1, quantity) };
    emit();
  },
  remove() {
    state = { inCart: false, quantity: 0 };
    emit();
  },
};

export function useB2BDemoCart(): DemoCartState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
