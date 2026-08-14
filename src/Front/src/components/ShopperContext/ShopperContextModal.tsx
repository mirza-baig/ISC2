import { useCallback, useEffect, useRef } from 'react';

import { useLoggedUser, useSession } from 'hooks/index';
import { getAuthorizedBuyerAccounts, mapAccountsToShopperOrganizations } from 'lib/authorizedBuyer';
import { useModal, useShopperContext } from 'providers/index';
import { useFeatureFlag } from 'providers/featureFlags';
import type { ShopperOrganization } from 'providers/shopperContext';

import ShopperContextModalContent from './ShopperContextModalContent';

const PROMPTED_SESSION_KEY = 'b2b-shopper-context-prompted';

const hasPromptedForUser = (userId?: string) => {
  if (typeof window === 'undefined' || !userId) {
    return false;
  }

  return sessionStorage.getItem(PROMPTED_SESSION_KEY) === userId;
};

const markPromptedForUser = (userId?: string) => {
  if (typeof window === 'undefined' || !userId) {
    return;
  }

  sessionStorage.setItem(PROMPTED_SESSION_KEY, userId);
};

/**
 * Shows the B2B shopper-context modal once after login when the buyer has
 * 1+ authorized organizations. Zero relationships skip the modal and keep
 * the existing individual shopping experience.
 * Purchase enforcement remains out of scope for this story.
 */
export default function ShopperContextModal() {
  const { setModalContent, closeModal, modalContent } = useModal();
  const { setShopperContext } = useShopperContext();
  const { session, isSessionLoading } = useSession();
  const { isUserLoggedIn, isGettingUser, isB2BAdminUser, externalID } = useLoggedUser();
  const isB2BFlowEnabled = useFeatureFlag('B2B_Company_Flow');
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

      // Mark as soon as we open so a refresh does not show the modal again.
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

    if (!isUserLoggedIn || !isB2BAdminUser || !externalID) {
      return;
    }

    // Flag off: never prompt, and fail closed to individual shopping the same way the
    // zero-accounts and error paths do. Checked before the prompted guard so an
    // organization stored while the flag was on cannot survive it being turned off.
    if (!isB2BFlowEnabled) {
      markPromptedForUser(externalID);
      hasOpenedRef.current = true;
      setShopperContext({ type: 'myself', organization: null });
      return;
    }

    if (hasPromptedForUser(externalID)) {
      hasOpenedRef.current = true;
      return;
    }

    let cancelled = false;

    const loadAndPrompt = async () => {
      try {
        const response = await getAuthorizedBuyerAccounts(externalID);
        if (cancelled) {
          return;
        }

        const organizations = mapAccountsToShopperOrganizations(response.accounts);

        // Ticket #1: 0 authorized buyer relationships → individual experience unchanged.
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

        // Fail closed to individual shopping so login is never blocked.
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
    isB2BFlowEnabled,
    externalID,
    modalContent,
    openModalForOrganizations,
    setShopperContext,
  ]);

  // Clear only on real NextAuth logout — not while Salesforce profile is still loading.
  useEffect(() => {
    if (isSessionLoading) {
      return;
    }

    const sessionUserId = session?.user?.custom_attributes?.user_id;

    if (!sessionUserId) {
      hasOpenedRef.current = false;
      sessionStorage.removeItem(PROMPTED_SESSION_KEY);
    }
  }, [isSessionLoading, session?.user?.custom_attributes?.user_id]);

  return null;
}
