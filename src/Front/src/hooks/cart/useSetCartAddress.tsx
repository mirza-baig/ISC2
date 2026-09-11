import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useCart, useUserSession } from 'providers/index';
import { getMailingAddress } from 'utils/index';
import { QUERY_KEYS } from 'constants/index';
import { MutationCallbacks, PersonalInformation } from 'types/index';

import useAuthorizedBuyerPricingVoucher from './useAuthorizedBuyerPricingVoucher';
import postCartUpdate from './postCartUpdate';

type SetCartAddressProps = {
  personalInformation: PersonalInformation | undefined;
};

export default function useSetCartAddress(callbacks?: MutationCallbacks) {
  const queryClient = useQueryClient();
  const { activeCart } = useCart();

  const { cartId, setCartId } = useUserSession();
  const { voucher: authorizedBuyerPricingVoucher } = useAuthorizedBuyerPricingVoucher();

  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: async ({ personalInformation }: SetCartAddressProps) => {
      if (!personalInformation) {
        return;
      }

      const billingAddress = personalInformation.billingAddress;
      const mailingAddress = getMailingAddress(personalInformation);
      const cartIdForUpdate = activeCart?.id || cartId;

      if (!cartIdForUpdate) {
        throw new Error('Missing cart id while setting cart address');
      }

      // commercetools rejects an address without a country, and it rejects the whole form
      // Fail before the request rather then submitting.
      if (!mailingAddress?.countryCode?.trim()) {
        throw new Error('Missing shipping country while setting cart address');
      }

      return postCartUpdate(
        {
          cartId: cartIdForUpdate,
          actions: [
            {
              setBillingAddress: {
                address: {
                  firstName: personalInformation.firstName,
                  lastName: personalInformation.lastName,
                  company: personalInformation.employer?.trim() || undefined,
                  email: personalInformation.email,
                  phone: personalInformation.phoneNumber,
                  streetName: billingAddress?.street?.trim(),
                  country: billingAddress?.countryCode?.trim()?.toUpperCase(),
                  city: billingAddress?.city?.trim(),
                  state: billingAddress?.stateCode?.trim()?.toUpperCase(),
                  postalCode: billingAddress?.postalCode?.trim(),
                },
              },
            },
            {
              setShippingAddress: {
                address: {
                  firstName: personalInformation.firstName,
                  lastName: personalInformation.lastName,
                  email: personalInformation.email,
                  phone: personalInformation.phoneNumber,
                  streetName: mailingAddress?.street?.trim(),
                  country: mailingAddress?.countryCode?.trim()?.toUpperCase(),
                  city: mailingAddress?.city?.trim(),
                  state: mailingAddress?.stateCode?.trim()?.toUpperCase(),
                  postalCode: mailingAddress?.postalCode?.trim(),
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
    onSuccess: (updatedCart) => {
      if (!activeCart.computed.isB2B && updatedCart && updatedCart.id !== cartId) {
        setCartId(updatedCart.id);
      }

      queryClient.setQueryData([QUERY_KEYS.ACTIVE_CART, updatedCart?.id], updatedCart);

      if (callbacks?.onSuccess) {
        callbacks?.onSuccess();
      }
    },
    onError: callbacks?.onError,
  });

  return {
    setCartAddress: mutate,
    setCartAddressAsync: mutateAsync,
    isSettingCartAddress: isPending,
    setCartAddressError: error,
  };
}
