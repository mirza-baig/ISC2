import { useMutation, useQueryClient } from '@tanstack/react-query';
import { INTERNAL_MULESOFT_URL, QUERY_KEYS } from 'constants/index';
import useLoggedUser from 'hooks/useLoggedUser';

type AcceptAllocationProps = {
  allocationId: string;
  consent: boolean;
};

export default function useAcceptAllocation() {
  const { externalID } = useLoggedUser();
  const queryClient = useQueryClient();

  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: async ({ allocationId, consent }: AcceptAllocationProps) => {
      if (!externalID || !allocationId) {
        throw new Error('Error while accepting allocation: invalid parameters');
      }

      const response = await fetch(`${INTERNAL_MULESOFT_URL}/b2b/acceptAllocation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ allocationId, consent }),
      });

      const data = await response.json();

      if (data.error) {
        console.error('Error while accepting allocation:', data.error);
        throw data.error;
      }

      return data;
    },
    onSuccess: () => {
      // Refresh allocations and learning journey list on user dashboard
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.ALLOCATIONS, QUERY_KEYS.LEARNING_JOURNEY],
      });
    },
  });

  return {
    acceptAllocation: mutate,
    acceptAllocationAsync: mutateAsync,
    isAcceptingAllocation: isPending,
    acceptAllocationError: error,
  };
}
