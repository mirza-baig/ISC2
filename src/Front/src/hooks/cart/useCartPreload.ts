import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  useAddToCart,
  useGetDistributionChannel,
  useGetInventory,
  useLoggedUser,
} from 'hooks/index';
import { useCart, useLayout, useUserSession } from 'providers/index';
import { useFeatureFlag } from 'providers/featureFlags';
import { AddToCartHit } from 'types/index';
import type { CartLineItem } from 'types/index';
import { CT_BANNED_TIERS } from 'types/pricing';
import { INNER_PROVIDER_KEY, ProductHit } from 'types/forms';
import { B2B_FEATURE_FLAG } from 'constants/b2b';
import { getChannel, getProductSelectorSearchResult } from 'utils/product-form';
import { isDonationItem } from 'utils/cart';
import useUpdateLineItemQuantity from './useUpdateLineItemQuantity';

/**
 * Ceiling on a URL-supplied quantity (`?cart-sku=SKU_5`). Only ever consulted on the B2B path —
 * see `isUrlQuantityEnabled` below; a link can't be used to bulk-add for anyone else.
 */
const MAX_QUANTITY = 10;

type CartSkuEntry = { sku: string; productSku?: string; quantity: number };

const parseCartSkuParam = (raw: string): CartSkuEntry | null => {
  const parts = raw.trim().toUpperCase().split('_');
  if (!parts[0]) return null;

  const lastPart = parts[parts.length - 1];
  const lastIsNumber = /^\d+$/.test(lastPart);
  // Parsed unconditionally, APPLIED conditionally: whether this number is honoured or forced back
  // to 1 is decided at the single point of use (`effectiveQty`), which is where the B2B gate lives.
  const quantity = lastIsNumber ? Math.min(parseInt(lastPart, 10), MAX_QUANTITY) : 1;
  const skuParts = lastIsNumber ? parts.slice(0, -1) : parts;

  if (!skuParts[0]) return null;

  if (skuParts.length === 1) {
    return { sku: skuParts[0], quantity };
  }

  const sku = skuParts[0];
  const productSku = skuParts.slice(1).join('_');
  return sku && productSku ? { sku, productSku, quantity } : null;
};

/**
 * Reads the `?cart-sku=` entries straight off `window.location`, in URL order, dropping any that
 * don't parse. Re-read (rather than captured once) on every pass of the pre-fill effect, because
 * consuming the link clears the params — see `B2BPlpCartPreload`.
 */
const readCartSkuEntries = (): CartSkuEntry[] => {
  if (typeof window === 'undefined') return [];
  const searchParams = new URLSearchParams(window.location.search);
  const rawParams: string[] = [];
  searchParams.forEach((value, key) => {
    if (key.toLowerCase() === 'cart-sku') rawParams.push(value);
  });
  return rawParams.map(parseCartSkuParam).filter((e): e is CartSkuEntry => e !== null);
};

type UseCartPreloadOptions = {
  openCartOnSuccess?: boolean;
  /**
   * Called **once**, as soon as the `?cart-sku=` entries read from the URL have been dealt with —
   * added, skipped because they are already in the cart, or rejected (unknown SKU, out of stock,
   * banned tier, currency mismatch). Fires on the failure paths too, so a caller can treat it as
   * "this link has been consumed, whatever the outcome".
   *
   * **Opt-in and inert unless passed** — every existing caller is unaffected. It exists because
   * only this hook knows when the pre-fill has actually finished, while what to *do* about that is
   * the calling page's business: the B2B PLP uses it to strip the param out of the address bar so
   * a later reload of a URL that has since collected filter params doesn't re-trigger the link
   * (see `B2BPlpCartPreload`). Deliberately terminal: a bail-out is settled too, so a link that was
   * rejected is not re-attempted if the condition that rejected it later changes.
   */
  onSettled?: () => void;
  allowUrlQuantity?: boolean;
  isUrlQuantityResolving?: boolean;
};

const useCartPreload = ({
  openCartOnSuccess = true,
  onSettled,
  allowUrlQuantity = false,
  isUrlQuantityResolving = false,
}: UseCartPreloadOptions = {}) => {
  const { activeCart, isGettingCart } = useCart();
  const { openMiniCart } = useLayout();
  const { currencyCode, geolocationCountry, userCountry } = useUserSession();
  const { isB2BAdminUser } = useLoggedUser();
  const isB2BFeatureEnabled = useFeatureFlag(B2B_FEATURE_FLAG);
  /**
   * **B2B-only, feature-flagged, and Authorized Buyers only.** A `?cart-sku=SKU_5` link adds 5 for
   * a caller that opts in with `allowUrlQuantity` — which every caller feeds from
   * `useB2BCartAccess().canEditQuantity`, the Authorized Buyer privilege (CART-F) — and **1 for
   * everybody else**. B2C is capped at one unit per line (QTY-1), so honouring a URL quantity
   * elsewhere would be a way around that cap, and the requester's rule (2026-08-17) is that the
   * quantity portion of the link is an Authorized Buyer privilege and nothing else: being a B2B
   * admin does **not** grant it, which is why `isB2BAdminUser` is not consulted here. The opt-in
   * also stops at a CPQ/quoted cart: those lines are read-only (CTX-5), so a link must not
   * bulk-add into one. With the flag off, every caller behaves exactly as it did before:
   * quantity 1.
   *
   * On this path the link is also **authoritative for a SKU already in the cart** — see
   * `syncExistingLine` in the loop below.
   */
  const isUrlQuantityEnabled =
    isB2BFeatureEnabled && allowUrlQuantity && !activeCart.computed.isB2B;
  const isUrlQuantityPending = isUrlQuantityResolving && !isUrlQuantityEnabled;
  const { distributionChannel } = useGetDistributionChannel();
  const { addToCartAsync } = useAddToCart();
  const addedSkusRef = useRef<Set<string>>(new Set());

  // Held in a ref, like `onSettled` below: `updateQuantity` is a fresh arrow every render, so as an
  // effect dependency it would re-run the whole pre-fill on each one. Only ever called on the
  // Authorized Buyer path (`isUrlQuantityEnabled`), and it refuses a CPQ cart itself (CTX-5).
  const { updateQuantity } = useUpdateLineItemQuantity();
  const updateQuantityRef = useRef(updateQuantity);
  updateQuantityRef.current = updateQuantity;

  const [isPreloading, setIsPreloading] = useState(false);
  const [hasPreloadWarning, setHasPreloadWarning] = useState(false);

  // Kept in a ref so an inline `onSettled` arrow doesn't have to be a dependency of the effect
  // below (a fresh identity every render would re-run the whole pre-fill).
  const onSettledRef = useRef(onSettled);
  onSettledRef.current = onSettled;
  const hasSettledRef = useRef(false);

  // Every SKU the link names, variant and parent alike, for the one inventory lookup below.
  const urlSkus = useMemo(
    () =>
      readCartSkuEntries().flatMap(({ sku, productSku }) =>
        productSku ? [sku, productSku] : [sku]
      ),
    []
  );

  const hasCartSkuParam = urlSkus.length > 0;

  /**
   * Every way this hook can stop working on the URL's entries goes through here: it clears the
   * loading flag exactly as before and, the first time only, notifies the caller. The once-guard
   * matters because the effect re-runs on cart changes and would otherwise settle repeatedly, and
   * a page with no `cart-sku` param never notifies at all — there was no link to consume.
   */
  const settle = useCallback(() => {
    setIsPreloading(false);
    if (hasSettledRef.current || !hasCartSkuParam) {
      return;
    }
    hasSettledRef.current = true;
    onSettledRef.current?.();
  }, [hasCartSkuParam]);

  useEffect(() => {
    if (hasCartSkuParam) {
      setIsPreloading(true);
    }
  }, [hasCartSkuParam]);

  const { inventoryEntries, isGettingInventoryEntries } = useGetInventory({
    skuList: urlSkus,
    enabled: hasCartSkuParam,
  });

  const isBannedTier = useMemo(() => {
    const channels = distributionChannel?.channels;
    const geoLocationChannel = channels && getChannel(channels, geolocationCountry);
    const isGeoLocationForbidden = Boolean(
      geoLocationChannel?.key && CT_BANNED_TIERS.includes(geoLocationChannel.key)
    );
    const priceFlowLocationForbidden = Boolean(
      distributionChannel?.key && CT_BANNED_TIERS.includes(distributionChannel.key)
    );
    return isGeoLocationForbidden || priceFlowLocationForbidden;
  }, [distributionChannel, geolocationCountry]);

  useEffect(() => {
    if (isGettingCart || !currencyCode || !userCountry) {
      return;
    }
    if (urlSkus.length && isGettingInventoryEntries) {
      return;
    }
    if (hasCartSkuParam && isUrlQuantityPending) {
      return;
    }

    const entries = readCartSkuEntries();

    if (!entries.length) {
      settle();
      return;
    }
    if (isBannedTier) {
      settle();
      return;
    }
    if (!activeCart.computed.isEmpty && activeCart.computed.currencyCode !== currencyCode) {
      settle();
      return;
    }

    // Keyed the same two ways an entry can name a line — the variant SKU, and a bundle's product
    // key — so the quantity sync below can reach the line itself, not just know that it exists.
    // First line wins: a cart may legitimately hold the same bundle SKU twice (a class booked as
    // two separate occurrences), and a link has no way to say which one it means.
    const existingCartLines = new Map<string, CartLineItem>();
    for (const lineItem of activeCart.lineItems ?? []) {
      const keys: string[] = [];
      if (lineItem.variant?.sku) keys.push(lineItem.variant.sku);
      if (lineItem.productType?.id === 'bundle' && lineItem.productKey)
        keys.push(lineItem.productKey);
      for (const key of keys) {
        if (!existingCartLines.has(key)) existingCartLines.set(key, lineItem as CartLineItem);
      }
    }
    const existingCartSkus = new Set(existingCartLines.keys());

    const targetQuantityFor = (quantity: number) => (isUrlQuantityEnabled ? quantity : 1);

    const hasPendingItems = entries.some(({ sku, productSku, quantity }) => {
      const effectiveSku = productSku ?? sku;
      if (addedSkusRef.current.has(effectiveSku)) return false;
      const existingLine = existingCartLines.get(effectiveSku);
      // An entry the cart already has is still pending work on the Authorized Buyer path, because
      // there the link *sets* the quantity rather than only adding — see `syncExistingLine`.
      if (existingLine) {
        return isUrlQuantityEnabled && existingLine.quantity !== targetQuantityFor(quantity);
      }
      return true;
    });
    if (!hasPendingItems) {
      settle();
      return;
    }

    const run = async () => {
      const uniqueSkus = [
        ...new Set([
          ...entries.map((e) => e.sku),
          ...entries.flatMap((e) => (e.productSku ? [e.productSku] : [])),
        ]),
      ];
      const searchResult = await getProductSelectorSearchResult({ skus: uniqueSkus }).catch(
        () => null
      );
      const productMap = new Map<string, ProductHit | null>(
        uniqueSkus.map((sku) => [sku, searchResult?.hits.find((h) => h.sku === sku) ?? null])
      );

      const allowedEntries = entries.filter(({ sku }) => {
        const product = productMap.get(sku);
        if (!product) return !(isB2BAdminUser || activeCart.computed.isB2B);
        if (product.trainingProvider?.key && product.trainingProvider.key !== INNER_PROVIDER_KEY) {
          return false;
        }
        if ((isB2BAdminUser || activeCart.computed.isB2B) && isDonationItem(product.title ?? '')) {
          return false;
        }
        return true;
      });

      // A line already in the cart that this run will not reach — its SKU was filtered out just
      // above (another training provider, a donation for a B2B shopper) or the inventory gate below
      // rejects it (sold out, or a class whose start date has passed) — is left exactly as it is,
      // even when the link asks for a different quantity: a decrease is a remove-then-re-add, and
      // re-adding a SKU commercetools will no longer sell is how a line gets lost. Marked handled so
      // it stops reading as outstanding work on every later cart change (the effect re-runs on each
      // one, and the quantity sync means an untouched mismatch would otherwise stay outstanding).
      const markUnreachableExistingLines = (reachableSkus: Set<string>) => {
        for (const { sku, productSku } of entries) {
          const effectiveSku = productSku ?? sku;
          if (existingCartLines.has(effectiveSku) && !reachableSkus.has(effectiveSku)) {
            addedSkusRef.current.add(effectiveSku);
          }
        }
      };
      markUnreachableExistingLines(
        new Set(allowedEntries.map(({ sku, productSku }) => productSku ?? sku))
      );

      if (!allowedEntries.length) {
        settle();
        return;
      }

      // Mirror buy box inventory gating: schedule products (with a startDate) bypass the check;
      // all others require quantityOnStock > 0 in CT.
      const today = new Date();
      const inventoryCheckedEntries = allowedEntries.filter(({ sku, productSku }) => {
        const mainHit = productMap.get(sku);
        const variantHit = productSku ? productMap.get(productSku) : null;
        const startDate = mainHit?.startDate ?? variantHit?.startDate;
        if (startDate) {
          return new Date(startDate) >= today;
        }
        const effectiveSku = productSku ?? sku;
        return Boolean(inventoryEntries[effectiveSku]);
      });

      markUnreachableExistingLines(
        new Set(inventoryCheckedEntries.map(({ sku, productSku }) => productSku ?? sku))
      );

      const hasWarning = allowedEntries.some(({ sku, productSku }) => {
        const effectiveSku = productSku ?? sku;
        if (existingCartSkus.has(effectiveSku)) return false;
        const mainHit = productMap.get(sku);
        const variantHit = productSku ? productMap.get(productSku) : null;
        if (mainHit === null) return true;
        if (productSku !== undefined && variantHit === null) return true;
        const startDate = mainHit?.startDate ?? variantHit?.startDate;
        if (startDate && new Date(startDate) < today) return true;
        if (!startDate && !inventoryEntries[effectiveSku]) return true;
        return false;
      });

      if (hasWarning) {
        setHasPreloadWarning(true);
      }

      if (!inventoryCheckedEntries.length) {
        settle();
        return;
      }

      /**
       * The Authorized Buyer half of the link's quantity rule (2026-08-17): for that shopper the
       * link is **authoritative**, not additive. A SKU the cart already holds has its line set to
       * the quantity the link asks for — raised, lowered, or **reduced to 1 when the link carries
       * no `_QTY` at all** — using the same shared `useUpdateLineItemQuantity` the cart page's
       * Update button calls, so a decrease goes through the same remove-then-re-add it always has.
       *
       * For everyone else the older rule stands unchanged: an already-in-cart SKU is skipped
       * outright, never topped up and never reduced. That is what keeps B2C's one-unit-per-line cap
       * (QTY-1) intact and what every non-B2B caller of this hook still sees, since
       * `isUrlQuantityEnabled` is false for all of them.
       *
       * Marked in `addedSkusRef` whether or not the write succeeds: one attempt per SKU per page
       * life. The effect re-runs on every cart change, so an unmarked failed attempt on a line the
       * write moved but did not land on target would retry itself indefinitely.
       */
      const syncExistingLine = async (existingLine: CartLineItem, targetQty: number) => {
        if (!isUrlQuantityEnabled || existingLine.quantity === targetQty) return false;
        try {
          await updateQuantityRef.current(existingLine, targetQty);
          return true;
        } catch (err) {
          console.error('[useCartPreload] updateQuantity error:', err);
          return false;
        }
      };

      let addedAny = false;
      for (const { sku, productSku, quantity } of inventoryCheckedEntries) {
        const effectiveCartSku = productSku ?? sku;
        const effectiveQty = targetQuantityFor(quantity);
        const existingLine = existingCartLines.get(effectiveCartSku);
        if (existingLine) {
          const alreadyHandled = addedSkusRef.current.has(effectiveCartSku);
          addedSkusRef.current.add(effectiveCartSku);
          if (alreadyHandled) continue;
          if (await syncExistingLine(existingLine, effectiveQty)) addedAny = true;
          continue;
        }
        if (addedSkusRef.current.has(effectiveCartSku)) continue;

        addedSkusRef.current.add(effectiveCartSku);

        const resolvedProductKey = productMap.get(sku)?.productKey ?? productSku;
        const item: AddToCartHit = productSku
          ? { sku: productSku, pickedProducts: [{ sku, productKey: resolvedProductKey! }] }
          : { sku };
        try {
          await addToCartAsync({ items: [item], quantity: effectiveQty });
          addedAny = true;
        } catch (err) {
          const msg = (err as { message?: string })?.message ?? String(err);
          if (
            msg.includes('PRICE_NOT_FOUND') ||
            msg.includes('CT_002') ||
            msg.includes('does not contain a price')
          ) {
            try {
              await addToCartAsync({
                items: [item],
                quantity: effectiveQty,
                externalPrice: { centAmount: 0, currencyCode },
              });
              addedAny = true;
            } catch (retryErr) {
              addedSkusRef.current.delete(effectiveCartSku);
              console.error('[useCartPreload] addToCart error:', retryErr);
            }
          } else {
            addedSkusRef.current.delete(effectiveCartSku);
            console.error('[useCartPreload] addToCart error:', err);
          }
        }
      }

      if (addedAny && openCartOnSuccess) {
        openMiniCart();
      }

      settle();
    };

    run().catch(() => settle());
  }, [
    userCountry,
    isGettingCart,
    currencyCode,
    isBannedTier,
    activeCart.lineItems,
    activeCart.computed.isEmpty,
    activeCart.computed.currencyCode,
    activeCart.computed.isB2B,
    isB2BAdminUser,
    isUrlQuantityEnabled,
    isUrlQuantityPending,
    hasCartSkuParam,
    addToCartAsync,
    openMiniCart,
    openCartOnSuccess,
    inventoryEntries,
    isGettingInventoryEntries,
    urlSkus,
    settle,
  ]);

  return { isPreloading, hasPreloadWarning };
};

export default useCartPreload;
