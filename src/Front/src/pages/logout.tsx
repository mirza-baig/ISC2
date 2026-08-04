import { signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

import { useUserSession } from 'providers/index';
import { useQueryClient } from '@tanstack/react-query';

export default function Logout() {
  const router = useRouter();
  const { setCartId, setIsCurrencyManualOverride, setIsConsentAllocation } = useUserSession();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Signs user out of our Next App
    signOut({ redirect: false }).then(async () => {
      await queryClient.invalidateQueries();
      setCartId('');
      setIsCurrencyManualOverride(false);
      setIsConsentAllocation(false);
      sessionStorage.removeItem('allocation-sort-isc2');
      sessionStorage.removeItem('allocation-sort-dir-isc2');
      sessionStorage.removeItem('allocation-filters-isc2');
      router.push('/');
    });
  }, [queryClient, router, setCartId, setIsConsentAllocation, setIsCurrencyManualOverride]);

  return null;
}
