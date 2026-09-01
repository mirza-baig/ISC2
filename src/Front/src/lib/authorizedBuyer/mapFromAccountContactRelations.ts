import { isAccountFlagSet } from './paymentEligibility';
import type { AuthorizedBuyerAccount, AuthorizedBuyerAddress } from './types';

/** Live CloudHub `accountContactRelations[]` item on `/v1/user/accountData`. */
export type LiveAccountContactRelation = {
  accountId?: string | null;
  accountName?: string | null;
  accountOwnerEmail?: string | null;
  accountType?: string | null;
  currency?: string | null;
  pricingTier?: string | null;
  taxExempt?: boolean | string | null;
  creditHold?: boolean | string | null;
  shippingAddress?: {
    line1?: string | null;
    street?: string | null;
    line2?: string | null;
    streetTwo?: string | null;
    city?: string | null;
    state?: string | null;
    stateCode?: string | null;
    postalCode?: string | null;
    country?: string | null;
    countryCode?: string | null;
  } | null;
  purchaseControls?: {
    poRequired?: boolean | string | null;
    poAttachmentRequired?: boolean | string | null;
    prepaidAuthorized?: boolean | string | null;
  } | null;
  credit?: {
    creditHold?: boolean | string | null;
    paymentTerms?: string | null;
    creditLimit?: number | string | null;
    creditBalance?: number | string | null;
    availableCredit?: number | string | null;
  } | null;
  prepaid?: {
    expirationDate?: string | null;
    balance?: number | string | null;
    type?: string | null;
    discountPercentage?: number | string | null;
  } | null;
};

const toNullableFlag = (value?: boolean | string | null): boolean | null => {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  const normalized = value.trim().toLowerCase();

  if (['true', 'yes', '1'].includes(normalized)) {
    return true;
  }

  if (['false', 'no', '0'].includes(normalized)) {
    return false;
  }

  return null;
};

const toMoney = (value?: number | string | null): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
};

const toIsoCode = (value?: string | null) => {
  const trimmed = value?.trim();

  if (!trimmed) {
    return '';
  }

  // commercetools rejects country/state names; live Mule often sends both.
  return trimmed.length <= 3 ? trimmed.toUpperCase() : '';
};

const mapShippingAddress = (
  address?: LiveAccountContactRelation['shippingAddress']
): AuthorizedBuyerAddress => ({
  line1: address?.line1 || address?.street || '',
  line2: address?.line2 || address?.streetTwo || undefined,
  city: address?.city || '',
  state: toIsoCode(address?.stateCode) || address?.state || '',
  postalCode: address?.postalCode || '',
  country: toIsoCode(address?.countryCode) || toIsoCode(address?.country) || '',
});

export const mapLiveRelationToAccount = (
  relation: LiveAccountContactRelation
): AuthorizedBuyerAccount | null => {
  const accountId = relation.accountId?.trim();
  const accountName = relation.accountName?.trim();

  if (!accountId || !accountName) {
    return null;
  }

  const prepaidBalance = toMoney(relation.prepaid?.balance);
  const hasPrepaidObject = Boolean(relation.prepaid && typeof relation.prepaid === 'object');

  return {
    accountId,
    accountName,
    accountOwnerEmail: relation.accountOwnerEmail?.trim() || undefined,
    accountType: relation.accountType || 'B2B',
    currency: relation.currency || 'USD',
    pricingTier: relation.pricingTier || 'ENTERPRISE_1',
    creditHold: isAccountFlagSet(relation.creditHold ?? relation.credit?.creditHold),
    taxExempt: isAccountFlagSet(relation.taxExempt),
    shippingAddress: mapShippingAddress(relation.shippingAddress),
    purchaseControls: {
      poRequired: isAccountFlagSet(relation.purchaseControls?.poRequired),
      poAttachmentRequired: toNullableFlag(relation.purchaseControls?.poAttachmentRequired),
      prepaidAuthorized: toNullableFlag(relation.purchaseControls?.prepaidAuthorized),
    },
    credit: {
      paymentTerms: relation.credit?.paymentTerms || '',
      creditLimit: toMoney(relation.credit?.creditLimit),
      creditBalance: toMoney(relation.credit?.creditBalance),
      availableCredit: toMoney(relation.credit?.availableCredit),
    },
    ...(hasPrepaidObject
      ? {
          prepaid: {
            expirationDate: relation.prepaid?.expirationDate || null,
            balance: prepaidBalance,
            type: relation.prepaid?.type ?? null,
            discountPercentage: toMoney(relation.prepaid?.discountPercentage),
          },
        }
      : {}),
  };
};

export const mapAccountContactRelationsToAccounts = (
  relations: unknown
): AuthorizedBuyerAccount[] => {
  if (!Array.isArray(relations)) {
    return [];
  }

  return relations
    .map((relation) =>
      relation && typeof relation === 'object'
        ? mapLiveRelationToAccount(relation as LiveAccountContactRelation)
        : null
    )
    .filter((account): account is AuthorizedBuyerAccount => Boolean(account));
};

/** Live orgs first so QA sees Salesforce names above the mock playbook. */
export const mergeLiveAndMockAccounts = (
  liveAccounts: AuthorizedBuyerAccount[],
  mockAccounts: AuthorizedBuyerAccount[]
): AuthorizedBuyerAccount[] => {
  const liveIds = new Set(liveAccounts.map((account) => account.accountId));

  return [
    ...liveAccounts.map((account) => ({ ...account })),
    ...mockAccounts
      .filter((account) => !liveIds.has(account.accountId))
      .map((account) => ({ ...account })),
  ];
};
