import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useInfiniteHits, InfiniteHits, useInstantSearch } from 'react-instantsearch-hooks-web';
import { createInfiniteHitsSessionStorageCache } from 'instantsearch.js/es/lib/infiniteHitsCache';
import type { Hit } from 'instantsearch.js';

import { SearchResultHit } from 'types/index';
import { trackFunction } from 'hooks/index';
import { LoadingIndicator } from 'ui/index';

interface SearchInfiniteHitsProps {
  renderHit: (hit: Hit<SearchResultHit>, index: number, isFeatured: boolean) => JSX.Element | null;
  loadMoreButtonLabel: string;
  ProductsRecommendations?: JSX.Element;
  hideProductSuggestions: boolean;
}

const sessionStorageCache = createInfiniteHitsSessionStorageCache();

export default function SearchInfiniteHits({
  renderHit,
  loadMoreButtonLabel,
  ProductsRecommendations,
  hideProductSuggestions,
}: SearchInfiniteHitsProps) {
  const { hits, isLastPage, showMore, results } = useInfiniteHits({
    cache: sessionStorageCache,
  });

  const sentinelRef = useRef(null);
  const { status } = useInstantSearch();

  const isLoading = useMemo(() => ['loading', 'stalled'].includes(status), [status]);

  const sortedHits = useMemo(() => {
    return hits.sort((a, b) => {
      const aVendor = a.vendorName || '';
      const bVendor = b.vendorName || '';

      if (aVendor === 'ISC2' && bVendor !== 'ISC2') return -1;
      if (bVendor === 'ISC2' && aVendor !== 'ISC2') return 1;

      return 0;
    });
  }, [hits]);

  useEffect(() => {
    if (sentinelRef.current !== null) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isLastPage) {
            showMore();
          }
        });
      });

      observer.observe(sentinelRef.current);

      return () => {
        observer.disconnect();
      };
    }

    return () => null;
  }, [isLastPage, showMore]);

  const featuredHits = useMemo(() => {
    const userData = results?.userData || [];
    const promotedItems = sortedHits.filter((hit) => hit._rankingInfo?.promoted);

    return [...userData, ...promotedItems];
  }, [sortedHits, results?.userData]);

  const nonFeaturedHits = useMemo(
    () => sortedHits.filter((hit) => !hit._rankingInfo?.promoted),
    [sortedHits]
  );

  useEffect(() => {
    if (sortedHits.length) {
      trackFunction({ event: 'Hits Viewed' });
    }
  }, [sortedHits]);

  const renderHitForInfiniteHits = useCallback(
    ({ hit }: { hit: Hit<SearchResultHit> }) => (
      <div key={hit.objectID}>{renderHit(hit, hit.__position + featuredHits.length, false)}</div>
    ),
    [renderHit, featuredHits.length]
  );

  const FeaturedHitsContent = useMemo(
    () =>
      featuredHits.map((hit: Hit<SearchResultHit>) => (
        <li key={hit.objectID}>{renderHit(hit, hit.__position, true)}</li>
      )),
    [featuredHits, renderHit]
  );

  if (loadMoreButtonLabel) {
    return (
      <ul className="mt-2 sm:mt-0 sm:ml-2">
        {FeaturedHitsContent}
        {!hideProductSuggestions && ProductsRecommendations}
        <InfiniteHits<SearchResultHit>
          hitComponent={renderHitForInfiniteHits}
          classNames={{ loadMore: 'cta primary-cta mt-8 sm:mt-10', disabledLoadMore: 'hidden' }}
          showPrevious={false}
          translations={{
            showMoreButtonText: loadMoreButtonLabel,
          }}
        />
      </ul>
    );
  }

  return (
    <>
      <ul className="mt-2 sm:mt-0 sm:ml-2">
        {FeaturedHitsContent}
        {!hideProductSuggestions && ProductsRecommendations}
        {nonFeaturedHits.map((hit: Hit<SearchResultHit>) => (
          <li key={hit.objectID}>{renderHit(hit, hit.__position + featuredHits.length, false)}</li>
        ))}
        <li ref={sentinelRef} aria-hidden="true" />
      </ul>
      {isLoading && !isLastPage && <LoadingIndicator className="my-8 mx-auto" />}
    </>
  );
}
