/* eslint-disable @typescript-eslint/no-explicit-any */
import { AutocompleteState } from '@algolia/autocomplete-core';
import {
  Field,
  Item,
  LinkField,
  TextField,
  ImageField,
  RichTextField,
  RouteData,
  LayoutServiceContext,
  HTMLLink,
} from '@sitecore-jss/sitecore-jss-nextjs';

import { CPECredit } from './profile';
import { TypedMoney } from './pricing';
import { ServiceLayerError } from './miniCart';
import { CurrencyCodes } from 'utils/index';
import { USER_ROLES } from 'constants/index';

export * from './analytics';
export * from './searchModal';
export * from './checkout';
export * from './users';
export * from './forms';
export * from './pricing';
export * from './miniCart';
export * from './cart';
export * from './profile';
export * from './order';
export * from './profile';
export * from './learningJourney';
export * from './product';
export * from './allocations';
export * from './languagePreference';

export type Tokens = {
  accessToken: string;
  refreshToken: string;
};

export interface SVGIconProps {
  size: number;
  className?: string;
}

export type TooltipPosition = 'left' | 'right' | 'bottom' | 'top';

export type CustomItem<T> = Item & { fields: T };

export type DropLinkFieldType = CustomItem<{ Value: Field }>;

export interface BackgroundThemeField {
  backgroundGradient: DropLinkFieldType;
}

interface Fields {
  link: LinkField;
  logo?: ImageField;
  abstract?: TextField;
  icon?: ImageField;
}

export interface NavigationLink {
  className?: string;
  displayAs?: 'MainNavigationLink' | 'TextLink' | 'Headline';
  displayName?: TextField;
  fields: Fields;
  isActive: boolean;
  isHovered?: boolean;
  name?: TextField;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  id?: string;
  tabIndex?: number;
}

export interface ColumnLinks {
  heading: TextField;
  icon: ImageField;
  links: NavigationLink[];
}

export interface Tab {
  tabHeading: TextField;
  tabDescription: TextField;
  tabName: TextField;
  columnLinks: ColumnLinks[];
}

export interface PromoCard {
  promoImage: ImageField;
  promoHeading: TextField;
  promoLinkCTA: LinkField;
}

export interface Caption {
  title: TextField;
  content: TextField;
}

export interface MenuItem {
  menuDisplayName: TextField;
  mainHeadline: TextField;
  mainDescription: TextField;
  columnLinks: ColumnLinks[];
  promoCard: PromoCard;
  tabs: Tab[];
}

export interface HeaderNavigationFields {
  logo: ImageField;
  navigationItems: MenuItem[];
}

export interface HeaderNavigation {
  fields: HeaderNavigationFields;
}

export type ColorSelector = {
  fields: {
    backgroundColorHexCode: Field<string>;
    foregroundColorHexCode: Field<string>;
  };
};

export interface UserLinksFields {
  registerForExamLink: LinkField;
  shoppingCartLink: LinkField;
  memberLinksSection: DropLinkFieldType;
  associateLinksSection: DropLinkFieldType;
  registerUserLinksSection: DropLinkFieldType;
  candidateLinksSection: DropLinkFieldType;
  b2bAdminLinksSection: DropLinkFieldType;
  selectCurrencyText: TextField;
  enableCurrencyConfirmation: Field<boolean>;
  currencyDetectedText: TextField;
  confirmButtonText: TextField;
  revertButtonText: TextField;
}

export interface HeaderUserLinks {
  id: string;
  fields: {
    userSectionName: TextField;
  };
  children: HeaderUserLinksSection[];
}

export interface HeaderUserLinkField {
  id: string;
  name: string;
  fields: {
    link: LinkField;
  };
}

interface HeaderUserLinksSection {
  id: string;
  fields: {
    userSectionName: Field<string>;
  };
  children: HeaderUserLinkField[];
}

export interface NavigationLayoutProps {
  onBackButtonClick: () => void;
}

export interface GraphQLResponse<T> {
  data: T;
}

export interface AlgoliaSettings {
  algoliaDetails: {
    algoliaApiKey: Field<string>;
    algoliaAppId: Field<string>;
    algoliaIndexName: Field<string>;
    algoliaAutosuggestIndexName: Field<string>;
    placeholderText: Field<string>;
  };
}

export interface AlgoliaSettingsForInsightListing {
  algoliaDetails: {
    algoliaApiKey: Field<string>;
    algoliaAppId: Field<string>;
    algoliaSortDescByDateIndexName: Field<string>;
  };
}

export interface AlgoliaSettingsForChapterFinder {
  algoliaDetails: {
    algoliaApiKey: Field<string>;
    algoliaAppId: Field<string>;
    algoliaChapterFilderIndexName: Field<string>;
  };
}

export interface SearchResultHit {
  content: string;
  contentLength: number;
  description: string;
  productType: string;
  title: string;
  type: string;
  url: string;
  image?: string;
  pinned?: boolean;
  articleDate?: string;
  [key: string]: any;
}

export interface FacetKeyValues {
  FacetAttribute: string;
  FacetLabel: string;
  FacetType: string;
  KeyName: string;
}

export interface SearchDefaultFilter {
  FilterKey: string;
  FilterValue: string;
}

export type SortOptions = SearchDefaultFilter;

export interface SocialProfileLink {
  fields: {
    label: Field<string>;
    ctaLink: LinkField;
  };
}

export interface LeadershipCardFields {
  ctaLabel?: Field<string>;
  description?: RichTextField;
  image: ImageField;
  location: TextField;
  nameCertification: TextField;
  title: TextField;
}

interface PathFinderOption {
  response: Field<string>;
  nextStep: Field<number>;
}

export interface PathFinderResult {
  title: Field<string>;
  eyebrow?: Field<string>;
  abstract?: Field<string>;
  image: ImageField;
  link?: LinkField;
  cardUrl?: Field<string>;
}

export interface PathFinderStep {
  id: Field<number>;
  type: Field<string>;
  eyebrow?: Field<string>;
  title: Field<string>;
  abstract?: Field<string>;
  link?: LinkField;
  options?: PathFinderOption[];
  previousStepId: Field<number>;
  results?: PathFinderResult[];
}

export interface LayoutPropsExtended {
  layoutData: LayoutServiceDataExtended;
  headLinks: HTMLLink[];
}

export interface LayoutServiceDataExtended {
  sitecore: LayoutServiceContextDataUpdated & {
    route: RouteData | null;
  };
}

export interface LayoutServiceContextDataUpdated {
  context: LayoutServiceContextUpdated;
}

export interface LayoutServiceContextUpdated extends LayoutServiceContext {
  canonicalUrl?: string;
}

export interface ThumbnailBlockCardFields {
  headline: TextField;
  thumbnailImage: ImageField;
  link: LinkField;
}

export interface BackgroundGradient {
  fields: {
    backgroundGradient: Field<string>;
    contentHexColor: Field<string>;
  };
}

export interface RssArticle {
  name: string;
  fields: Array<{
    name: string;
    value: string;
  }>;
  url: {
    path: string;
  };
  thumbnailImage?: {
    src: string;
  };
  showInRSSFeed?: {
    value: string;
  };
}

export interface RssArticleDetails {
  articleBody: string;
  thumbnailImage: string;
  articleHeading: string;
  articleDate: string;
  articleUrl: string;
}

export interface RssGraphQLResponse {
  search: {
    results: RssArticle[];
    pageInfo: {
      endCursor: string;
      hasNext: boolean;
    };
    total: number;
  };
}

export interface RssChannel extends AtomLink {
  title: string;
  description: string;
  link: string | undefined;
  item: {
    title: string;
    description: string;
    link: string;
    pubDate: string;
    enclosure: {
      $: {
        url: string;
        type: string;
      };
    }[];
  }[];
}

export interface AtomLink {
  'atom:link': {
    $: {
      href: string;
      rel: string;
      type: string;
    };
  }[];
}

export interface RSSObject {
  rss: {
    $: {
      version: '2.0';
      'xmlns:atom': string;
    };
    channel: RssChannel[];
  };
}
export interface QuerySuggestion {
  objectID: string;
  query: string;
  [key: string]: unknown;
}

export type AutocompleteSuggestions = Pick<
  AutocompleteState<QuerySuggestion>,
  'collections' | 'query' | 'status'
>;

export type SessionStatus = 'loading' | 'unauthenticated' | 'authenticated';

export type UserRole =
  | USER_ROLES.MEMBER
  | USER_ROLES.CANDIDATE
  | USER_ROLES.ASSOCIATE
  | USER_ROLES.REGISTERED
  | USER_ROLES.B2B_ADMIN
  | USER_ROLES.GUEST;

export type UserSession = {
  user: {
    email?: string;
    accessToken?: {
      data: string;
      dataKey: string;
    };
    custom_attributes: {
      user_id: string;
      email?: string;
      email_address?: string;
      memberFlag: 'true' | 'false';
      candidateFlag: 'true' | 'false';
      associateFlag: 'true' | 'false';
      isB2BAdmin: 'true' | 'false';
    };
  };
};

export type UserAddress = {
  street: string;
  streetTwo?: string;
  city: string;
  state: string;
  stateCode: string;
  postalCode: string;
  country: string;
  countryCode: string;
};

/**
 * Business account data sourced from the Salesforce Account object.
 * Every member is optional: the Mulesoft payload is still being extended
 * (see ITDEV-910 for `poAttachmentRequired`), so nothing here can be assumed present.
 */
export type BusinessAccountPurchaseControls = {
  /** `PO_Required__c` is a Yes/No picklist in Salesforce, so a string may arrive here. */
  poRequired?: boolean | string;
  poAttachmentRequired?: boolean | string;
  prepaidAuthorized?: boolean | string;
};

export type BusinessAccountCredit = {
  paymentTerms?: string;
  creditLimit?: number;
  creditBalance?: number;
};

export type BusinessAccountPrepaid = {
  expirationDate?: string;
  balance?: number;
};

export type BusinessAccount = {
  id?: string;
  name?: string;
  accountType?: string;
  taxExempt?: boolean;
  shippingAddress?: Partial<UserAddress>;
  purchaseControls?: BusinessAccountPurchaseControls;
  credit?: BusinessAccountCredit;
  prepaid?: BusinessAccountPrepaid;
};

export type UserData = {
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  prefix: string;
  suffix: string;
  nickname: string;
  pronouns: string;
  utmId: null | string;
  utmCampaignId: null | string;
  customerId: string;
  subscription: {
    startDate: string;
    renewalDate?: string;
  };
  isMember: boolean;
  isCandidate: boolean;
  isAssociate: boolean;
  badges?: {
    id: string;
    name: string;
    awardedDate: string;
    expiredDate: string;
    status: string;
    isActive: boolean;
    badgeType: {
      id: string;
      name: string;
      description: string;
      icon: string;
      image: string;
      code: string;
    };
  }[];
  cpes?: CPECredit[];
  mailingAddress: UserAddress;
  billingAddress: UserAddress;
  isSameAddress: boolean;
  employer: string;
  jobTitle: string;
  phoneNumber?: string;
  workPhone?: string;
  workEmail?: string;
  isGovernmentEmployee: boolean;
  isGovernmentContractor: boolean;
  /** Salesforce Contact `OtherPhone`. Business buyers' checkout phone edits are written here. */
  otherPhone?: string;
  /** Business accounts the contact is an authorized buyer for. */
  accounts?: BusinessAccount[];
  certifications?: {
    id: string;
    name: string;
    status: string;
    completionDate: string;
    activeCertificationTerm: {
      id: string;
      startDate: string;
      endDate: string;
      gracePeriodEndDate: string;
    };
    badgeType: {
      id: string;
      name: string;
      description: string;
      icon: string;
      image: string;
      code: string;
    };
  }[];
  product?: {
    sku: string;
    name: string;
    variantName: string;
    ctCustomerGroup: string;
    prices: TypedMoney[];
  };
};

export type UserPicture = {
  base64: string;
  isLoading: boolean;
};

export interface PromoCardFields {
  heading: Field<string>;
  description: Field<string>;
  headingSize: {
    fields: {
      Value: Field<'medium' | 'large'>;
    };
  };
}

export interface RouteFields {
  [key: string]: unknown;
  Title?: Field;
  pageTitle?: Field;
  pageDescription?: Field;
  ogTitle?: Field;
  ogDescription?: Field;
  ogImage?: ImageField;
  jsonLd?: Field;
  type?: Field;
  articleDate?: Field<string>;
  thumbnailImage?: ImageField;
  badgeLogoImage?: ImageField;
  noIndex?: Field<boolean>;
  noFollow?: Field<boolean>;
  enableInPageNavigation: Field<boolean>;
  membersOnly?: Field<boolean>;
  candidateOnly?: Field<boolean>;
  productKey?: Field<string>;
  sku?: Field<string>;
  formType: DropLinkFieldType;
  pageLanguage?: Field<string>;
  promoPills?: Field<string>;
  promoCard?: { fields: PromoCardFields };
}

export interface PromoPills {
  regularPill?: string;
  discountPillNumber?: string;
  discountPillComplement?: string;
}

export type FlashAlert = {
  type: 'success' | 'error';
  label: string;
  closable?: boolean;
};

export type Country = {
  countryName: string;
  countryCode: string;
};

export type State = {
  stateName: string;
  stateCode: string;
};

export type MutationCallbacks<TSuccess = void, TError = ServiceLayerError[] | string> = {
  onSuccess?: (value?: TSuccess) => void;
  onError?: (errors: TError | null) => void;
};

export type CountryInfo = {
  country: string;
  currency: CurrencyCodes;
};
