import { useCallback } from 'react';
import { useRouter } from 'next/router';

import { GenericModal } from 'ui/GenericModal';
import { useModal } from 'providers/modal';
import { SESSION_STORAGE_KEYS, SESSION_LOCALSTORAGE_KEYS } from 'constants/sessionTimeout';

export const LOG_OUT_CHANGE_BUYER_LABEL = 'Log Out/Change Buyer';

export interface ChangeBuyerModalProps {
  onSignOutStarted?: () => void;
}

const ChangeBuyerModal = ({ onSignOutStarted }: ChangeBuyerModalProps) => {
  const router = useRouter();
  const { closeModal } = useModal();

  const handleContinue = useCallback(() => {
    closeModal();

    if (onSignOutStarted) {
      onSignOutStarted();
    }

    sessionStorage.removeItem(SESSION_STORAGE_KEYS.SESSION_ACTIVE);
    localStorage.removeItem(SESSION_LOCALSTORAGE_KEYS.LAST_ACTIVITY);
    router.push('/api/auth/federated-sign-out');
  }, [closeModal, onSignOutStarted, router]);

  return (
    <GenericModal
      heading="Are you sure?"
      description="This will end your current session. You can log in again to start a new session and shop for yourself or another organization."
      primaryCtaLabel="Continue"
      onPrimaryCtaClick={handleContinue}
      secondaryCtaLabel="Cancel"
      onSecondaryCtaClick={closeModal}
    />
  );
};

export default ChangeBuyerModal;
