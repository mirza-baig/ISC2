import { useQuery } from '@tanstack/react-query';

import { getCreditHoldLabelsQuery } from 'queries/creditHoldSettings';
import { getGraphQLResult } from 'utils/graphQLFunctions';
import { parseFieldsFromURLString } from 'utils/index';

type CreditHoldLabelsResponse = {
  item: {
    field: {
      value: string;
    } | null;
  } | null;
};

type PaymentInformationLabels = {
  creditHoldMessage?: string;
};

const CREDIT_HOLD_MESSAGE_FALLBACK =
  'Online buying is currently unavailable for this account. Please contact your sales representative.';

export const useCreditHoldMessage = () => {
  const { data } = useQuery({
    queryKey: ['credit-hold-message'],
    staleTime: Infinity,
    queryFn: async () => {
      const result = await getGraphQLResult<CreditHoldLabelsResponse>(getCreditHoldLabelsQuery());
      const labels = parseFieldsFromURLString<PaymentInformationLabels>({
        value: result?.item?.field?.value ?? '',
      });

      return labels.creditHoldMessage || CREDIT_HOLD_MESSAGE_FALLBACK;
    },
  });

  return data ?? CREDIT_HOLD_MESSAGE_FALLBACK;
};
