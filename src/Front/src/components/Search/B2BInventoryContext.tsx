/* eslint-disable @typescript-eslint/no-empty-function */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useGetInventory } from 'hooks/index';

/**
 * B2B PLP inventory (stock) lookup.
 *
 * The `-b2b` variant index carries **no** inventory field of any kind, so a listing row can only
 * learn its stock from commercetools. Rows must not each fire their own request, so this mirrors the
 * StandalonePricesProvider queue: a row registers its SKU on mount, the provider drains the queue in
 * bounded waves, and every row reads the shared map.
 *
 * Two things are deliberately NOT symmetric with pricing:
 *  - Only rows that actually need a stock check register at all. Scheduled products (those with a
 *    `startDate`) bypass inventory throughout this codebase — see the buy-box gating in
 *    `providers/productForm` and `useCartPreload` — so on a variant listing that is most rows, and
 *    never queueing them keeps this a small request rather than one per page of hits.
 *  - A SKU with no CT inventory entry at all resolves to **0**, not "unknown". That matches how the
 *    existing gates read it (`Boolean(inventoryEntries[sku])`), and it is why the fetched batch is
 *    recorded as resolved even when the response omits it — otherwise those rows would sit in a
 *    permanent "still loading" state and never show their unavailable treatment.
 */

type B2BInventoryContextProps = {
  /** sku -> quantityOnStock. A key is present only once the SKU has been resolved. */
  inventory: Record<string, number>;
  addSkuToInventoryQueue: (skus: string[]) => void;
};

const B2BInventoryContext = createContext<B2BInventoryContextProps>({
  inventory: {},
  addSkuToInventoryQueue: () => {},
});

// The CT inventory query takes its SKUs as a literal `sku in ("a", "b", …)` predicate and walks
// pages of 100, so the queue is drained in bounded waves for the same reason pricing is: an
// unbounded predicate is rejected outright and would strand those SKUs unresolved.
const INVENTORY_FETCH_BATCH_SIZE = 250;

type B2BInventoryProviderProps = {
  children: React.ReactNode;
};

const B2BInventoryProvider: React.FC<B2BInventoryProviderProps> = ({ children }) => {
  const [pendingSkus, setPendingSkus] = useState<string[]>([]);
  const [inventory, setInventory] = useState<Record<string, number>>({});

  const addSkuToInventoryQueue = useCallback((skus: string[]) => {
    setPendingSkus((prev) => {
      const newSkus = skus.filter((sku) => sku && !prev.includes(sku));
      return newSkus.length ? [...prev, ...newSkus] : prev;
    });
  }, []);

  // The next wave: queued SKUs we have not resolved yet. Held in state (not derived inline) so the
  // query key stays stable while the request is in flight.
  const [skusToFetch, setSkusToFetch] = useState<string[]>([]);

  useEffect(() => {
    setSkusToFetch((prev) => {
      if (prev.length) {
        return prev; // a wave is in flight — leave it alone
      }
      const next = pendingSkus
        .filter((sku) => !(sku in inventory))
        .slice(0, INVENTORY_FETCH_BATCH_SIZE);
      return next.length ? next : prev;
    });
  }, [pendingSkus, inventory]);

  const { inventoryEntries, isGettingInventoryEntries, inventoryEntriesError } = useGetInventory({
    skuList: skusToFetch,
    enabled: skusToFetch.length > 0,
  });

  // Merge a landed wave, then clear it so the effect above can queue the next one. Every SKU in the
  // wave is written — missing from the response means no CT inventory entry, i.e. 0 on hand. The
  // query does not retry, so an outright failure is also recorded as resolved-with-0 rather than
  // being left to hang (a hung row would silently render as available).
  const settledRef = useRef<string>('');
  useEffect(() => {
    if (!skusToFetch.length || isGettingInventoryEntries) {
      return;
    }
    const waveKey = skusToFetch.join(',');
    if (settledRef.current === waveKey) {
      return;
    }
    settledRef.current = waveKey;

    setInventory((prev) => {
      const next = { ...prev };
      skusToFetch.forEach((sku) => {
        next[sku] = inventoryEntries[sku] ?? 0;
      });
      return next;
    });
    setSkusToFetch([]);
  }, [skusToFetch, isGettingInventoryEntries, inventoryEntries, inventoryEntriesError]);

  const value = useMemo(
    () => ({ inventory, addSkuToInventoryQueue }),
    [inventory, addSkuToInventoryQueue]
  );

  return <B2BInventoryContext.Provider value={value}>{children}</B2BInventoryContext.Provider>;
};

const useB2BInventory = () => useContext(B2BInventoryContext);

export { B2BInventoryProvider, useB2BInventory };
