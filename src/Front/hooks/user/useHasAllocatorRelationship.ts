import { useMemo } from 'react';

import { B2B_ROLES } from 'constants/roles';
import useGetAccountData from '../useGetAccountData';

const parseRoles = (rolesString?: string | null): string[] =>
  rolesString
    ?.split(';')
    .map((r) => r.trim())
    .filter(Boolean) ?? [];

/**
 * Whether the logged-in buyer is an allocator on any of their B2B accounts, which
 * decides where the business order confirmation's "Open Dashboard" CTA sends them.
 *
 * Derived from the account data response's `accountContactRelations[].roles` — a
 * semicolon-delimited Salesforce multi-picklist. The underlying query is prefetched
 * inside `useLoggedUser` on session hydration, so reading it here is a cache hit and
 * never triggers its own network request.
 *
 * `some()` treats the user as an allocator if any of their relationships grants the
 * role; narrow to a specific account here if the confirmation ever becomes
 * order-scoped for multi-account B2B users.
 */
export default function useHasAllocatorRelationship() {
  const { data: accountData, isLoading } = useGetAccountData();

  const hasAllocatorRelationship = useMemo(() => {
    const relations = accountData?.data?.salesforceGetAccountData?.accountContactRelations ?? [];
    return relations.some((relation) => parseRoles(relation?.roles).includes(B2B_ROLES.ALLOCATOR));
  }, [accountData]);

  return {
    hasAllocatorRelationship,
    isGettingAllocatorRelationship: isLoading,
  };
}
