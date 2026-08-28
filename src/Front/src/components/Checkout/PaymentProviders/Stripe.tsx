import { Elements } from '@stripe/react-stripe-js';
import { useMemo } from 'react';

import { useGetPaymentIntent } from 'hooks/index';
import { getStripe } from 'utils/index';
import { useCart } from 'providers/index';

type StripeProviderProps = {
  children: JSX.Element;
};

export default function StripeProvider({ children }: StripeProviderProps) {
  const { paymentIntent, isStripeInfoIncomplete } = useGetPaymentIntent();
  const { isFreeOrder } = useCart();

  const stripeClientSecret = paymentIntent?.stripeClientSecret;
  const canUseStripe = !isFreeOrder && !isStripeInfoIncomplete && Boolean(stripeClientSecret);

  const stripePromise = useMemo(() => {
    if (canUseStripe && paymentIntent?.stripePublishableKey) {
      return getStripe(paymentIntent.stripePublishableKey);
    }

    return Promise.resolve(null);
  }, [canUseStripe, paymentIntent?.stripePublishableKey]);

  // Always provide Elements so useElements() in payment/confirm hooks does not crash
  // when the intent has no card secrets (free orders, B2B prepaid/credit).
  if (!stripeClientSecret || !canUseStripe) {
    return (
      <Elements stripe={stripePromise} options={{}}>
        {children}
      </Elements>
    );
  }

  return (
    <Elements
      key={stripeClientSecret}
      stripe={stripePromise}
      options={{
        clientSecret: stripeClientSecret,
      }}
    >
      {children}
    </Elements>
  );
}
