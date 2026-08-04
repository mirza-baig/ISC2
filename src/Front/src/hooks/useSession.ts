import { useSession as useNextAuthSession } from 'next-auth/react';

import { UserSession } from 'types/index';

export default function useSession(): { session: UserSession | null; isSessionLoading: boolean } {
  const { data, status } = useNextAuthSession();

  if (data) {
    return { session: data as unknown as UserSession, isSessionLoading: false };
  }

  return { session: null, isSessionLoading: status === 'loading' };
}
