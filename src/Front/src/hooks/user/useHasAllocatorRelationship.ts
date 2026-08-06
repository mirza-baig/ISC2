import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from 'constants/index';

import useLoggedUser from '../useLoggedUser';

/**
 * Temporary Allocator relationship fetch.
 *
 * The relationship lives in Salesforce and has no endpoint yet, so this resolves to
 * `false` — business buyers land on Order History until the service exists. That is the
 * safe default: Order History is reachable by every business buyer, whereas sending a
 * non-allocator to Allocations would be a dead end.
 *
 * To wire it up, add `pages/api/salesforce/b2b/getAllocatorRelationship.ts` following
 * `getAllocations.ts`, then replace this body with the fetch — the return type stays the
 * same and no caller changes. Mirrors how `lib/authorizedBuyer/getAuthorizedBuyerAccounts`
 * documents its own swap.
 */
const getHasAllocatorRelationship = async (externalID?: string): Promise<boolean> => {
  if (!externalID) {
    throw new Error('Error while fetching allocator relationship: invalid parameters');
  }

  return false;
};

/**
 * Whether the logged-in buyer is an allocator, which decides where the business order
 * confirmation's "Open Dashboard" CTA sends them.
 *
 * Deliberately not derived from `useGetAllocations`: that query is gated on the
 * `isConsentAllocation` flag the buyer sets on the allocations tab, so it reports empty
 * for an allocator who has just checked out and never opened that tab.
 */
export default function useHasAllocatorRelationship() {
  const { externalID } = useLoggedUser();

  const { data, isLoading } = useQuery<boolean>({
    queryKey: [QUERY_KEYS.ALLOCATOR_RELATIONSHIP, externalID],
    queryFn: () => getHasAllocatorRelationship(externalID),
    enabled: Boolean(externalID),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: false,
  });

  return {
    hasAllocatorRelationship: data ?? false,
    isGettingAllocatorRelationship: isLoading,
  };
}
