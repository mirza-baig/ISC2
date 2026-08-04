import { useQueryClient } from '@tanstack/react-query';

import { useUserSession } from 'providers/index';
import { getServiceLayerAPI } from 'utils/index';
import { QUERY_KEYS } from 'constants/index';
import { Cart, ServiceLayerError, UpdateCartResponse } from 'types/index';
import { useCustomMutation, useGetPaymentIntent } from 'hooks/index';

type TaxUpdatePayload = {
  cartId?: string;
  paymentIntentId?: string | null;
};

export default function useUpdateTax() {
  const queryClient = useQueryClient();
  const { paymentIntent } = useGetPaymentIntent();
  const { cartId, setCartId } = useUserSession();

  const { mutate, mutateAsync, isPending, error, isSuccess } = useCustomMutation<
    Cart | undefined,
    ServiceLayerError,
    TaxUpdatePayload | undefined
  >({
    mutationKey: [QUERY_KEYS.TAXES, cartId],
    mutationFn: async (payload) => {
      const requestStartTime = performance.now();
      const requestId = `tax-update-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const cartIdForTaxUpdate = payload?.cartId || cartId;
      const paymentIntentId = payload?.paymentIntentId ?? paymentIntent?.intentPaymentId ?? null;

      console.log(`[TAX-UPDATE-DEBUG] ${requestId} - Starting tax update request`, {
        cartId: cartIdForTaxUpdate,
        paymentIntentId,
        timestamp: new Date().toISOString(),
        location: window.location.href,
      });

      const api = await getServiceLayerAPI();

      try {
        const { data } = await api.post<UpdateCartResponse>('', {
          query: 'UPDATE_CART_TAX',
          variables: {
            cartId: cartIdForTaxUpdate,
            paymentIntentId,
          },
        });

        const duration = performance.now() - requestStartTime;

        if ((data.errors || []).length) {
          console.error(`[TAX-UPDATE-DEBUG] ${requestId} - Tax update returned errors`, {
            duration: `${duration.toFixed(2)}ms`,
            errors: data.errors,
            request: {
              cartId: cartIdForTaxUpdate,
              paymentIntentId,
            },
            timestamp: new Date().toISOString(),
          });

          throw data.errors[0];
        }

        console.log(`[TAX-UPDATE-DEBUG] ${requestId} - Tax update request successful`, {
          duration: `${duration.toFixed(2)}ms`,
          updatedCartId: data.data.isc2CartTaxUpdate?.id,
          updatedCartVersion: data.data.isc2CartTaxUpdate?.version,
          timestamp: new Date().toISOString(),
        });

        return data.data.isc2CartTaxUpdate;
      } catch (err) {
        const duration = performance.now() - requestStartTime;
        const response =
          typeof err === 'object' && err !== null && 'response' in err
            ? (err as { response?: { status?: number; statusText?: string; data?: unknown } })
                .response
            : undefined;

        console.error(`[TAX-UPDATE-DEBUG] ${requestId} - Tax update request failed`, {
          duration: `${duration.toFixed(2)}ms`,
          error: {
            message: err instanceof Error ? err.message : String(err),
            name: err instanceof Error ? err.name : 'Unknown',
            stack: err instanceof Error ? err.stack : undefined,
            serviceLayerError: err,
            response: {
              status: response?.status,
              statusText: response?.statusText,
              data: response?.data,
            },
          },
          request: {
            cartId: cartIdForTaxUpdate,
            paymentIntentId,
          },
          timestamp: new Date().toISOString(),
        });

        throw err;
      }
    },
    onSuccess: (data) => {
      if (data && data.id !== cartId) {
        setCartId(data.id);
      }

      if (data) {
        queryClient.setQueryData([QUERY_KEYS.ACTIVE_CART, data.id], data);
      }
    },
  });

  return {
    setTaxes: mutate,
    setTaxesAsync: mutateAsync,
    isSettingTaxes: isPending,
    taxesError: error,
    taxUpdateSucccess: isSuccess,
  };
}
