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

  const stripePromise = useMemo(() => {
    if (paymentIntent?.stripePublishableKey) {
      return getStripe(paymentIntent.stripePublishableKey);
    }

    return Promise.resolve(null);
  }, [paymentIntent?.stripePublishableKey]);

  // If order is free, return an empty Stripe config to avoid errors on the useElements hook
  if (!isFreeOrder && (isStripeInfoIncomplete || !paymentIntent)) {
    return children;
  }

  return (
    <Elements
      key={paymentIntent?.stripeClientSecret || 'no-client-secret'}
      stripe={stripePromise}
      options={{
        clientSecret: paymentIntent?.stripeClientSecret,
      }}
    >
      {children}
    </Elements>
  );
}
