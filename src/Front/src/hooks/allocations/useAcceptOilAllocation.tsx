import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getServiceLayerAPI } from 'utils/index';
import useLoggedUser from 'hooks/useLoggedUser';
import { QUERY_KEYS } from 'constants/index';

type AcceptOilAllocationProps = {
  allocationId: string;
  productSku: string;
};

export default function useAcceptOilAllocation() {
  const { externalID, email } = useLoggedUser();
  const queryClient = useQueryClient();

  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: async ({ allocationId, productSku }: AcceptOilAllocationProps) => {
      const api = await getServiceLayerAPI();

      if (!externalID || !email || !allocationId || !productSku) {
        throw new Error('Error while accepting allocation: invalid parameters');
      }

      const response = await api.post('', {
        query: 'ACCEPT_OIL_ALLOCATION',
        variables: {
          input: {
            externalID,
            email,
            allocationId: allocationId,
            productSku,
          },
        },
      });

      const success = response?.data?.data?.salesforceCreateAllocation?.success;

      if (!success || response?.data?.errors?.length > 0) {
        console.error('ERROR DURING accept OIL allocation REQUEST:', response.data?.errors);
        return { success: false, errorCode: response?.data.errors[0].message };
      }

      return { success, errorCode: null };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ALLOCATIONS] });
    },
    onError: (err) => {
      console.error('ERROR DURING accept OIL allocation REQUEST:', err);
    },
  });

  return {
    acceptOilAllocation: mutate,
    acceptOilAllocationAsync: mutateAsync,
    isAcceptingOilAllocation: isPending,
    acceptOilAllocationError: error,
  };
}
