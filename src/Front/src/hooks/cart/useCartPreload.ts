import { useEffect, useMemo, useRef, useState } from 'react';

import {
  useAddToCart,
  useGetDistributionChannel,
  useGetInventory,
  useLoggedUser,
} from 'hooks/index';
import { useCart, useLayout, useUserSession } from 'providers/index';
import { AddToCartHit } from 'types/index';
import { CT_BANNED_TIERS } from 'types/pricing';
import { INNER_PROVIDER_KEY, ProductHit } from 'types/forms';
import { getChannel, getProductSelectorSearchResult } from 'utils/product-form';
import { isDonationItem } from 'utils/cart';

// const MAX_QUANTITY = 10;

const parseCartSkuParam = (
  raw: string
): { sku: string; productSku?: string; quantity: number } | null => {
  const parts = raw.trim().toUpperCase().split('_');
  if (!parts[0]) return null;

  const lastPart = parts[parts.length - 1];
  const lastIsNumber = /^\d+$/.test(lastPart);
  // const quantity = lastIsNumber ? Math.min(parseInt(lastPart, 10), MAX_QUANTITY) : 1;
  const quantity = 1;
  const skuParts = lastIsNumber ? parts.slice(0, -1) : parts;

  if (!skuParts[0]) return null;

  if (skuParts.length === 1) {
    return { sku: skuParts[0], quantity };
  }

  const sku = skuParts[0];
  const productSku = skuParts.slice(1).join('_');
  return sku && productSku ? { sku, productSku, quantity } : null;
};

type UseCartPreloadOptions = {
  openCartOnSuccess?: boolean;
};

const useCartPreload = ({ openCartOnSuccess = true }: UseCartPreloadOptions = {}) => {
  const { activeCart, isGettingCart } = useCart();
  const { openMiniCart } = useLayout();
  const { currencyCode, geolocationCountry, userCountry } = useUserSession();
  const { isB2BAdminUser } = useLoggedUser();
  const { distributionChannel } = useGetDistributionChannel();
  const { addToCartAsync } = useAddToCart();
  const addedSkusRef = useRef<Set<string>>(new Set());

  const [isPreloading, setIsPreloading] = useState(false);
  const [hasPreloadWarning, setHasPreloadWarning] = useState(false);

  const urlSkus = useMemo(() => {
    if (typeof window === 'undefined') return [];
    const searchParams = new URLSearchParams(window.location.search);
    const rawParams: string[] = [];
    searchParams.forEach((value, key) => {
      if (key.toLowerCase() === 'cart-sku') rawParams.push(value);
    });
    return rawParams
      .map(parseCartSkuParam)
      .filter((e): e is { sku: string; productSku?: string; quantity: number } => e !== null)
      .flatMap(({ sku, productSku }) => (productSku ? [sku, productSku] : [sku]));
  }, []);

  const hasCartSkuParam = urlSkus.length > 0;

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

    const searchParams = new URLSearchParams(window.location.search);
    const rawParams: string[] = [];
    searchParams.forEach((value, key) => {
      if (key.toLowerCase() === 'cart-sku') rawParams.push(value);
    });
    const entries = rawParams
      .map(parseCartSkuParam)
      .filter((e): e is { sku: string; productSku?: string; quantity: number } => e !== null);

    if (!entries.length) {
      setIsPreloading(false);
      return;
    }
    if (isBannedTier) {
      setIsPreloading(false);
      return;
    }
    if (!activeCart.computed.isEmpty && activeCart.computed.currencyCode !== currencyCode) {
      setIsPreloading(false);
      return;
    }

    const existingCartSkus = new Set(
      (activeCart.lineItems ?? []).flatMap((lineItem) => {
        const skus: string[] = [];
        if (lineItem.variant?.sku) skus.push(lineItem.variant.sku);
        if (lineItem.productType?.id === 'bundle' && lineItem.productKey)
          skus.push(lineItem.productKey);
        return skus;
      })
    );

    const hasPendingItems = entries.some(({ sku, productSku }) => {
      const effectiveSku = productSku ?? sku;
      return !existingCartSkus.has(effectiveSku) && !addedSkusRef.current.has(effectiveSku);
    });
    if (!hasPendingItems) {
      setIsPreloading(false);
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

      if (!allowedEntries.length) {
        setIsPreloading(false);
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
        setIsPreloading(false);
        return;
      }

      let addedAny = false;
      for (const { sku, productSku /*, quantity*/ } of inventoryCheckedEntries) {
        const effectiveCartSku = productSku ?? sku;
        if (existingCartSkus.has(effectiveCartSku)) {
          addedSkusRef.current.add(effectiveCartSku);
          continue;
        }
        if (addedSkusRef.current.has(effectiveCartSku)) continue;

        addedSkusRef.current.add(effectiveCartSku);

        // const effectiveQty = isB2BAdminUser ? quantity : 1;
        const effectiveQty = 1;
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

      setIsPreloading(false);
    };

    run().catch(() => setIsPreloading(false));
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
    addToCartAsync,
    openMiniCart,
    openCartOnSuccess,
    inventoryEntries,
    isGettingInventoryEntries,
    urlSkus,
  ]);

  return { isPreloading, hasPreloadWarning };
};

export default useCartPreload;
