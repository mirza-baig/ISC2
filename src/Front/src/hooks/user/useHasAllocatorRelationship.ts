import { useMemo } from 'react';

import { B2B_ROLES } from 'constants/roles';
import useGetAccountData from '../useGetAccountData';

const parseRoles = (rolesString?: string | null): string[] =>
  rolesString
    ?.split(';')
    .map((r) => r.trim())
    .filter(Boolean) ?? [];
export default function useHasAllocatorRelationship(accountId?: string) {
  const { data: accountData, isLoading } = useGetAccountData();

  const hasAllocatorRelationship = useMemo(() => {
    const relations = accountData?.data?.salesforceGetAccountData?.accountContactRelations ?? [];
    return relations.some(
      (relation) =>
        relation?.accountId === accountId &&
        parseRoles(relation?.roles).includes(B2B_ROLES.ALLOCATOR)
    );
  }, [accountData, accountId]);

  return {
    hasAllocatorRelationship,
    isGettingAllocatorRelationship: isLoading,
  };
}
