import { useElements, useStripe } from '@stripe/react-stripe-js';
import { useRouter } from 'next/router';
import { useCallback } from 'react';

import { LOCALSTORAGE_KEYS } from 'constants/index';
import { useCart } from 'providers/index';
import { PaymentResponse } from 'types/index';
import { buildCheckoutReturnUrl } from 'utils/checkoutReturnUrl';

import useGetPaymentIntent from './useGetPaymentIntent';

export default function useHandleStripePayment() {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const { activeCart } = useCart();

  const { paymentIntent } = useGetPaymentIntent();

  const handleStripePayment = useCallback(async (): Promise<PaymentResponse> => {
    if (!stripe) {
      throw '[Confirm payment] - Stripe is not defined';
    }

    if (!elements) {
      throw '[Confirm payment] - Stripe Elements is not defined';
    }

    if (!paymentIntent?.stripeClientSecret) {
      throw '[Confirm payment] - Client secret is not defined for current checkout transaction';
    }

    const { error: submitError } = await elements.submit();

    if (submitError) {
      throw `[Confirm payment] - There was an error while submitting payment: ${submitError}`;
    }

    if (activeCart?.id) {
      sessionStorage.setItem(LOCALSTORAGE_KEYS.STRIPE_RETURN_CART_ID, activeCart.id);
    }

    const result = await stripe.confirmPayment({
      elements,
      clientSecret: paymentIntent.stripeClientSecret,
      redirect: 'if_required',
      confirmParams: {
        return_url: buildCheckoutReturnUrl(router.asPath),
      },
    });

    if (result.error) {
      return { status: 'failed' };
    }

    return {
      status: 'succeeded',
      orderPayload: { intentPaymentId: paymentIntent.intentPaymentId },
    };
  }, [activeCart?.id, elements, paymentIntent, router.asPath, stripe]);

  return { handleStripePayment };
}
