import { useMutation } from '@tanstack/react-query';

import { useCart } from 'providers/index';
import { MutationCallbacks, PersonalInformation } from 'types/index';

import useAuthorizedBuyerPricingVoucher from './useAuthorizedBuyerPricingVoucher';
import postCartUpdate from './postCartUpdate';

type UpdateB2BPersonalInformationProps = Pick<
  PersonalInformation,
  'firstName' | 'lastName' | 'billingAddress' | 'employer'
>;

export default function useUpdateB2BPersonalInformation(callbacks?: MutationCallbacks) {
  const { activeCart } = useCart();
  const { voucher: authorizedBuyerPricingVoucher } = useAuthorizedBuyerPricingVoucher();

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

      return postCartUpdate(
        {
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
          authorizedBuyerPricingVoucher,
        },
        (errors) => {
          throw errors;
        }
      );
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
