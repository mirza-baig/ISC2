import { useState } from 'react';

import { useCheckoutProcess } from 'providers/index';
import { useLoggedUser } from 'hooks/index';

import PersonalInformationForm from './PersonalInformation/PersonalInformationForm';
import PaymentInformationForm from './PaymentInformation/PaymentInformationForm';
import { CHECKOUT_STEPS } from 'constants/index';

export default function CheckoutProcess() {
  const { userPersonalInformation } = useLoggedUser();
  const { activeStep } = useCheckoutProcess();

  const [personalInformation, setPersonalInformation] = useState(userPersonalInformation);

  return (
    <div className="flex-1">
      {activeStep === CHECKOUT_STEPS.PERSONAL_INFORMATION && personalInformation && (
        <PersonalInformationForm
          initialData={personalInformation}
          onStepComplete={setPersonalInformation}
        />
      )}

      {activeStep === CHECKOUT_STEPS.PAYMENT_INFORMATION && (
        <PaymentInformationForm personalInformation={personalInformation} />
      )}
    </div>
  );
}
