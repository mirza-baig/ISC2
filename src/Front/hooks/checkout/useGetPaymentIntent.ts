/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useMemo } from 'react';

import { QUERY_KEYS } from 'constants/index';
import { Cart, CartWithComputedData, PaymentIntent } from 'types/index';
import { getServiceLayerAPI } from 'utils/getServiceLayerAPI';
import { CurrencyCodes } from 'utils/currencies';
import { useCustomMutation } from 'hooks/index';
import { useCart, useCheckoutProcess } from 'providers/index';

type MutationPayload = {
  cart: Cart | CartWithComputedData;
  paymentMethodType?: string;
};

type MutationResponse = {
  data: {
    isc2CreatePaymentIntent: PaymentIntent;
  };
};

const PAYPAL_CURRENCIES: string[] = [CurrencyCodes.USD];

const removePaypalInfo = (paymentIntent: PaymentIntent) => {
  const { braintreeClientSecret, branintreePaypalClientId, ...rest } = paymentIntent;

  return rest;
};

export default function useGetPaymentIntent() {
  const { isFreeOrder } = useCart();
  const { setErrorState } = useCheckoutProcess();

  const { isPending, mutate, mutateAsync, data, isSuccess, error } = useCustomMutation<
    PaymentIntent,
    Error,
    MutationPayload
  >({
    mutationKey: [QUERY_KEYS.PAYMENT_INTENT],
    mutationFn: async ({ cart, paymentMethodType }: MutationPayload) => {
      const requestStartTime = performance.now();
      const requestId = `payment-intent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      console.log(`[PAYMENT-INTENT-DEBUG] ${requestId} - Starting payment intent request`, {
        cartId: cart.id,
        cartVersion: cart.version,
        currency: cart.totalPrice?.currencyCode,
        amount: cart.totalPrice?.centAmount,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        location: window.location.href,
      });

      try {
        const api = await getServiceLayerAPI();

        console.log(
          `[PAYMENT-INTENT-DEBUG] ${requestId} - Service layer API obtained, making request`
        );

        const { data } = await api.post<MutationResponse>('', {
          query: 'CREATE_PAYMENT_INTENT',
          variables: {
            cartId: cart.id,
            cartVersion: cart.version,
            ...(paymentMethodType && { paymentMethodType }),
          },
        });

        const requestEndTime = performance.now();
        const duration = requestEndTime - requestStartTime;

        console.log(`[PAYMENT-INTENT-DEBUG] ${requestId} - Payment intent request successful`, {
          duration: `${duration.toFixed(2)}ms`,
          responseData: {
            hasStripeClientSecret: !!data.data.isc2CreatePaymentIntent?.stripeClientSecret,
            hasStripePublishableKey: !!data.data.isc2CreatePaymentIntent?.stripePublishableKey,
            hasBraintreeClientSecret: !!data.data.isc2CreatePaymentIntent?.braintreeClientSecret,
            hasBraintreePaypalClientId:
              !!data.data.isc2CreatePaymentIntent?.branintreePaypalClientId,
            intentPaymentId: data.data.isc2CreatePaymentIntent?.intentPaymentId,
          },
          timestamp: new Date().toISOString(),
        });

        if (PAYPAL_CURRENCIES.includes(cart.totalPrice!.currencyCode)) {
          console.log(
            `[PAYMENT-INTENT-DEBUG] ${requestId} - Currency supports PayPal, returning full payment intent`
          );
          return data.data.isc2CreatePaymentIntent;
        }

        console.log(
          `[PAYMENT-INTENT-DEBUG] ${requestId} - Currency does not support PayPal, removing PayPal info`
        );
        return removePaypalInfo(data.data.isc2CreatePaymentIntent);
      } catch (err) {
        const requestEndTime = performance.now();
        const duration = requestEndTime - requestStartTime;

        console.error(`[PAYMENT-INTENT-DEBUG] ${requestId} - Payment intent request failed`, {
          duration: `${duration.toFixed(2)}ms`,
          error: {
            message: err instanceof Error ? err.message : String(err),
            name: err instanceof Error ? err.name : 'Unknown',
            stack: err instanceof Error ? err.stack : undefined,
            code: 'code' in (err as object) ? (err as { code?: string }).code : undefined,
            response: {
              status:
                'response' in (err as object)
                  ? (err as { response?: { status?: number } }).response?.status
                  : undefined,
              statusText:
                'response' in (err as object)
                  ? (err as { response?: { statusText?: string } }).response?.statusText
                  : undefined,
              data:
                'response' in (err as object)
                  ? (err as { response?: { data?: unknown } }).response?.data
                  : undefined,
              headers:
                'response' in (err as object)
                  ? (err as { response?: { headers?: Record<string, string> } }).response?.headers
                  : undefined,
            },
          },
          request: {
            cartId: cart.id,
            cartVersion: cart.version,
            currency: cart.totalPrice?.currencyCode,
          },
          userContext: {
            userAgent: navigator.userAgent,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            location: window.location.href,
          },
          timestamp: new Date().toISOString(),
        });

        throw err;
      }
    },
  });

  const isStripeInfoIncomplete = useMemo(
    () => !data?.stripeClientSecret || !data?.stripePublishableKey,
    [data?.stripeClientSecret, data?.stripePublishableKey]
  );

  const isPaypalInfoIncomplete = useMemo(
    () => !data?.braintreeClientSecret || !data?.branintreePaypalClientId,
    [data?.braintreeClientSecret, data?.branintreePaypalClientId]
  );

  useEffect(() => {
    if (data && isStripeInfoIncomplete && isPaypalInfoIncomplete && !isFreeOrder) {
      console.error('[PAYMENT-INTENT-DEBUG] Payment information incomplete - setting error state', {
        paymentIntentData: {
          hasStripeClientSecret: !!data?.stripeClientSecret,
          hasStripePublishableKey: !!data?.stripePublishableKey,
          hasBraintreeClientSecret: !!data?.braintreeClientSecret,
          hasBraintreePaypalClientId: !!data?.branintreePaypalClientId,
          intentPaymentId: data?.intentPaymentId,
        },
        flags: {
          isStripeInfoIncomplete,
          isPaypalInfoIncomplete,
          isFreeOrder,
        },
        userContext: {
          userAgent: navigator.userAgent,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          location: window.location.href,
        },
        timestamp: new Date().toISOString(),
      });

      setErrorState([{ message: 'PAYMENT_INFORMATION_INCOMPLETE' }]);
    }
  }, [data, isFreeOrder, isPaypalInfoIncomplete, isStripeInfoIncomplete, setErrorState]);

  useEffect(() => {
    if (error) {
      console.error('[PAYMENT-INTENT-DEBUG] Payment intent mutation error detected', {
        error: {
          message: error.message,
          name: error.name,
          stack: error.stack,
          cause: 'cause' in error ? (error as { cause?: unknown }).cause : undefined,
        },
        userContext: {
          userAgent: navigator.userAgent,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          location: window.location.href,
        },
        timestamp: new Date().toISOString(),
      });
    }
  }, [error]);

  return {
    getPaymentIntent: isFreeOrder ? () => null : mutate,
    getPaymentIntentAsync: isFreeOrder ? async () => undefined : mutateAsync,
    isStripeInfoIncomplete: isSuccess && isStripeInfoIncomplete,
    isPaypalInfoIncomplete: isSuccess && isPaypalInfoIncomplete,
    paymentIntent: data,
    paymentIntentError: error,
    isGettingPaymentIntent: isPending,
  };
}
