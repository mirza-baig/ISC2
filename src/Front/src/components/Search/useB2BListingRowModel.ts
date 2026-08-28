import { useEffect, useMemo, useState } from 'react';

import {
  parseEchoedParams,
  runGuardedSearch,
  useRawAlgoliaResponse,
  type B2BAlgoliaQueryArgs,
} from './b2bAlgoliaQuery';
import { hasSessionStarted, type SessionScheduleFields } from './b2bDates';
import {
  collectSuppressedBundleSkus,
  isInvalidOilSession,
  resolvableBundleRefs,
  type B2BBundleMap,
} from './b2bPurchaseOptions';

/** Upper bound on the row-model query. The listing's scope filter left 837 records on 2026-08-06 and
 *  1000 is Algolia's per-query ceiling, so a full result set fits in one request today. If it ever
 *  does not, the model reports itself unknown rather than compute a total off a truncated set. */
const ROW_MODEL_FETCH_MAX = 1000;

/** Only the fields the three rules need: the refs to expand, the region + modality + schedule to
 *  decide what is hidden, and the identity to match a bare bundle row against the suppression set. */
const ROW_MODEL_ATTRIBUTES = [
  'objectID',
  'sku',
  'productType',
  'skuReferencesProduct',
  'region',
  'modality',
  'startDate',
  'startTime',
  'timeZone',
  'timeZoneIana',
];

type RowModelHit = SessionScheduleFields & {
  objectID: string;
  sku?: string;
  productType?: string;
  skuReferencesProduct?: string[];
  region?: { key?: string };
  modality?: { key?: string };
};

export interface B2BListingRowModel {
  /** Rows hidden because an instructor-led session is not a real, dated, regioned instance (see
   *  `isInvalidOilSession`). Counted only among sessions that have NOT already started, so it never
   *  overlaps the past-session tally. */
  hiddenInvalidOilSessions: number;
  /** Generated purchase-option rows added across the whole refined result set. */
  addedOptionRows: number;
  /** Bare `product-bundle` rows hidden because a generated row already represents them. */
  hiddenBundleRows: number;
  /** The bundle SKUs those hidden rows belong to — applied as a row filter by the caller. */
  suppressedBundleSkus: Set<string>;
}

/**
 * Rebuild the query that produced the current results, so the row model is computed over the
 * **whole refined result set** rather than over the pages scrolled so far.
 */
const buildRowModelQuery = (params: string | undefined): Record<string, unknown> | null => {
  const refinement = parseEchoedParams(params);
  if (!refinement) {
    return null;
  }

  return {
    ...refinement,
    page: 0,
    hitsPerPage: ROW_MODEL_FETCH_MAX,
    attributesToRetrieve: ROW_MODEL_ATTRIBUTES,
    facets: [],
    analytics: false,
  };
};

/**
 * How the listing's rows differ from Algolia's `nbHits`, for the whole refined result set.
 *
 * Three client-side rules move the row count away from what the server counted, and none of them can
 * be expressed as a facet:
 *
 *  - purchase-option rows are **added** (one per resolvable bundle ref on a surviving record),
 *  - region-less instructor-led sessions are **hidden**,
 *  - a bare bundle row is **hidden** once a generated row represents it.
 *
 * All three need the records themselves, so they are computed from one extra query per refinement
 * change — the same shape as the main one, minus the facets and with only ten attributes retrieved.
 * It is the same trade the past-session count already makes: one small request to keep the header
 * from disagreeing with the list.
 *
 * Returns `null` whenever the answer would be a guess (no response yet, no bundle map, or a result
 * set larger than one page). The caller must then fall back to Algolia's own total — a known-wrong
 * number is better than a confidently wrong one.
 */
export const useB2BListingRowModel = ({
  enabled,
  searchClient,
  indexName,
  bundles,
}: B2BAlgoliaQueryArgs & { bundles: B2BBundleMap | null }): B2BListingRowModel | null => {
  const resultsParams = useRawAlgoliaResponse()?.params;

  const [records, setRecords] = useState<RowModelHit[] | null>(null);

  useEffect(() => {
    if (!enabled || !bundles) {
      setRecords(null);
      return undefined;
    }

    const params = buildRowModelQuery(resultsParams);
    if (!params) {
      setRecords(null);
      return undefined;
    }

    return runGuardedSearch<RowModelHit>(searchClient, indexName, params, {
      onResult: ({ hits, nbHits }) => {
        // Past the ceiling the set is truncated and every tally below would read low. Report unknown.
        if (typeof nbHits === 'number' && nbHits > hits.length) {
          setRecords(null);
          return;
        }

        setRecords(hits);
      },
      onError: () => setRecords(null),
    });
  }, [enabled, bundles, resultsParams, searchClient, indexName]);

  return useMemo(() => {
    if (!enabled || !bundles || !records) {
      return null;
    }

    // Rows the listing keeps, in the same order the row filters apply them: a started session is
    // already gone (counted separately, off the `startDate` facet), then the invalid-session rule,
    // and only what survives both can carry purchase options.
    const live = records.filter((record) => !hasSessionStarted(record));
    const invalidOilSessions = live.filter((record) => isInvalidOilSession(record));
    const expandable = live.filter((record) => !isInvalidOilSession(record));

    const addedOptionRows = expandable.reduce(
      (total, record) => total + resolvableBundleRefs(record, bundles).length,
      0
    );

    const suppressedBundleSkus = collectSuppressedBundleSkus(expandable, bundles);

    const hiddenBundleRows = live.filter(
      (record) =>
        record.productType === 'product-bundle' &&
        suppressedBundleSkus.has(record.sku ?? record.objectID)
    ).length;

    return {
      hiddenInvalidOilSessions: invalidOilSessions.length,
      addedOptionRows,
      hiddenBundleRows,
      suppressedBundleSkus,
    };
  }, [enabled, bundles, records]);
};
