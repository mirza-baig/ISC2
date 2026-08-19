import {
  useConfigure,
  useHits,
  useInstantSearch,
  useSearchBox,
  type UseConfigureProps,
} from 'react-instantsearch-hooks-web';
import { Text, TextField } from '@sitecore-jss/sitecore-jss-nextjs';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { ChevronDownIcon } from 'icons/index';
import { LoadingIndicator } from 'ui/index';
import ProductCardHit, { ProductHit } from './SearchHits/ProductCardHit';

interface SearchProductResultsProps {
  query: string;
  showAllProductsLabel: TextField;
}

const DEFAULT_HITS_PER_PAGE = 3;

const SearchProductResults = ({ query, showAllProductsLabel }: SearchProductResultsProps) => {
  const { hits: productHits, results } = useHits<ProductHit>();
  const { status } = useInstantSearch();
  const { query: queryState, refine: setQuery } = useSearchBox();
  const [hitsPerPage, setHitsPerPage] = useState<number>(DEFAULT_HITS_PER_PAGE);

  // algoliasearch-helper resolves to v5 types under TS 5.9; hitsPerPage is valid v4. Fix: Phase 3 (react-instantsearch v7+).
  useConfigure({ hitsPerPage } as unknown as UseConfigureProps);

  useEffect(() => {
    if (queryState !== query) {
      setQuery(query);
      setHitsPerPage(DEFAULT_HITS_PER_PAGE);
    }
  }, [hitsPerPage, query, queryState, setQuery]);

  const isLoading = useMemo(() => ['loading', 'stalled'].includes(status), [status]);

  const showExpandButton = useMemo(
    () => Boolean(productHits?.length && Number(results?.nbHits) > Number(hitsPerPage)),
    [hitsPerPage, productHits?.length, results?.nbHits]
  );

  const handleExpand = useCallback(() => {
    if (results?.nbHits) {
      setHitsPerPage(results.nbHits);
    }
  }, [results?.nbHits]);

  if (!productHits?.length && !isLoading) {
    return null;
  }

  return (
    <section className="flex flex-col gap-6 mt-10 sm:mt-0 mb-1">
      {productHits.map((hit) => (
        <ProductCardHit key={`${hit.objectID}`} hit={hit} />
      ))}
      {showExpandButton && (
        <div>
          <button
            className="flex gap-2 items-center border border-gray-50 px-4 py-2 rounded"
            onClick={handleExpand}
            aria-label="Expand"
          >
            <Text
              tag="span"
              field={showAllProductsLabel}
              className="text-darker-green font-semibold text-sm"
            />
            <ChevronDownIcon size={18} />
          </button>
        </div>
      )}
      {isLoading && <LoadingIndicator className="my-8 mx-auto" />}
    </section>
  );
};

export default SearchProductResults;
