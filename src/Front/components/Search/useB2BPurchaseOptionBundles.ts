import { useEffect, useState } from 'react';

import { runGuardedSearch, type B2BAlgoliaQueryArgs } from './b2bAlgoliaQuery';
import type { B2BBundleMap, B2BBundleRecord } from './b2bPurchaseOptions';

/** Upper bound on the bundle bootstrap. There were 103 `product-bundle` records in the index on
 *  2026-08-06 and 1000 is Algolia's per-query ceiling, so this is a guard rather than a page size —
 *  if the catalog ever outgrows it the map is reported incomplete rather than silently short. */
const BUNDLE_FETCH_MAX = 1000;

/** Only what a generated row and the suppression rule actually read. Bundles carry no facet
 *  attributes and no schedule fields (0 of 103 for certification/modality/duration/focusArea), so
 *  there is nothing else worth pulling over the wire. */
const BUNDLE_ATTRIBUTES = [
  'objectID',
  'sku',
  'productKey',
  'productType',
  'parentTitle',
  'copyName',
  'description',
  'moreInfo',
  'productMessage',
];

/**
 * Every `product-bundle` record in the index, keyed by SKU.
 *
 * Fetched **once per page load**, not per refinement: the purchase options a class references do not
 * change as the reader filters, and the whole set is one small query (103 records, nine attributes).
 * Both the row expansion and the count correction resolve their refs against this map, so they
 * cannot disagree about which refs are real.
 *
 * Returns `null` until it has landed (and if it fails), which the callers treat as "do not expand
 * yet" — a missing map degrades to today's behaviour, an un-expanded listing, rather than to rows
 * with no title or price.
 */
export const useB2BPurchaseOptionBundles = ({
  enabled,
  searchClient,
  indexName,
}: B2BAlgoliaQueryArgs): B2BBundleMap | null => {
  const [bundles, setBundles] = useState<B2BBundleMap | null>(null);

  useEffect(() => {
    if (!enabled) {
      setBundles(null);
      return undefined;
    }

    return runGuardedSearch<B2BBundleRecord>(
      searchClient,
      indexName,
      {
        query: '',
        // Deliberately NOT inheriting the listing's scope filter or its refinements: this is a
        // lookup table, not a result set. A bundle referenced by a visible class has to resolve
        // even when the current refinement excludes bundles from the listing itself.
        facetFilters: [[`productType:product-bundle`]],
        page: 0,
        hitsPerPage: BUNDLE_FETCH_MAX,
        attributesToRetrieve: BUNDLE_ATTRIBUTES,
        facets: [],
        analytics: false,
      },
      {
        onResult: ({ hits, nbHits }) => {
          // A truncated map would silently drop purchase options from some classes and not others,
          // so treat it as no map at all rather than expand inconsistently.
          if (typeof nbHits === 'number' && nbHits > hits.length) {
            setBundles(null);
            return;
          }

          setBundles(
            hits.reduce<B2BBundleMap>((acc, hit) => {
              const sku = hit.sku ?? hit.objectID;
              if (sku) {
                acc[sku] = hit;
              }
              return acc;
            }, {})
          );
        },
        onError: () => setBundles(null),
      }
    );
  }, [enabled, searchClient, indexName]);

  return bundles;
};
