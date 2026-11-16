import { useEffect, useMemo, useRef, type ReactNode } from 'react';

import {
  useAuthorizedBuyer,
  useLoggedUser,
  useRefreshShopperOrganizationCurrency,
  useSession,
} from 'hooks/index';
import { mapAccountsToShopperOrganizations } from 'lib/authorizedBuyer';
import { useModal, useShopperContext } from 'providers/index';
import { useFeatureFlag } from 'providers/featureFlags';
import { B2B_FEATURE_FLAG, SHOPPER_CONTEXT_PENDING_KEY } from 'constants/index';

import ShopperContextModalContent from './ShopperContextModalContent';

const signOutBuyer = () => {
  sessionStorage.removeItem(SHOPPER_CONTEXT_PENDING_KEY);
  window.location.assign('/api/auth/federated-sign-out');
};

export default function ShopperContextModal() {
  const { setModalContent, closeModal, modalContent } = useModal();
  const { shopperContext, isShopperContextReady, setShopperContext, setShopperPromptSettled } =
    useShopperContext();
  const { session, isSessionLoading } = useSession();
  const isSessionAuthorizedBuyer = Boolean(session?.user?.isAuthorizedBuyer);
  const { externalID } = useLoggedUser();
  const { isAuthorizedBuyer, isResolvingAuthorizedBuyer, authorizedBuyerAccounts } =
    useAuthorizedBuyer();
  const isB2BFlowEnabled = useFeatureFlag(B2B_FEATURE_FLAG);
  useRefreshShopperOrganizationCurrency();
  const shopperModalRef = useRef<ReactNode>(null);
  const hasOpenedModalRef = useRef(false);

  const organizations = useMemo(
    () => mapAccountsToShopperOrganizations(authorizedBuyerAccounts),
    [authorizedBuyerAccounts]
  );

  const isShopperModalOpen = Boolean(modalContent) && modalContent === shopperModalRef.current;

  useEffect(() => {
    if (isSessionLoading || !isShopperContextReady) {
      return;
    }

    if (!externalID || shopperContext) {
      sessionStorage.removeItem(SHOPPER_CONTEXT_PENDING_KEY);
      if (isShopperModalOpen) {
        shopperModalRef.current = null;
        closeModal();
      }
      // Logged out, or the shopper has a context (chosen, stored, or defaulted to myself).
      setShopperPromptSettled(true);
      return;
    }

    if (!isB2BFlowEnabled) {
      setShopperContext({ type: 'myself', organization: null });
      return;
    }

    if (isResolvingAuthorizedBuyer) {
      return;
    }

    if (!isAuthorizedBuyer && !isSessionAuthorizedBuyer) {
      // Not a B2B buyer: the prompt never opens, so nothing is left to wait for.
      setShopperPromptSettled(true);
      return;
    }

    if (organizations.length === 0) {
      setShopperContext({ type: 'myself', organization: null });
      return;
    }

    if (isShopperModalOpen) {
      return;
    }

    if (
      !hasOpenedModalRef.current &&
      sessionStorage.getItem(SHOPPER_CONTEXT_PENDING_KEY) === externalID
    ) {
      signOutBuyer();
      return;
    }

    const content = (
      <ShopperContextModalContent
        organizations={organizations}
        onConfirm={() => {
          shopperModalRef.current = null;
          closeModal();
        }}
        onCancel={signOutBuyer}
      />
    );

    hasOpenedModalRef.current = true;
    sessionStorage.setItem(SHOPPER_CONTEXT_PENDING_KEY, externalID);
    shopperModalRef.current = content;
    setModalContent(content, { dismissOnClickOutside: false });
  }, [
    isSessionLoading,
    externalID,
    isShopperContextReady,
    shopperContext,
    isB2BFlowEnabled,
    isResolvingAuthorizedBuyer,
    isAuthorizedBuyer,
    isSessionAuthorizedBuyer,
    organizations,
    isShopperModalOpen,
    closeModal,
    setModalContent,
    setShopperContext,
    setShopperPromptSettled,
  ]);

  return null;
}
