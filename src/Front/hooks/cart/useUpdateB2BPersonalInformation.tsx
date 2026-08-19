import { useMutation } from '@tanstack/react-query';

import { useCart } from 'providers/index';
import { getServiceLayerAPI } from 'utils/index';
import { MutationCallbacks, PersonalInformation, UpdateCartResponse } from 'types/index';

type UpdateB2BPersonalInformationProps = Pick<
  PersonalInformation,
  'firstName' | 'lastName' | 'billingAddress' | 'employer'
>;

export default function useUpdateB2BPersonalInformation(callbacks?: MutationCallbacks) {
  const { activeCart } = useCart();

  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: async ({
      firstName,
      lastName,
      billingAddress,
      employer,
    }: UpdateB2BPersonalInformationProps) => {
      if (!firstName || !lastName || !billingAddress) {
        return;
      }

      const api = await getServiceLayerAPI();

      const { data } = await api.post<UpdateCartResponse>('', {
        query: 'UPDATE_CART',
        variables: {
          cartId: activeCart?.id,
          actions: [
            {
              setBillingAddress: {
                address: {
                  firstName,
                  lastName,
                  company: employer?.trim() || undefined,
                  streetName: billingAddress?.street,
                  country: billingAddress?.countryCode,
                  city: billingAddress?.city,
                  state: billingAddress?.stateCode,
                  postalCode: billingAddress?.postalCode,
                },
              },
            },
          ],
        },
      });

      if ((data.errors || []).length) {
        throw data.errors;
      }

      return data.data.isc2CartUpdate;
    },
    onSuccess: () => {
      if (callbacks?.onSuccess) {
        callbacks?.onSuccess();
      }
    },
    onError: callbacks?.onError,
  });

  return {
    updateB2BPersonalInformation: mutate,
    updateB2BPersonalInformationAsync: mutateAsync,
    isUpdatingB2BPersonalInformation: isPending,
    updateB2BPersonalInformationError: error,
  };
}
