import { signOut } from 'next-auth/react';
import { useEffect } from 'react';

import { useUserSession } from 'providers/index';
import { useQueryClient } from '@tanstack/react-query';
import { SESSION_STORAGE_KEYS, SESSION_LOCALSTORAGE_KEYS } from 'constants/sessionTimeout';

import { BUYER_MOCK_SCENARIO_SESSION_KEY, clearBuyerMockRaceDeplete } from 'lib/authorizedBuyer';
import { clearCartIds } from 'utils/cartIdStore';
import { SHOPPER_CONTEXT_PROMPTED_KEY, SHOPPER_CONTEXT_STORAGE_KEY } from 'constants/index';

export default function Logout() {
  const { setCartId, setIsCurrencyManualOverride, setIsConsentAllocation } = useUserSession();
  const queryClient = useQueryClient();

  useEffect(() => {
    const clearClientState = () => {
      setCartId('');
      clearCartIds();
      setIsCurrencyManualOverride(false);
      setIsConsentAllocation(false);
      sessionStorage.removeItem(SESSION_STORAGE_KEYS.SESSION_ACTIVE);
      localStorage.removeItem(SHOPPER_CONTEXT_STORAGE_KEY);
      sessionStorage.removeItem(SHOPPER_CONTEXT_STORAGE_KEY);
      localStorage.removeItem(SHOPPER_CONTEXT_PROMPTED_KEY);
      sessionStorage.removeItem(SHOPPER_CONTEXT_PROMPTED_KEY);
      sessionStorage.removeItem('allocation-sort-isc2');
      sessionStorage.removeItem('allocation-sort-dir-isc2');
      sessionStorage.removeItem(BUYER_MOCK_SCENARIO_SESSION_KEY);
      clearBuyerMockRaceDeplete();
      sessionStorage.removeItem('allocation-filters-isc2');
      localStorage.removeItem(SESSION_LOCALSTORAGE_KEYS.LAST_ACTIVITY);
      queryClient.clear();
    };

    // Signs user out of our Next App, then hard-navigate so no stale React/session state remains.
    signOut({ redirect: false })
      .catch(() => undefined)
      .then(() => {
        clearClientState();
        window.location.assign('/');
      });
  }, [queryClient, setCartId, setIsConsentAllocation, setIsCurrencyManualOverride]);

  return null;
}
