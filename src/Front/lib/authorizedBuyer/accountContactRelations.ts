export const AUTHORIZED_BUYER_ROLE = 'Authorized Buyer';

const ROLE_DELIMITERS = /[;,|]/;

export type AccountContactRelation = {
  accountId?: string | null;
  accountName?: string | null;
  roles?: string | null;
  accountType?: string | null;
  currency?: string | null;
  taxExempt?: boolean | null;
};

const normalize = (value: string) => value.replace(/\s+/g, ' ').trim().toLowerCase();

export const parseRoles = (roles?: string | null): string[] =>
  typeof roles === 'string'
    ? roles
        .split(ROLE_DELIMITERS)
        .map((role) => role.trim())
        .filter(Boolean)
    : [];

const WORD_CHARACTER = /[a-z0-9_]/;

const isWordCharacter = (character: string | undefined): boolean =>
  typeof character === 'string' && WORD_CHARACTER.test(character);

export const rolesContain = (roles: string | null | undefined, role: string): boolean => {
  if (typeof roles !== 'string' || !roles.trim() || !role.trim()) {
    return false;
  }

  const haystack = normalize(roles);
  const needle = normalize(role);
  const needleOpensOnWord = isWordCharacter(needle[0]);
  const needleClosesOnWord = isWordCharacter(needle[needle.length - 1]);

  for (
    let index = haystack.indexOf(needle);
    index !== -1;
    index = haystack.indexOf(needle, index + 1)
  ) {
    const leftBoundary = isWordCharacter(haystack[index - 1]) !== needleOpensOnWord;
    const rightBoundary = isWordCharacter(haystack[index + needle.length]) !== needleClosesOnWord;

    if (leftBoundary && rightBoundary) {
      return true;
    }
  }

  return false;
};

export const toAccountContactRelations = (value: unknown): AccountContactRelation[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (entry): entry is AccountContactRelation => typeof entry === 'object' && entry !== null
  );
};

export const findAuthorizedBuyerRelations = (
  relations: AccountContactRelation[]
): AccountContactRelation[] =>
  relations.filter((relation) => rolesContain(relation.roles, AUTHORIZED_BUYER_ROLE));

export const isAuthorizedBuyer = (
  relations: AccountContactRelation[],
  accountId?: string | null
): boolean => {
  const authorized = findAuthorizedBuyerRelations(relations);

  if (!authorized.length) {
    return false;
  }

  if (!accountId) {
    return true;
  }

  const target = normalize(accountId);
  const matchesTarget = (relation: AccountContactRelation) =>
    typeof relation.accountId === 'string' && normalize(relation.accountId) === target;

  // The selected organization comes from the account picker, which is still fed by the mocked
  // `getAuthorizedBuyerAccounts`. Those ids never appear in the real Salesforce relations, so
  // scoping the role to them would deny every genuine Authorized Buyer. Only narrow to the
  // selected account when the relations actually know it; otherwise fall back to the stated
  // requirement — a relation whose `roles` contains "Authorized Buyer".
  if (!relations.some(matchesTarget)) {
    return true;
  }

  return authorized.some(matchesTarget);
};
