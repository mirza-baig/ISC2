import { useEffect, useMemo, useState } from 'react';

import {
  parseEchoedParams,
  runGuardedSearch,
  useRawAlgoliaResponse,
  type B2BAlgoliaQueryArgs,
} from './b2bAlgoliaQuery';
import { hasSessionStarted, pastDayFacetCount, type SessionScheduleFields } from './b2bDates';

/** `maxValuesPerFacet` the listing asks for so the `startDate` tally is complete. Algolia's own
 *  default is **10**, and 156 distinct values were in the index on 2026-08-03 — at the default the
 *  tally silently subtracts a tenth of what it should. 1000 is Algolia's ceiling for this setting. */
export const B2B_STARTDATE_MAX_FACET_VALUES = 1000;

/** Upper bound on the follow-up query for sessions dated *today*. One calendar day's worth of
 *  sessions (2 in the index on 2026-08-03), so this is a guard against a pathological day rather
 *  than a real page size. */
const TODAY_ROWS_MAX = 1000;

/**
 * Rebuild the query that produced `results`, narrowed to sessions dated today.
 */
const buildTodayQuery = (
  params: string | undefined,
  today: string
): Record<string, unknown> | null => {
  const refinement = parseEchoedParams(params);
  if (!refinement) {
    return null;
  }

  return {
    ...refinement,
    // ANDed alongside whatever was already there, so this stays inside the current refinement.
    facetFilters: [...(refinement.facetFilters ?? []), [`startDate:${today}`]],
    page: 0,
    hitsPerPage: TODAY_ROWS_MAX,
    // Only the schedule fields the start-time comparison needs, and no facets: this is a counting
    // query, so there is no reason to pull whole records back over the wire.
    attributesToRetrieve: ['startDate', 'startTime', 'timeZone', 'timeZoneIana'],
    facets: [],
    analytics: false,
  };
};

/**
 * How many rows the listing's past-session row filter hides across the **whole** result set, so the
 * header total can agree with the list.
 *
 * Algolia computes `nbHits` server-side and cannot see a client-side filter, and only the pages
 * scrolled so far are in hand, so the hidden rows cannot simply be counted. Instead:
 *
 *  1. Every day **before** today comes from the `startDate` facet on the main response — refined by
 *     the same query, so it is exact and costs no extra request (the listing asks for that facet in
 *     its `<Configure>`).
 *  2. Sessions dated **today** need their start time to know whether they have begun, which a facet
 *     cannot express. Those are counted with one follow-up query — fired **only** when the facet says
 *     today has any dated rows at all, so on a day with none this makes no extra request.
 *
 * Returns `null` whenever the figure would be a guess (facet missing or truncated, response not in
 * yet, follow-up query failed); the caller must then fall back to Algolia's raw `nbHits`. Showing a
 * confidently wrong total is worse than showing a known-high one.
 */
export const useB2BPastSessionCount = ({
  enabled,
  searchClient,
  indexName,
}: B2BAlgoliaQueryArgs): number | null => {
  const raw = useRawAlgoliaResponse();
  const startDateFacet = raw?.facets?.startDate;
  const resultsParams = raw?.params;

  const facetTally = useMemo(() => {
    if (!enabled) {
      return null;
    }
    return pastDayFacetCount(startDateFacet, B2B_STARTDATE_MAX_FACET_VALUES);
  }, [enabled, startDateFacet]);
  const todayCandidates = facetTally?.today ?? 0;

  const [todayStarted, setTodayStarted] = useState<number | null>(null);

  useEffect(() => {
    if (!enabled || !todayCandidates) {
      // Nothing dated today: no request, and 0 is a real answer rather than "unknown".
      setTodayStarted(enabled ? 0 : null);
      return undefined;
    }

    const params = buildTodayQuery(resultsParams, new Date().toLocaleDateString('en-CA'));
    if (!params) {
      setTodayStarted(null);
      return undefined;
    }

    return runGuardedSearch<SessionScheduleFields>(searchClient, indexName, params, {
      onResult: ({ hits }) => setTodayStarted(hits.filter((hit) => hasSessionStarted(hit)).length),
      // Fail open to "unknown" so the caller shows Algolia's own total rather than one short by
      // however many of today's sessions have already started.
      onError: () => setTodayStarted(null),
    });
  }, [enabled, todayCandidates, resultsParams, searchClient, indexName]);

  return useMemo(() => {
    if (!enabled || !facetTally || todayStarted === null) {
      return null;
    }
    return facetTally.past + todayStarted;
  }, [enabled, facetTally, todayStarted]);
};
