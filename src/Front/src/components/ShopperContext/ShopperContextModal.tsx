import { useCallback, useEffect, useRef } from 'react';

import { useAuthorizedBuyer, useLoggedUser, useSession } from 'hooks/index';
import { getAuthorizedBuyerAccounts, mapAccountsToShopperOrganizations } from 'lib/authorizedBuyer';
import { useModal, useShopperContext } from 'providers/index';
import { useFeatureFlag } from 'providers/featureFlags';
import type { ShopperOrganization } from 'providers/shopperContext';
import {
  B2B_FEATURE_FLAG,
  SHOPPER_CONTEXT_PROMPTED_KEY,
  SHOPPER_CONTEXT_STORAGE_KEY,
} from 'constants/index';

import ShopperContextModalContent from './ShopperContextModalContent';

const hasPromptedForUser = (userId?: string) => {
  if (typeof window === 'undefined' || !userId) {
    return false;
  }

  if (localStorage.getItem(SHOPPER_CONTEXT_PROMPTED_KEY) === userId) {
    return true;
  }

  if (sessionStorage.getItem(SHOPPER_CONTEXT_PROMPTED_KEY) === userId) {
    localStorage.setItem(SHOPPER_CONTEXT_PROMPTED_KEY, userId);
    sessionStorage.removeItem(SHOPPER_CONTEXT_PROMPTED_KEY);
    return true;
  }

  return false;
};

const markPromptedForUser = (userId?: string) => {
  if (typeof window === 'undefined' || !userId) {
    return;
  }

  localStorage.setItem(SHOPPER_CONTEXT_PROMPTED_KEY, userId);
  sessionStorage.removeItem(SHOPPER_CONTEXT_PROMPTED_KEY);
};

const hasStoredSelectionForUser = (userId?: string) => {
  if (typeof window === 'undefined' || !userId) {
    return false;
  }

  try {
    const raw =
      localStorage.getItem(SHOPPER_CONTEXT_STORAGE_KEY) ||
      sessionStorage.getItem(SHOPPER_CONTEXT_STORAGE_KEY);
    if (!raw) {
      return false;
    }

    const parsed = JSON.parse(raw) as { userId?: string };
    return parsed.userId === userId;
  } catch {
    return false;
  }
};

export default function ShopperContextModal() {
  const { setModalContent, closeModal, modalContent } = useModal();
  const { setShopperContext } = useShopperContext();
  const { session, isSessionLoading } = useSession();
  const { isUserLoggedIn, isGettingUser, isB2BAdminUser, externalID, email } = useLoggedUser();
  const { isAuthorizedBuyer, isResolvingAuthorizedBuyer } = useAuthorizedBuyer({
    enabled: isB2BAdminUser,
  });
  const isB2BFlowEnabled = useFeatureFlag(B2B_FEATURE_FLAG);
  const hasOpenedRef = useRef(false);

  const dismissModal = useCallback(() => {
    markPromptedForUser(externalID);
    hasOpenedRef.current = true;
    closeModal();
  }, [closeModal, externalID]);

  const openModalForOrganizations = useCallback(
    (organizations: ShopperOrganization[]) => {
      if (!externalID) {
        return;
      }

      markPromptedForUser(externalID);
      hasOpenedRef.current = true;

      setModalContent(
        <ShopperContextModalContent
          organizations={organizations}
          onConfirm={dismissModal}
          onCancel={dismissModal}
        />,
        {
          dismissOnClickOutside: false,
        }
      );
    },
    [dismissModal, externalID, setModalContent]
  );

  useEffect(() => {
    if (isSessionLoading || isGettingUser || modalContent || hasOpenedRef.current) {
      return;
    }

    if (!isUserLoggedIn || !externalID) {
      return;
    }

    if (!isB2BFlowEnabled) {
      markPromptedForUser(externalID);
      hasOpenedRef.current = true;
      setShopperContext({ type: 'myself', organization: null });
      return;
    }

    if (isResolvingAuthorizedBuyer) {
      return;
    }

    if (!isB2BAdminUser || !isAuthorizedBuyer || !email) {
      return;
    }

    if (hasPromptedForUser(externalID) || hasStoredSelectionForUser(externalID)) {
      hasOpenedRef.current = true;
      return;
    }

    let cancelled = false;

    const loadAndPrompt = async () => {
      try {
        const response = await getAuthorizedBuyerAccounts(externalID, { email });
        if (cancelled) {
          return;
        }

        const organizations = mapAccountsToShopperOrganizations(response.accounts);

        if (organizations.length === 0) {
          markPromptedForUser(externalID);
          hasOpenedRef.current = true;
          setShopperContext({ type: 'myself', organization: null });
          return;
        }

        openModalForOrganizations(organizations);
      } catch (error) {
        console.error('Failed to load authorized buyer accounts', error);
        if (cancelled) {
          return;
        }

        markPromptedForUser(externalID);
        hasOpenedRef.current = true;
        setShopperContext({ type: 'myself', organization: null });
      }
    };

    void loadAndPrompt();

    return () => {
      cancelled = true;
    };
  }, [
    isSessionLoading,
    isGettingUser,
    isUserLoggedIn,
    isB2BAdminUser,
    isAuthorizedBuyer,
    isResolvingAuthorizedBuyer,
    isB2BFlowEnabled,
    externalID,
    email,
    modalContent,
    openModalForOrganizations,
    setShopperContext,
  ]);

  useEffect(() => {
    if (isSessionLoading) {
      return;
    }

    const sessionUserId = session?.user?.custom_attributes?.user_id;

    if (!sessionUserId) {
      hasOpenedRef.current = false;
      localStorage.removeItem(SHOPPER_CONTEXT_PROMPTED_KEY);
      sessionStorage.removeItem(SHOPPER_CONTEXT_PROMPTED_KEY);
    }
  }, [isSessionLoading, session?.user?.custom_attributes?.user_id]);

  return null;
}
