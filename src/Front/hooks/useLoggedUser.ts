import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { QUERY_KEYS } from 'constants/index';
import { useUserSession } from 'providers/index';
import { useSession } from 'hooks/index';
import { SessionStatus, UserData } from 'types/index';
import { getLoggedInUserSalesforceData, getPersonalInformationFromUser } from 'utils/index';

export default function useLoggedUser() {
  const { session } = useSession();
  const { currencyCode, userCountry } = useUserSession();

  const externalID = useMemo(() => {
    if (session?.user) {
      return session.user.custom_attributes.user_id;
    }

    return undefined;
  }, [session]);

  const email = useMemo(() => {
    if (session?.user) {
      return (
        session.user.custom_attributes?.email || session.user.custom_attributes?.email_address || ''
      );
    }

    return undefined;
  }, [session]);

  const isB2BAdminUser = useMemo(() => {
    if (session?.user) {
      const { isB2BAdmin } = session.user.custom_attributes;

      return isB2BAdmin === 'true';
    }

    return false;
  }, [session?.user]);

  const { data, isLoading, error } = useQuery<UserData>({
    queryKey: [QUERY_KEYS.USER_DATA],
    queryFn: () =>
      getLoggedInUserSalesforceData({
        externalID: externalID!,
        email: email!,
        userCountry,
        currencyCode,
        sync: false,
      }),
    enabled: Boolean(externalID),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: false,
    retryOnMount: false,
  });

  /**
   * Preload the Salesforce account data (includes `accountContactRelations` with B2B
   * roles) as soon as the session hydrates, so downstream `useGetAccountData()` calls
   * on any page read from cache instead of firing their own request. Result is
   * discarded here — consumers pull it via `useGetAccountData()` under the same
   * query key.
   */
  useQuery({
    queryKey: ['accountData', externalID],
    queryFn: async () => {
      const response = await fetch(
        `/api/salesforce/user/getAccountData?externalID=${externalID}&email=${email}`
      );
      if (!response.ok) {
        throw new Error('Failed to prefetch account data');
      }
      return response.json();
    },
    enabled: Boolean(externalID) && Boolean(email),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const userPersonalInformation = useMemo(() => getPersonalInformationFromUser(data), [data]);

  const sessionStatus: SessionStatus = useMemo(() => {
    if (isLoading) {
      return 'loading' as const;
    }

    if (!externalID || !data) {
      return 'unauthenticated' as const;
    }

    return 'authenticated' as const;
  }, [data, externalID, isLoading]);

  return {
    userError: error,
    user: data,
    externalID,
    email,
    userPersonalInformation,
    isGettingUser: sessionStatus === 'loading',
    isUserNotLoggedIn: sessionStatus === 'unauthenticated',
    isUserLoggedIn: sessionStatus === 'authenticated',
    isUserAssociate: data?.isAssociate ?? false,
    isUserMember: (data?.isMember && !data?.isAssociate) ?? false,
    isUserCandidate: (data?.isCandidate && !data?.isAssociate) ?? false,
    isRegisterUser: Boolean(data && !data?.isCandidate && !data?.isMember && !data?.isAssociate),
    isB2BAdminUser,
    accessToken: session?.user.accessToken,
    sessionStatus,
  };
}
