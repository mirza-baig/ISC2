import { FacetKeyValues } from 'types/index';

import SearchFacet from './SearchFacets/SearchFacet';

export const renderSearchFacets = (
  filterKeyValues: FacetKeyValues[],
  showMoreLabel: string,
  isVisible?: (filter: FacetKeyValues) => boolean
): (JSX.Element | null)[] =>
  filterKeyValues?.map((filter, index) =>
    !isVisible || isVisible(filter) ? (
      <SearchFacet
        key={filter.FacetAttribute}
        type={filter.FacetType}
        attribute={filter.FacetAttribute}
        label={filter.FacetLabel}
        openByDefault={index === 0}
        showMoreLabel={showMoreLabel}
      />
    ) : null
  );
