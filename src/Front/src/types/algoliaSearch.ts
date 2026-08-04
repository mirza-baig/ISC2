import { Field } from '@sitecore-jss/sitecore-jss-nextjs';

export interface FacetKeyValues {
  key: string;
  value: string;
}

export interface FetchedSearchWrapperSettings {
  id: string;
  name: string;
  fields: FetchedField[];
}

export interface FieldValue {
  value: string | boolean;
}

export interface SearchWrapperSettingsResponse {
  data: {
    searchWrapperSettings: {
      id: string;
      name: string;
      fields: Field[];
    };
  };
}

export interface FetchedFieldValue {
  value: string | boolean;
}

export interface FetchedField {
  name: string;
  jsonValue: FetchedFieldValue;
}

export interface KeyValuePair {
  key: string;
  value: string;
}

export interface SortOption {
  label: string;
  value: string;
}

export interface SearchDefaultFilter {
  FilterKey: string;
  FilterValue: string;
}

export interface SearchWrapperWithQueryStringFields {
  algoliaAppId: Field<string>;
  algoliaApiKey: Field<string>;
  algoliaIndexName: Field<string>;
  algoliaAutosuggestIndexName: Field<string>;
  placeholderText: Field<string>;
  noResultsFoundText: Field<string>;
  filterLabel: Field<string>;
  clearFiltersLabel: Field<string>;
  filterKeyValues: KeyValuePair[];
  facetKeyValues: FacetKeyValues[];
  seeResultsLabel: Field<string>;
  resultsFoundLabel: Field<string>;
  searchResultPageType: Field<string>;
  trainingProviderLabel: Field<string>;
  trainingMethodLabel: Field<string>;
  startDateLabel: Field<string>;
  endDateLabel: Field<string>;
  locationLabel: Field<string>;
  buttonLabel: Field<string>;
  tooltipValue: Field<string>;
  sortByLabel: Field<string>;
  sortOptions: SortOption[];
  defaultFilterKeyValues: SearchDefaultFilter[];
  showLoadMore: boolean;
  loadMoreLabel: Field<string>;
  isSortAvailable: boolean;
}

export interface FetchedSearchWrapperWithQueryStringFields {
  QueryString: string;
  algoliaAppId: string;
  algoliaApiKey: string;
  algoliaIndexName: string;
  algoliaAutosuggestIndexName: string;
  placeholderText: string;
  noResultsFoundText: string;
  filterLabel: string;
  clearFiltersLabel: string;
  filterKeyValues: KeyValuePair[];
  facetKeyValues: FacetKeyValues[];
  seeResultsLabel: string;
  resultsFoundLabel: string;
  searchResultPageType: string;
  trainingProviderLabel: string;
  trainingMethodLabel: string;
  startDateLabel: string;
  endDateLabel: string;
  locationLabel: string;
  buttonLabel: string;
  tooltipValue: string;
  sortByLabel: string;
  sortOptions: SortOption[];
  defaultFilterKeyValues: SearchDefaultFilter[];
  showLoadMore: boolean;
  loadMoreLabel: string;
  isSortAvailable: boolean;
}
