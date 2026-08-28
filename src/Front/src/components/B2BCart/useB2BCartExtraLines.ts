// Private classes are deferred to a later phase (bug sweep 2026-08-19) — the demo-cart import is
// commented out to match b2bDemoCart.ts; this always returns false so the cart page and mini cart's
// cart-empty check falls back to commercetools alone.
// import { useB2BDemoCart } from '../Search/b2bDemoCart';

export const useHasB2BCartExtraLines = (): boolean => false;

export default useHasB2BCartExtraLines;
