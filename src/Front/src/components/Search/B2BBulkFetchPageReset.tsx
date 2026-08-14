import { useEffect, useLayoutEffect, useRef } from 'react';
import { useInstantSearch } from 'react-instantsearch-hooks-web';

// This renders inside the SSR'd SearchWrapper tree, and `useLayoutEffect` warns on the server —
// the usual isomorphic shim. The layout timing itself matters; see the note on the component.
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

interface B2BBulkFetchPageResetProps {
  /** True while the PLP is in bulk-fetch mode: a price sort or an active price bucket. */
  bulkFetching: boolean;
}

/**
 * B2B PLP: resets InstantSearch's page whenever the list switches into or out of bulk-fetch mode.
 *
 * Entering that mode raises `hitsPerPage` to `B2B_PRICE_SORT_FETCH_MAX` (see SearchWrapper's
 * `b2bConfigureProps`) but leaves `page` alone — and infinite scroll has been incrementing it. The
 * combination goes out of range: on the `-b2b` index, `hitsPerPage=1000&page=2` comes back with
 * **`nbHits: 0`** (measured directly against Algolia), which is a genuine zero-hit response as far
 * as NoResultsBoundary can tell, so it replaced the whole list with the no-results page for the
 * length of that round trip before a follow-up page-0 query brought the rows back. Visible only on
 * the first sort change after a page load, because by then the page is already back to 0.
 *
 * Rendered BEFORE `<Configure>` on purpose: layout effects fire in tree order, so the page is reset
 * while the Configure widget still holds its previous props, and both changes land in the single
 * search InstantSearch defers to the end of the tick — the out-of-range query is never issued.
 *
 * `page` in the UI state is 1-based and omitted entirely for the first page
 * (`connectInfiniteHits.getWidgetUiState` returns `searchParameters.page + 1`), so 1 is the reset.
 */
const B2BBulkFetchPageReset = ({ bulkFetching }: B2BBulkFetchPageResetProps): null => {
  const { setIndexUiState } = useInstantSearch();

  // Compared against the current value rather than a "have I mounted" flag so a double-invoked
  // effect (StrictMode) can't reset a page that a deep link legitimately asked for.
  const previousModeRef = useRef(bulkFetching);

  useIsomorphicLayoutEffect(() => {
    if (previousModeRef.current === bulkFetching) {
      return;
    }
    previousModeRef.current = bulkFetching;

    setIndexUiState((previous) =>
      previous.page && previous.page > 1 ? { ...previous, page: 1 } : previous
    );
  }, [bulkFetching, setIndexUiState]);

  return null;
};

export default B2BBulkFetchPageReset;
