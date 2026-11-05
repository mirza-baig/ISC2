import { BaseItem } from '@algolia/autocomplete-core';
import { Field, LinkField } from '@sitecore-jss/sitecore-jss-nextjs';

type Nullable<T> = T | null;

export interface SearchModalSection {
  title: Field<string>;
  links: LinkField[];
}

export interface SearchModalLink {
  link: {
    item: LinkField;
  };
}

export interface SearchModalUserSection {
  type: 'Guest' | 'Candidate' | 'Member';
  userSectionName: Field<string>;
  userSectionLinks: {
    items: SearchModalLink[];
  };
}

export interface SearchModalListItem {
  value: Field<string>;
}

export interface SearchModalLinks {
  sectionTitle: Field<string>;
  sectionType: {
    item: {
      type: {
        value:
          | 'recentSearches'
          | 'isc2Recommends'
          | 'quickAccess'
          | 'noResultsLinks'
          | 'tryTheFollowing'
          | 'productRecommendations';
      };
    };
  };
  sectionListItems: {
    items: SearchModalListItem[];
  };
  sectionOtherProperties: Field<string>;
  sectionLinks: {
    items: SearchModalLink[];
  };
  userProfileSections: {
    items: SearchModalUserSection[];
  };
}

export interface SearchModalAlgoliaSettings {
  algoliaDetails: {
    algoliaApiKey: Field<string>;
    algoliaAppId: Field<string>;
    algoliaIndexName: Field<string>;
    algoliaAutosuggestIndexName: Field<string>;
    placeholderText: Field<string>;
    algoliaProductRecommendationIndexName: Field<string>;
    startSearchTriggerTypes: Field<string>;
    pressEnterKeySearchLabel: Field<string>;
    min3CharacterSearchLabel: Field<string>;
    searchModalNavigationItems: {
      navigationItemsDataSource: Nullable<{
        navigationItemsList: {
          items: SearchModalLinks[];
        };
      }>;
    };
  };
}

export interface SearchModalProductHit extends BaseItem {
  productType: string;
  title: string;
  thumbnailImage: string;
  url: string;
}

export enum SOURCE_ID {
  PRODUCT_SUGGESTIONS = 'PRODUCT_SUGGESTIONS',
  QUERY_SUGGESTIONS = 'QUERY_SUGGESTIONS',
}
