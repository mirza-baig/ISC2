import { useCallback } from 'react';

import { Button } from 'ui/Button';
import { useModal } from 'providers/modal';
import { SESSION_STORAGE_KEYS, SESSION_LOCALSTORAGE_KEYS } from 'constants/sessionTimeout';

export const LOG_OUT_CHANGE_BUYER_LABEL = 'Log Out/Change Buyer';

const TITLE = 'Are you sure?';
const DESCRIPTION =
  'This will end your current session. You can log in again to start a new session and shop for yourself or another organization.';
const CANCEL_LABEL = 'Cancel';
const CONTINUE_LABEL = 'Continue';

export interface ChangeBuyerModalProps {
  onSignOutStarted?: () => void;
}

const ChangeBuyerModal = ({ onSignOutStarted }: ChangeBuyerModalProps) => {
  const { closeModal } = useModal();

  const handleContinue = useCallback(() => {
    if (onSignOutStarted) {
      onSignOutStarted();
    }

    sessionStorage.removeItem(SESSION_STORAGE_KEYS.SESSION_ACTIVE);
    localStorage.removeItem(SESSION_LOCALSTORAGE_KEYS.LAST_ACTIVITY);

    // Full navigation so the Salesforce IdP redirect is followed (router.push soft-navigates).
    window.location.assign('/api/auth/federated-sign-out');
  }, [onSignOutStarted]);

  return (
    <div className="flex flex-col justify-center items-center mx-5">
      <div className="bg-white-00 rounded-lg sm:max-w-md h-min mt-8 max-h-[80dvh] overflow-y-auto">
        <div className="p-7 md:p-10 body-m text-black-100 text-xsm space-y-4 leading-23">
          <h4 className="headline-s font-normal">{TITLE}</h4>
          <p className="body-l">{DESCRIPTION}</p>

          {/* Match Choose Buyer: Cancel (text) then primary CTA, gap-x-6; left-aligned per QA */}
          <div className="flex justify-start items-center gap-x-6 !mt-8">
            <button
              type="button"
              aria-label={CANCEL_LABEL}
              className="body-m text-sm text-black-100 hover:underline"
              onClick={closeModal}
            >
              {CANCEL_LABEL}
            </button>
            <Button
              type="button"
              variant="primary"
              label={CONTINUE_LABEL}
              className="!self-auto"
              onClick={handleContinue}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangeBuyerModal;
