import { useQuery } from '@tanstack/react-query';
import {
  QUERY_KEYS,
  INTERNAL_MULESOFT_URL,
  SUBSCRIPTION_STATUS,
  SUBSCRIPTION_PAYMENT_STATUS,
} from 'constants/index';
import useLoggedUser from 'hooks/useLoggedUser';
import { isOldUserExternalId } from 'utils/index';

type Subscription = {
  enrollmentStart: string;
  enrollmentEnd: string;
  isCancelled: string;
  cancelledReason: string | null;
  gracePeriodEndDate: string;
  paymentStatus: string;
  status: string;
  AMFType: string;
  UpgradeAMFType: string;
  remainingDays: number;
  sku: string;
  subscriptionPaidThroughDate: string;
  cpeStatus: string | null;
};

const getSubscriptions = async (externalID?: string, email?: string) => {
  if (!externalID || !email) {
    throw new Error('Error while fetching subscriptions data');
  }

  if (isOldUserExternalId(externalID)) {
    throw new Error(`Invalid externalID while fetching subscriptions: ${externalID}`);
  }

  const response = await fetch(
    `${INTERNAL_MULESOFT_URL}/user/getSubscriptions?externalID=${externalID}&email=${email}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  const data = await response.json();

  if (data.error) {
    console.error(data.error);
    throw data.error;
  }

  if (!data || !data?.length) {
    return null;
  }

  return data.length > 1
    ? data.find((subscription: Subscription) => subscription.isCancelled === 'false') || data[0]
    : data[0];
};

export default function useGetSubscriptions() {
  const { externalID, email } = useLoggedUser();

  const { data, isLoading, error } = useQuery<Subscription>({
    queryKey: [QUERY_KEYS.SUBSCRIPTIONS],
    queryFn: () => getSubscriptions(externalID, email),
    enabled: Boolean(externalID),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: false,
  });

  return {
    subscription: data,
    isSuspended: Boolean(
      data?.status?.toLowerCase() === SUBSCRIPTION_STATUS.suspended ||
        data?.status?.toLowerCase() === SUBSCRIPTION_STATUS.cancelled
    ),
    isPastDue: data?.paymentStatus.toLowerCase() === SUBSCRIPTION_PAYMENT_STATUS.pastDue,
    isGettingSubscriptions: isLoading,
    getSubscriptionsError: error,
  };
}
