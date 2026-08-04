import { useMemo } from 'react';
import { Field, ImageField } from '@sitecore-jss/sitecore-jss-nextjs';

import { useAutocomplete } from 'providers/index';
import { SearchModalAlgoliaSettings, SearchModalLinks, SearchModalUserSection } from 'types/index';

import useLoggedUser from './useLoggedUser';

export type AlgoliaDetails = SearchModalAlgoliaSettings['algoliaDetails'];
export type SectionType = SearchModalLinks['sectionType']['item']['type']['value'];
export type UserRole = SearchModalUserSection['type'];

const DEFAULT_SECTION = {
  title: { value: '' },
  links: [],
};

const getSection = (algoliaDetails: AlgoliaDetails, sectionType: SectionType) => {
  const { navigationItemsDataSource } = algoliaDetails.searchModalNavigationItems;

  if (navigationItemsDataSource) {
    const section = navigationItemsDataSource.navigationItemsList.items.find(
      (item) => item.sectionType?.item?.type?.value === sectionType
    );

    return section;
  }

  return undefined;
};

const getSectionByType = (algoliaDetails: AlgoliaDetails, sectionType: SectionType) => {
  const section = getSection(algoliaDetails, sectionType);

  if (section) {
    return {
      title: section.sectionTitle,
      links: (section.sectionLinks?.items || [])
        .filter((items) => items.link?.item)
        .map((items) => items.link.item),
    };
  }

  return DEFAULT_SECTION;
};

type ProductsRecommendationsSection = SearchModalLinks & {
  sectionFallbackProductsList?: {
    targetItems?: Array<{
      url: {
        path: string;
      };
      productImage: {
        item: ImageField;
      };
      productName: Field<string>;
      productType: {
        item: {
          type: Field<string>;
        };
      };
    }>;
  };
};

const getProductRecommendationsDefaultSuggestions = (section: ProductsRecommendationsSection) => {
  if (!section.sectionFallbackProductsList?.targetItems?.length) {
    return [];
  }

  return section.sectionFallbackProductsList.targetItems
    .filter((link) => link.productType?.item?.type?.value)
    .map((link) => ({
      title: link.productName.value,
      thumbnailImage: link.productImage?.item?.value?.src || '',
      productType: link.productType.item.type.value || '',
      url: link.url.path,
    }));
};

const getProductRecommendationsSection = (algoliaDetails: AlgoliaDetails) => {
  const section: ProductsRecommendationsSection | undefined = getSection(
    algoliaDetails,
    'productRecommendations'
  );

  if (section) {
    return {
      title: section.sectionTitle,
      links: (section.sectionLinks?.items || [])
        .filter((items) => items.link?.item)
        .map((items) => items.link.item),
      defaultSuggestions: getProductRecommendationsDefaultSuggestions(section),
    };
  }

  return { ...DEFAULT_SECTION, defaultSuggestions: [] };
};

const getSectionByUserRole = (
  algoliaDetails: AlgoliaDetails,
  sectionType: SectionType,
  userRole: UserRole
) => {
  const section = getSection(algoliaDetails, sectionType);

  if (section) {
    const userRoleSection = section.userProfileSections?.items?.find(
      ({ type }) => type === userRole
    );

    if (userRoleSection) {
      return {
        title: userRoleSection.userSectionName,
        links: (userRoleSection.userSectionLinks?.items || [])
          .filter((item) => item.link?.item)
          .map((item) => item.link.item),
      };
    }
  }

  return DEFAULT_SECTION;
};

const getNoResultsMessage = (algoliaDetails: AlgoliaDetails, sectionType: SectionType) => {
  const section = getSection(algoliaDetails, sectionType);

  if (section) {
    const params = new URLSearchParams(section.sectionOtherProperties.value);

    return params.get('noResultsFoundMessage');
  }

  return '';
};

const getTryTheFollowingList = (algoliaDetails: AlgoliaDetails) => {
  const section = getSection(algoliaDetails, 'tryTheFollowing');

  if (section) {
    return {
      title: section.sectionTitle,
      links: (section.sectionListItems?.items || [])
        .filter((item) => item.value)
        .map((item) => item.value),
    };
  }

  return DEFAULT_SECTION;
};

export default function useAutocompleteLinks() {
  const { isUserCandidate, isUserMember } = useLoggedUser();
  const { algoliaDetails } = useAutocomplete();

  const userShouldSeeRecentSearches = useMemo(
    () => isUserMember || isUserCandidate,
    [isUserCandidate, isUserMember]
  );

  const userRole = useMemo((): UserRole => {
    if (isUserCandidate) {
      return 'Candidate';
    }

    if (isUserMember) {
      return 'Member';
    }

    return 'Guest';
  }, [isUserCandidate, isUserMember]);

  return {
    userShouldSeeRecentSearches,
    isc2RecommendsSection: getSectionByUserRole(algoliaDetails, 'isc2Recommends', userRole),
    quickAccessSection: getSectionByUserRole(algoliaDetails, 'quickAccess', userRole),
    recentSearchesSection: getSectionByType(algoliaDetails, 'recentSearches'),
    productRecommendationsSection: getProductRecommendationsSection(algoliaDetails),
    tryTheFollowingList: getTryTheFollowingList(algoliaDetails),
    noResultsSection: getSectionByType(algoliaDetails, 'noResultsLinks'),
    noResultsMessage: getNoResultsMessage(algoliaDetails, 'noResultsLinks'),
    noProductsMessage: getNoResultsMessage(algoliaDetails, 'productRecommendations'),
  };
}
