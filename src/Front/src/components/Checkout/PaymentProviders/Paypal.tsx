import { PayPalScriptProvider } from '@paypal/react-paypal-js';

import { useGetPaymentIntent } from 'hooks/index';
import { useCart } from 'providers/cart';

type PaypalProviderProps = {
  children: JSX.Element;
};

export default function PaypalProvider({ children }: PaypalProviderProps) {
  const { paymentIntent, isPaypalInfoIncomplete } = useGetPaymentIntent();
  const { activeCart, isFreeOrder } = useCart();

  if (isFreeOrder || isPaypalInfoIncomplete || !paymentIntent || !activeCart.totalPrice) {
    return children;
  }

  return (
    <PayPalScriptProvider
      options={{
        clientId: paymentIntent.branintreePaypalClientId!,
        dataClientToken: paymentIntent.braintreeClientSecret!,
        currency: activeCart.totalPrice.currencyCode,
        intent: 'capture',
      }}
    >
      {children}
    </PayPalScriptProvider>
  );
}
