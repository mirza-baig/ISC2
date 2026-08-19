import { useCallback, useEffect, useRef } from 'react';

import { useB2BCartAccess, useCartPreload } from 'hooks/index';
import { useModal } from 'providers/index';
import { GenericModal } from 'ui/index';

import { useB2BCartLabels } from './B2BPrivateClassContext';
import { filterRawQueryParts } from './b2bQueryString';

/**
 * `?cart-sku=` link pre-fill for the B2B PLP (CART-3).
 *
 * The site has always supported building a link that lands a shopper on a page with items already
 * in their cart — `?cart-sku=SKU[_PRODUCTSKU][_QTY]`, repeatable — but until now only the **cart
 * page** consumed it (`Cart/ShoppingCart`). This component brings the same mechanism to the B2B
 * listing so a sales-built link can drop a whole order into the PLP's on-page cart.
 *
 * **Nothing is reimplemented:** it calls the very same shared `useCartPreload` hook, with
 * `openCartOnSuccess: false` so the app-wide swing-out mini cart stays shut on this page (CART-2 —
 * the PLP has its own docked cart). The two differences from the cart page are the ones the PLP
 * needs: the panel reports progress itself (see `onStateChange`), and the "some items were skipped"
 * notice is built from B2B labels rather than the cart page's rendering datasource.
 *
 * **A component rather than a hook call in SearchWrapper** because the pre-fill must be *absent*,
 * not merely inert, unless it applies: it runs only where the parent renders it — behind the B2B
 * feature flag, on the B2B listing template, and never for a CPQ cart, which is read-only (CTX-5).
 * A hook can't be called conditionally, and a hook that no-ops still subscribes every visitor of
 * every other search page to the cart/inventory work this does.
 *
 * It also **clears the link out of the address bar once it has been consumed** — see
 * `clearCartSkuParams` below — which the cart page deliberately does not do.
 *
 * Renders no markup of its own.
 */

/**
 * Drops every `cart-sku` param from a query string, leaving the rest of it **byte for byte** as it
 * was.
 *
 * Hence the hand-rolled split rather than `URLSearchParams.delete` + `toString()`: re-serialising
 * would re-encode the facet params this page deliberately writes in readable form (spaces as
 * dashes, legal characters left literal — see `b2bUrlValueEncoder` in SearchWrapper), turning a
 * shareable `?certification=CISSP&region=emea01` into percent-escape noise on the way past.
 */
const withoutCartSkuParams = (search: string): string =>
  filterRawQueryParts(search, (key) => key !== 'cart-sku').join('&');

/**
 * Rewrites the address bar without its `cart-sku` params, or does nothing if there are none.
 *
 * `replaceState`, not `push`: consuming a pre-fill link is not a navigation the back button should
 * undo — the same reason the `?sort=` / `?price=` writes in SearchWrapper use it. It also leaves
 * InstantSearch undisturbed: the history router only reacts to `popstate`, which `replaceState`
 * does not raise.
 */
const clearCartSkuFromUrl = (): void => {
  if (typeof window === 'undefined') {
    return;
  }
  const { origin, pathname, search, hash } = window.location;
  const nextQuery = withoutCartSkuParams(search);
  if (nextQuery === search.replace(/^\?/, '')) {
    return;
  }
  window.history.replaceState(
    window.history.state,
    '',
    `${origin}${pathname}${nextQuery ? `?${nextQuery}` : ''}${hash}`
  );
};

/**
 * How long after the first clear to repeat it, in ms.
 *
 * InstantSearch's history router builds its URL the moment the search state changes but writes it
 * `writeDelay` milliseconds later — 400 by default, which is what this page's `historyRouter` uses.
 * That URL is composed from the location as it was when the state changed, so a write already in
 * flight when the pre-fill settles would put the param straight back. Repeating the clear just past
 * that window is deterministic (a write queued before the clear always lands before the repeat) and
 * costs one no-op call in the normal case.
 */
const ROUTER_WRITE_SETTLE_MS = 500;

interface B2BPlpCartPreloadProps {
  /**
   * Reports the pre-fill's progress up to the page, which passes `isPreloading` to the cart panel
   * (it opens straight away with a status line instead of appearing out of nowhere once the adds
   * land). Kept as a callback so this component owns no layout.
   */
  onStateChange: (state: { isPreloading: boolean }) => void;
}

const B2BPlpCartPreload = ({ onStateChange }: B2BPlpCartPreloadProps): null => {
  /**
   * Take the `?cart-sku=` entries back out of the address bar once the pre-fill has finished with
   * them — added, already in the cart, or rejected alike.
   *
   * A cart-sku link is a one-shot instruction, but the URL it lands on is long-lived: refining
   * filters rewrites the query string and, because `cart-sku` isn't a routing-owned param, it is
   * carried along untouched (`withPreservedParams` in SearchWrapper). So a link that has already
   * done its job keeps riding on every URL the shopper then builds, copies or bookmarks — and a
   * reload of one of those re-runs the pre-fill against a cart the shopper has since edited,
   * re-adding a line they removed. Clearing it once it is spent leaves the filter URL clean.
   *
   * Never runs while an add is still in flight: it fires only from the hook's `onSettled`, which is
   * reached after the last `addToCartAsync` has resolved (or the run has bailed). The param has to
   * survive until then — the hook re-reads it from `window.location` on each pass, so clearing it
   * early would cancel the very adds this link asked for.
   *
   * Cleared twice, on purpose — see `ROUTER_WRITE_SETTLE_MS`.
   *
   * B2B PLP only, by construction: this component is rendered nowhere else. The cart page's own
   * pre-fill passes no `onSettled` and keeps its URL exactly as it is today.
   */
  const reclearTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const clearCartSkuParams = useCallback(() => {
    clearCartSkuFromUrl();
    reclearTimerRef.current = setTimeout(clearCartSkuFromUrl, ROUTER_WRITE_SETTLE_MS);
  }, []);
  useEffect(() => () => clearTimeout(reclearTimerRef.current), []);

  // The `_QTY` part of the link is an Authorized Buyer privilege wherever the link is opened
  // (2026-08-17), so this surface passes the same two values the cart page does instead of leaning
  // on the B2B-admin claim the hook used to accept. `isResolvingAccess` holds the pre-fill for the
  // moment the role takes to resolve — without it the link would be spent at quantity 1 and
  // `addedSkusRef` would mark the SKU done before the answer arrived.
  const { canEditQuantity, isResolvingAccess } = useB2BCartAccess();

  const { isPreloading, hasPreloadWarning } = useCartPreload({
    openCartOnSuccess: false,
    onSettled: clearCartSkuParams,
    allowUrlQuantity: canEditQuantity,
    isUrlQuantityResolving: isResolvingAccess,
  });
  const { setModalContent } = useModal();
  const labels = useB2BCartLabels();
  const warnedRef = useRef(false);

  useEffect(() => {
    onStateChange({ isPreloading });
  }, [isPreloading, onStateChange]);

  // Once only: the hook latches `hasPreloadWarning` on, so without the ref a later re-render would
  // reopen a modal the shopper has already dismissed.
  useEffect(() => {
    if (!hasPreloadWarning || isPreloading || warnedRef.current) {
      return;
    }
    warnedRef.current = true;
    setModalContent(
      <GenericModal
        heading={labels.preloadWarningHeading}
        description={labels.preloadWarningDescription}
        primaryCtaLabel={labels.preloadWarningConfirm}
      />
    );
  }, [hasPreloadWarning, isPreloading, labels, setModalContent]);

  return null;
};

export default B2BPlpCartPreload;
