import type { SearchClient } from 'algoliasearch/lite';
import { useInstantSearch } from 'react-instantsearch-hooks-web';

/**
 * Shared plumbing for the B2B listing's side-queries — the extra Algolia requests the PLP fires
 * alongside the InstantSearch one (past-session count, row model, purchase-option bundles).
 *
 * All three ask the same index with the same client and all three must survive an out-of-order
 * response, so the request/guard shape and the echoed-params reader live here once.
 */

/** What every B2B side-query hook takes: the shared client/index plus its own on/off switch. */
export interface B2BAlgoliaQueryArgs {
  enabled: boolean;
  searchClient: SearchClient;
  indexName: string;
}

export interface RawAlgoliaResponse {
  facets?: Record<string, Record<string, number>>;
  params?: string;
  nbHits?: number;
}

export const useRawAlgoliaResponse = (): RawAlgoliaResponse | undefined => {
  const { results } = useInstantSearch();

  return (results as unknown as { _rawResults?: RawAlgoliaResponse[] } | undefined)
    ?._rawResults?.[0];
};

/** The refinement-carrying parts of a query, read back off a response's echoed `params`. */
export interface EchoedQueryParams {
  query: string;
  filters?: string;
  facetFilters?: (string | string[])[];
  numericFilters?: string | readonly string[];
}

/**
 * Rebuild the refinement half of the query that produced a response, from the response's own echoed
 * `params` string.
 *
 * Read back off `params` rather than reassembled from the refinement widgets: that string is exactly
 * what Algolia was asked, so the scope filter and every refinement come along without the caller
 * having to know which widgets exist or how they map to parameters.
 *
 * Keys are assigned only when actually present. A key set to `undefined` is NOT omitted by the
 * Algolia client — it serialises into the query string as the literal text `undefined`, which the
 * API rejects outright (`{"message":"Invalid syntax for numeric condition:undefined","status":400}`,
 * observed on the live page).
 */
export const parseEchoedParams = (params: string | undefined): EchoedQueryParams | null => {
  if (!params) {
    return null;
  }

  const search = new URLSearchParams(params);

  const readJson = (key: string): unknown => {
    const raw = search.get(key);
    if (!raw) {
      return undefined;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return undefined;
    }
  };

  const facetFilters = readJson('facetFilters');
  const numeric = readJson('numericFilters');
  const filters = search.get('filters');

  const next: EchoedQueryParams = { query: search.get('query') ?? '' };

  if (Array.isArray(facetFilters)) {
    next.facetFilters = facetFilters as (string | string[])[];
  }
  if (filters) {
    next.filters = filters;
  }
  if (Array.isArray(numeric)) {
    next.numericFilters = numeric as string[];
  } else if (typeof numeric === 'string' && numeric) {
    next.numericFilters = numeric;
  }

  return next;
};

/** The parts of a single-index response the B2B side-queries read. */
export interface SingleIndexResult<THit> {
  hits: THit[];
  nbHits?: number;
}

/**
 * Fire one single-index query and hand the result to `onResult`, or `onError` on failure.
 *
 * Returns the effect cleanup. Once it has run neither callback fires again, which is what keeps a
 * slow response from an abandoned refinement from overwriting a newer one — React runs the cleanup
 * before the next effect, so an in-flight request is disarmed the moment its query stops being
 * current (StrictMode's double invocation included).
 */
export const runGuardedSearch = <THit>(
  searchClient: SearchClient,
  indexName: string,
  params: Record<string, unknown>,
  handlers: { onResult: (result: SingleIndexResult<THit>) => void; onError: () => void }
): (() => void) => {
  let active = true;

  searchClient
    .search([{ indexName, params }])
    .then((response) => {
      if (!active) {
        return;
      }
      const result = response?.results?.[0] as { hits?: THit[]; nbHits?: number } | undefined;
      handlers.onResult({ hits: result?.hits ?? [], nbHits: result?.nbHits });
    })
    .catch(() => {
      if (!active) {
        return;
      }
      handlers.onError();
    });

  return () => {
    active = false;
  };
};
