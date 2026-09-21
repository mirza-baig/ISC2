import {
  resolveAccountTypeVisibilityKey,
  type AccountTypeVisibilityKey,
} from './accountTypeVisibility';

export const PRODUCT_VISIBILITY_FIELD = 'accountTypeVisibility';

export const VISIBLE_TO_ALL_SENTINEL = 'all';

export const UNSET_MEANS_VISIBLE_TO_ALL = true;

const quote = (value: string) => `"${value.replace(/"/g, '\\"')}"`;

export const buildVisibilityClause = (key: AccountTypeVisibilityKey): string => {
  const terms = [`${PRODUCT_VISIBILITY_FIELD}:${quote(key)}`];

  if (UNSET_MEANS_VISIBLE_TO_ALL) {
    terms.push(`${PRODUCT_VISIBILITY_FIELD}:${quote(VISIBLE_TO_ALL_SENTINEL)}`);
  }

  return `(${terms.join(' OR ')})`;
};

export const buildUnrestrictedOnlyClause = (): string =>
  `(${PRODUCT_VISIBILITY_FIELD}:${quote(VISIBLE_TO_ALL_SENTINEL)})`;

export const buildProductVisibilityFilter = (accountType?: string | null): string => {
  const key = resolveAccountTypeVisibilityKey(accountType);

  return key ? buildVisibilityClause(key) : buildUnrestrictedOnlyClause();
};

export const HIDE_FROM_B2B_LISTING_FIELD = 'hideFromB2BListingPage';

export const buildHideTestProductsFilter = (): string => `${HIDE_FROM_B2B_LISTING_FIELD}:false`;

export const combineFilters = (...filters: (string | null | undefined)[]): string | undefined => {
  const present = filters
    .map((filter) => filter?.trim())
    .filter((filter): filter is string => Boolean(filter));

  if (!present.length) {
    return undefined;
  }

  if (present.length === 1) {
    return present[0];
  }

  return present.map((filter) => `(${filter})`).join(' AND ');
};
