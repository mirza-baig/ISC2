import { useEffect, useMemo, useRef, useState } from 'react';
import { useInstantSearch } from 'react-instantsearch-hooks-web';
import type { SearchClient } from 'algoliasearch/lite';

/** Algolia's ceiling for `maxValuesPerFacet`. Asked for in full because this query exists purely to
 *  produce the complete option list — a truncated one would put the whittling back. */
export const B2B_ALL_FACET_MAX_VALUES = 1000;

/** The facet map keyed by attribute, values ordered most-common-first. Empty for an attribute the
 *  index has no values for at all (the B2B PLP shares /search's facet datasource, so `topics`,
 *  `genericType` and `pageLanguage` resolve here and come back with nothing). */
export type B2BAllFacetValues = Record<string, string[]>;

/** The parts of Algolia's *raw* response this hook needs — same reasoning as
 *  useB2BPastSessionCount: InstantSearch reshapes `facets` and never surfaces `params`, while the
 *  raw payload carries the query string that produced it. */
type RawAlgoliaResponse = {
  facets?: Record<string, Record<string, number>>;
  params?: string;
};

type UnrefinedQuery = {
  query: string;
  filters?: string;
  numericFilters?: string | string[];
};

/**
 * Rebuild the listing's query with **every facet refinement removed**.
 *
 * Read back off the response's own echoed `params` rather than reassembled from the widgets, so the
 * page's scope filter (`b2bScopeFilter`, which SearchWrapper puts in `filters`) and anything else
 * riding on the query come along without this hook knowing they exist. Only `facetFilters` is
 * dropped — that is where the refinement-list widgets put the user's ticks, and dropping it is the
 * entire point.
 */
const buildUnrefinedQuery = (params: string | undefined): UnrefinedQuery | null => {
  if (!params) {
    return null;
  }

  const search = new URLSearchParams(params);
  const next: UnrefinedQuery = { query: search.get('query') ?? '' };

  // Assigned only when actually present. A key set to `undefined` is NOT omitted by the Algolia
  // client — it serialises into the query string as the literal text `undefined`, which the API
  // rejects with a 400 (see the same note in useB2BPastSessionCount).
  const filters = search.get('filters');
  if (filters) {
    next.filters = filters;
  }

  const numeric = search.get('numericFilters');
  if (numeric) {
    try {
      const parsed = JSON.parse(numeric);
      next.numericFilters = Array.isArray(parsed) ? (parsed as string[]) : numeric;
    } catch {
      next.numericFilters = numeric;
    }
  }

  return next;
};

/**
 * Every value each facet could offer, ignoring what is currently ticked.
 *
 * **Why this exists.** `useRefinementList` shows the values from the search response, and Algolia
 * computes those against the query it was sent: a facet's own refinements do not narrow itself
 * (that is what disjunctive faceting buys), but every *other* facet's refinements do. So ticking a
 * Category made Certifications disappear from the panel, and there was no way back to them except
 * Clear. The requirement is that the options never move: the panel lists everything the index
 * holds, all the time, and ticking only ever changes what the listing shows.
 *
 * One extra request answers it, and only one: it is keyed on the query with `facetFilters` stripped,
 * so it is unaffected by ticking boxes and does not re-fire while the user works the panel. It asks
 * for `hitsPerPage: 0` — facet counts only, no records over the wire.
 *
 * Fails open: on error (or before the first response) it returns nothing for that attribute and the
 * caller falls back to the widget's own live values, i.e. exactly the old behaviour.
 */
export const useB2BAllFacetValues = ({
  enabled,
  searchClient,
  indexName,
  attributes,
}: {
  enabled: boolean;
  searchClient: SearchClient;
  indexName: string;
  attributes: string[];
}): B2BAllFacetValues => {
  const { results } = useInstantSearch();

  const raw = (results as unknown as { _rawResults?: RawAlgoliaResponse[] } | undefined)
    ?._rawResults?.[0];

  // Depend on the *stripped* query string, not the response's: it only changes when something other
  // than a facet tick changes (a text query, or the Sitecore scope filter), which is precisely when
  // the full option list could differ. Carried as a string so a re-render alone cannot re-fire it.
  const baseKey = useMemo(() => {
    const query = buildUnrefinedQuery(raw?.params);
    return query ? JSON.stringify(query) : '';
  }, [raw?.params]);

  const attributesKey = useMemo(() => attributes.join(','), [attributes]);

  const [values, setValues] = useState<B2BAllFacetValues>({});

  // Only the most recent request may publish, so a slow response cannot overwrite a newer one.
  // Compared by identity rather than a counter, so StrictMode's double invocation is harmless.
  const latestRequest = useRef<object | null>(null);

  useEffect(() => {
    if (!enabled || !baseKey || !attributesKey) {
      return;
    }

    const token = {};
    latestRequest.current = token;
    let active = true;

    searchClient
      .search([
        {
          indexName,
          params: {
            ...(JSON.parse(baseKey) as UnrefinedQuery),
            page: 0,
            // Counting query: the panel needs the value lists, not the records.
            hitsPerPage: 0,
            facets: attributesKey.split(','),
            maxValuesPerFacet: B2B_ALL_FACET_MAX_VALUES,
            analytics: false,
          },
        },
      ])
      .then((response) => {
        if (!active || latestRequest.current !== token) {
          return;
        }
        const facets = (response?.results?.[0] as RawAlgoliaResponse | undefined)?.facets ?? {};
        const next: B2BAllFacetValues = {};
        attributesKey.split(',').forEach((attribute) => {
          // Ordered most-common-first, ties alphabetical — a fixed order that does NOT depend on
          // what is ticked, so the checkbox a user is reaching for never moves under the cursor.
          next[attribute] = Object.entries(facets[attribute] ?? {})
            .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
            .map(([value]) => value);
        });
        setValues(next);
      })
      .catch(() => {
        // Deliberately keeps whatever was already resolved: the sections fall back to the widget's
        // live values per attribute, so a failure degrades to the pre-fix behaviour rather than
        // emptying the panel.
      });

    return () => {
      active = false;
    };
  }, [enabled, baseKey, attributesKey, searchClient, indexName]);

  return values;
};
