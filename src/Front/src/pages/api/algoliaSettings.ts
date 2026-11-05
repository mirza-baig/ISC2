import type { NextApiRequest, NextApiResponse } from 'next';
import { SEARCH_WRAPPER_SETTINGS_BY_PATH } from 'queries/searchSettings';
import { handledApiPreamble, postSitecoreGraphQL } from 'utils/sitecoreApiRoute';
import {
  FetchedSearchWrapperWithQueryStringFields,
  KeyValuePair,
  SortOption,
  SearchDefaultFilter,
  FetchedField,
} from 'types/algoliaSearch';

interface GraphQLSearchWrapperSettingsResponse {
  data: {
    searchWrapperSettings: {
      id: string;
      name: string;
      fields: FetchedField[];
    };
  };
}

const decodeURIComponentSafe = (str: string): string => {
  try {
    return decodeURIComponent(str);
  } catch {
    return str;
  }
};

const parseFilterKeyValues = (encodedStr: string): KeyValuePair[] => {
  if (!encodedStr) return [];
  const decodedStr = decodeURIComponentSafe(encodedStr);
  const params = new URLSearchParams(decodedStr);
  const keyValuePairs: KeyValuePair[] = [];
  params.forEach((value, key) => {
    keyValuePairs.push({ key, value });
  });
  return keyValuePairs;
};

const parseSortOptions = (str: string): SortOption[] => {
  if (!str) return [];
  return str.split('&').map((option) => {
    const [label, value] = option.split('=');
    return { label, value };
  });
};

const parseDefaultFilterKeyValues = (str: string): SearchDefaultFilter[] => {
  if (!str) return [];
  const decodedStr = decodeURIComponentSafe(str);
  const params = new URLSearchParams(decodedStr);
  const defaultFilters: SearchDefaultFilter[] = [];
  params.forEach((value, key) => {
    defaultFilters.push({ FilterKey: key, FilterValue: value });
  });
  return defaultFilters;
};

const SETTINGS_REF_MAX_LENGTH = 200;

const SETTINGS_PATH_PREFIX = '/sitecore/content/ISC2/Main/Settings/';

const isGuidRef = (ref: string): boolean =>
  /^\{?[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}\}?$/i.test(ref);

const isContentPathRef = (ref: string): boolean => {
  if (!ref.startsWith(SETTINGS_PATH_PREFIX)) {
    return false;
  }

  if (!/^\/sitecore\/content\/[\w\-/ &.']+$/i.test(ref)) {
    return false;
  }

  return ref
    .split('/')
    .every((segment) => segment !== '..' && segment !== '.' && !segment.startsWith('..'));
};

const isAllowedSettingsRef = (ref: string): boolean =>
  ref.length <= SETTINGS_REF_MAX_LENGTH && (isGuidRef(ref) || isContentPathRef(ref));

const resolveSettingsRef = (req: NextApiRequest): string | null => {
  const raw = req.query.id;
  const ref = (Array.isArray(raw) ? raw[0] : raw)?.trim();

  return ref && isAllowedSettingsRef(ref) ? ref : null;
};

const algoliaSettings = async (req: NextApiRequest, res: NextApiResponse) => {
  if (handledApiPreamble(req, res)) {
    return;
  }

  const settingsRef = resolveSettingsRef(req);

  if (!settingsRef) {
    return res.status(400).json({ error: 'A valid Algolia settings item reference is required.' });
  }

  try {
    const response = await postSitecoreGraphQL<GraphQLSearchWrapperSettingsResponse>(
      SEARCH_WRAPPER_SETTINGS_BY_PATH,
      { path: settingsRef }
    );

    const settings = response.data?.data?.searchWrapperSettings;

    if (!settings) {
      throw new Error('Search Wrapper Settings not found.');
    }

    const parsedSettings: FetchedSearchWrapperWithQueryStringFields = {
      QueryString: '',
      algoliaAppId: '',
      algoliaApiKey: '',
      algoliaIndexName: '',
      algoliaAutosuggestIndexName: '',
      placeholderText: '',
      noResultsFoundText: '',
      filterLabel: '',
      clearFiltersLabel: '',
      filterKeyValues: [],
      facetKeyValues: [],
      seeResultsLabel: '',
      resultsFoundLabel: '',
      searchResultPageType: '',
      trainingProviderLabel: '',
      trainingMethodLabel: '',
      startDateLabel: '',
      endDateLabel: '',
      locationLabel: '',
      buttonLabel: '',
      tooltipValue: '',
      sortByLabel: '',
      sortOptions: [],
      defaultFilterKeyValues: [],
      showLoadMore: false,
      loadMoreLabel: '',
      isSortAvailable: false,
    };

    settings.fields.forEach((field) => {
      switch (field.name) {
        case 'QueryString':
          parsedSettings.QueryString = field.jsonValue.value as string;
          break;
        case 'algoliaAppId':
          parsedSettings.algoliaAppId = field.jsonValue.value as string;
          break;
        case 'algoliaApiKey':
          parsedSettings.algoliaApiKey = field.jsonValue.value as string;
          break;
        case 'algoliaIndexName':
          parsedSettings.algoliaIndexName = field.jsonValue.value as string;
          break;
        case 'algoliaAutosuggestIndexName':
          parsedSettings.algoliaAutosuggestIndexName = field.jsonValue.value as string;
          break;
        case 'placeholderText':
          parsedSettings.placeholderText = field.jsonValue.value as string;
          break;
        case 'noResultsFoundText':
          parsedSettings.noResultsFoundText = field.jsonValue.value as string;
          break;
        case 'filterLabel':
          parsedSettings.filterLabel = field.jsonValue.value as string;
          break;
        case 'clearFiltersLabel':
          parsedSettings.clearFiltersLabel = field.jsonValue.value as string;
          break;
        case 'filterKeyValues':
          parsedSettings.filterKeyValues = parseFilterKeyValues(field.jsonValue.value as string);
          break;
        case 'facetKeyValues':
          parsedSettings.facetKeyValues = parseFilterKeyValues(field.jsonValue.value as string);
          break;
        case 'seeResultsLabel':
          parsedSettings.seeResultsLabel = field.jsonValue.value as string;
          break;
        case 'resultsFoundLabel':
          parsedSettings.resultsFoundLabel = field.jsonValue.value as string;
          break;
        case 'searchResultPageType':
          parsedSettings.searchResultPageType = field.jsonValue.value as string;
          break;
        case 'trainingProviderLabel':
          parsedSettings.trainingProviderLabel = field.jsonValue.value as string;
          break;
        case 'trainingMethodLabel':
          parsedSettings.trainingMethodLabel = field.jsonValue.value as string;
          break;
        case 'startDateLabel':
          parsedSettings.startDateLabel = field.jsonValue.value as string;
          break;
        case 'endDateLabel':
          parsedSettings.endDateLabel = field.jsonValue.value as string;
          break;
        case 'locationLabel':
          parsedSettings.locationLabel = field.jsonValue.value as string;
          break;
        case 'buttonLabel':
          parsedSettings.buttonLabel = field.jsonValue.value as string;
          break;
        case 'tooltipValue':
          parsedSettings.tooltipValue = field.jsonValue.value as string;
          break;
        case 'sortByLabel':
          parsedSettings.sortByLabel = field.jsonValue.value as string;
          break;
        case 'sortOptionDetails':
          parsedSettings.sortOptions = parseSortOptions(field.jsonValue.value as string);
          break;
        case 'defaultFiltersForPage':
          parsedSettings.defaultFilterKeyValues = parseDefaultFilterKeyValues(
            field.jsonValue.value as string
          );
          break;
        case 'showLoadMore':
          parsedSettings.showLoadMore = field.jsonValue.value === true;
          break;
        case 'loadMoreLabel':
          parsedSettings.loadMoreLabel = field.jsonValue.value as string;
          break;
        case 'isSortAvailable':
          parsedSettings.isSortAvailable = field.jsonValue.value === true;
          break;
        default:
          break;
      }
    });

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'private, max-age=300');
    res.status(200).json(parsedSettings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch algolia settings.' });
  }
};

export default algoliaSettings;
