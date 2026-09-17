import { useCheckoutProcess } from 'providers/index';

import PersonalInformationForm from './PersonalInformation/PersonalInformationForm';
import PaymentInformationForm from './PaymentInformation/PaymentInformationForm';
import PaypalProvider from './PaymentProviders/Paypal';
import StripeProvider from './PaymentProviders/Stripe';
import { CHECKOUT_STEPS } from 'constants/index';

export default function CheckoutProcess() {
  const { activeStep, personalInformation, setPersonalInformation } = useCheckoutProcess();

  return (
    <div className="flex-1">
      {activeStep === CHECKOUT_STEPS.PERSONAL_INFORMATION && personalInformation && (
        <PersonalInformationForm
          initialData={personalInformation}
          onStepComplete={setPersonalInformation}
        />
      )}

      {/* The payment providers wrap the payment step only. Stripe's <Elements> is re-keyed
          on every new client secret and PayPal's script provider comes and goes with the
          intent, so keeping them above the whole process remounted step one — and wiped
          what the buyer had typed — each time a refreshed payment intent landed. */}
      {activeStep === CHECKOUT_STEPS.PAYMENT_INFORMATION && (
        <PaypalProvider>
          <StripeProvider>
            <PaymentInformationForm personalInformation={personalInformation} />
          </StripeProvider>
        </PaypalProvider>
      )}
    </div>
  );
}
