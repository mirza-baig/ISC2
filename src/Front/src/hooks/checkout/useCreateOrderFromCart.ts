import { useMutation } from '@tanstack/react-query';

import { getServiceLayerAPI } from 'utils/index';
import { LOCALSTORAGE_KEYS } from 'constants/index';
import { useCart } from 'providers/index';
import { PaymentConfirmationPayload } from 'types/index';

export default function useCreateOrderFromCart() {
  const { activeCart } = useCart();

  const { mutateAsync, isPending, data, error } = useMutation({
    mutationFn: async (payload: PaymentConfirmationPayload | null) => {
      const api = await getServiceLayerAPI();

      const cartID = (payload && 'cartID' in payload && payload.cartID) || activeCart.id;
      const input: { cartID: string; intentPaymentId?: string; paymentMethodNonce?: string } = {
        cartID: cartID || '',
      };

      if (payload && 'intentPaymentId' in payload) {
        input.intentPaymentId = payload.intentPaymentId;
      }

      if (payload && 'paymentMethodNonce' in payload) {
        input.paymentMethodNonce = payload.paymentMethodNonce;
      }

      const { data } = await api.post('', {
        query: 'PLACE_ORDER',
        variables: { input },
      });

      if ((data.errors || []).length) {
        throw data.errors[0]?.extensions?.errors?.[0] ?? data.errors[0];
      }

      return data.data.isc2PlaceOrder;
    },
    onSuccess: (placeOrderResult) => {
      // We clear the cartId directly accessing localstorage so it doesn't
      // trigger a re-render on the checkout page with an empty cart id
      if (!activeCart.computed.isB2B && placeOrderResult?.order?.orderNumber) {
        localStorage.setItem(LOCALSTORAGE_KEYS.ACTIVE_CART_ID, '');
        sessionStorage.removeItem(LOCALSTORAGE_KEYS.STRIPE_RETURN_CART_ID);
      }
    },
  });

  return {
    orderCreated: data,
    isCreatingOrder: isPending,
    createOrderAsync: mutateAsync,
    createOrderError: error,
  };
}
