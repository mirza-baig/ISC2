import type { UiState } from 'instantsearch.js';

const buildRefinementString = (uiState: UiState) => {
  if (!uiState || typeof uiState !== 'object') {
    return '';
  }

  return Object.values(uiState)
    .flatMap((refinementCategory) =>
      Object.entries(refinementCategory.refinementList || {}).flatMap(([attribute, values]) =>
        values.map((value) => {
          const formattedValue = String(value).includes(' ') ? `"${value}"` : value;
          return `${attribute}:${formattedValue}`;
        })
      )
    )
    .join(' OR ');
};

export const buildProductResultsFilter = (uiState: UiState) => {
  const productFilter = 'pageType:ProductDetailPage';

  const appliedRefinements = buildRefinementString(uiState);

  if (!appliedRefinements) {
    return productFilter;
  }

  return `${productFilter} AND (${appliedRefinements})`;
};
