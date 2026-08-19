import { useInstantSearch } from 'react-instantsearch-hooks-web';

interface NoResultsBoundaryProps {
  children: JSX.Element;
  fallback: JSX.Element;
  /**
   * B2B PLP escape hatch: Algolia returned hits, but a *client-side* filter removed all of them.
   * Price isn't in the index (see priceBuckets.ts), so `results.nbHits` can be 835 while the
   * rendered list is empty — this lets the owner of that filtered list say "actually, nothing
   * matched". Must stay `false` while the filter is still resolving, or the no-results message
   * would flash mid-fetch; SearchResults only sets it once the filtered count has settled.
   */
  noFilteredResults?: boolean;
}

export default function NoResultsBoundary({
  children,
  fallback,
  noFilteredResults = false,
}: NoResultsBoundaryProps) {
  const { results } = useInstantSearch();

  // The `__isArtificial` flag makes sure not to display the No Results message
  // when no hits have been returned.
  if (noFilteredResults || (!results.__isArtificial && results.nbHits === 0)) {
    return (
      <>
        {fallback}
        <div hidden>{children}</div>
      </>
    );
  }

  return children;
}
