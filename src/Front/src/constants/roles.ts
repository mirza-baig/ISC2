export enum ACCOUNT_CONTACT_ROLES {
  AUTHORIZED_BUYER = 'authorized buyer',
  ALLOCATOR = 'allocator',
}

export enum USER_ROLES {
  MEMBER = 'member',
  CANDIDATE = 'candidate',
  ASSOCIATE = 'associate',
  REGISTERED = 'registered',
  B2B_ADMIN = 'b2b_admin',
  B2B_AUTHORIZED_BUYER = 'b2b_authorized_buyer',
  GUEST = 'guest',
}

/**
 * Salesforce B2B account permissions from `accountContactRelations[].roles` — a
 * semicolon-delimited multi-picklist. A single B2B admin can hold multiple of these,
 * and they can differ across accounts, so treat these as a *set* rather than a single
 * value (that's what USER_ROLES.B2B_ADMIN above is for).
 *
 * Values must match the strings Salesforce returns because membership checks compare
 * on equality after splitting on `;`.
 */
export const B2B_ROLES = {
  ALLOCATOR: 'Allocator',
  AUTHORIZED_BUYER: 'Authorized Buyer',
} as const;

export type B2BRole = (typeof B2B_ROLES)[keyof typeof B2B_ROLES];
