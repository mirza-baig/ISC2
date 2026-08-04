import { useCallback } from 'react';
import { PAYMENT_METHODS } from 'constants/index';

import { ConfirmPaymentPayload, PaymentResponse } from 'types/index';

export default function useHandlePaypalPayment() {
  const handlePaypalPayment = useCallback((payload: ConfirmPaymentPayload): PaymentResponse => {
    if (payload.paymentMethod !== PAYMENT_METHODS.PAYPAL) {
      return { status: 'failed' };
    }

    return {
      status: 'succeeded',
      orderPayload: { paymentMethodNonce: payload.paymentMethodNonce },
    };
  }, []);

  return { handlePaypalPayment };
}
