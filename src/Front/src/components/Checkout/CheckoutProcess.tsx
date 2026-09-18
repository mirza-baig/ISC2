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
