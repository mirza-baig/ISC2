import { useMutation } from '@tanstack/react-query';
import { ALLOCATION_FLOW, INTERNAL_MULESOFT_URL } from 'constants/index';
import useLoggedUser from 'hooks/useLoggedUser';

type AcceptTermsAndConditionsProps = {
  isConsentAccepted: boolean;
};

export default function useAcceptTermsAndConditions() {
  const { externalID } = useLoggedUser();

  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationFn: async ({ isConsentAccepted }: AcceptTermsAndConditionsProps) => {
      if (!externalID) {
        throw new Error('Error while accepting allocation: invalid parameters');
      }

      const response = await fetch(`${INTERNAL_MULESOFT_URL}/b2b/acceptTermsAndConditions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isConsentAccepted,
          flow: ALLOCATION_FLOW,
        }),
      });

      const data = await response.json();

      if (!data?.success) {
        console.error('Error while accepting terms and conditions:', data?.message);
        throw `Error while accepting terms and conditions: ${data?.message}`;
      }

      return data.success;
    },
  });

  return {
    acceptTermsAndConditions: mutate,
    acceptTermsAndConditionsAsync: mutateAsync,
    isAcceptingTermsAndConditions: isPending,
    acceptTermsAndConditionsError: error,
  };
}
