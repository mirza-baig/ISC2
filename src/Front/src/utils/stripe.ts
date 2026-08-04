import { Stripe, loadStripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null>;

export const getStripe = (stripePublicKey?: string) => {
  if (!stripePublicKey) {
    throw "ERROR: There is no Stripe's Public Key for the current cart currency.";
  }

  if (!stripePromise) {
    stripePromise = loadStripe(stripePublicKey);
  }

  return stripePromise;
};
