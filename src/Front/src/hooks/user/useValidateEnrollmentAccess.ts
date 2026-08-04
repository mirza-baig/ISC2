import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS, INTERNAL_MULESOFT_URL } from 'constants/index';
import { EnrollmentValidation, LearningJourneyElement } from 'types/index';

interface ValidateEnrollmentAccessParams {
  products: LearningJourneyElement[];
  enabled?: boolean;
}

const validateEnrollmentAccess = async (
  products: LearningJourneyElement[]
): Promise<EnrollmentValidation[]> => {
  if (!products || products.length === 0) {
    return [];
  }

  const requestPayload = products.map((product) => ({
    productKey: product.productInfo.key,
    startDate: product.productInfo.startDate,
    endDate: product.productInfo.endDate,
  }));

  const response = await fetch(`${INTERNAL_MULESOFT_URL}/user/validateEnrollmentAccess`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestPayload),
  });

  const data = await response.json();

  if (!response.ok || data.error) {
    console.error('Error validating enrollment access:', data.error);
    throw new Error('Error validating enrollment access');
  }

  return data;
};

export default function useValidateEnrollmentAccess({
  products,
  enabled = true,
}: ValidateEnrollmentAccessParams) {
  const { data, isLoading, error } = useQuery<EnrollmentValidation[]>({
    queryKey: [QUERY_KEYS.ENROLLMENT_VALIDATION, products.map((p) => p.productInfo.key).join(',')],
    queryFn: async () => validateEnrollmentAccess(products),
    enabled: enabled && products.length > 0,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: false,
    // Revalidate every 5 minutes to catch when enrollment periods start
    staleTime: 5 * 60 * 1000,
  });

  return {
    enrollmentValidations: data || [],
    isValidatingEnrollment: isLoading,
    enrollmentValidationError: error,
  };
}
