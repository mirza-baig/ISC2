import { useInstantSearch } from 'react-instantsearch-hooks-web';

interface NoResultsBoundaryProps {
  children: JSX.Element;
  fallback: JSX.Element;
}

export default function NoResultsBoundary({ children, fallback }: NoResultsBoundaryProps) {
  const { results } = useInstantSearch();

  // The `__isArtificial` flag makes sure not to display the No Results message
  // when no hits have been returned.
  if (!results.__isArtificial && results.nbHits === 0) {
    return (
      <>
        {fallback}
        <div hidden>{children}</div>
      </>
    );
  }

  return children;
}
