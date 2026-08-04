import clsx from 'clsx';
import { useCallback, useRef, useState } from 'react';

import { CloseIcon, DangerIcon, TickFilledIcon } from 'icons/index';
import { FlashAlert as TFlashAlert } from 'types/index';

const BG_COLORS = {
  success: 'bg-isc2-green',
  error: 'bg-red-warning',
};

const TEXT_COLORS = {
  success: 'text-white',
  error: 'text-white',
};

const ICONS = {
  success: <TickFilledIcon size={14} className="mr-2" />,
  error: <DangerIcon size={14} className="mr-2 " />,
};

export namespace FlashAlert {
  export type Props = {
    flashAlert: TFlashAlert;
    closeAlert: () => void;
    dismissAlert: () => void;
  };
}

export const FlashAlert = ({ flashAlert, dismissAlert, closeAlert }: FlashAlert.Props) => {
  const [isDismissed, setIsDismissed] = useState(false);

  const dismissFlashAlert = useCallback(() => setIsDismissed(true), []);

  const timerRef = useRef(setTimeout(dismissFlashAlert, 3000));

  const onTransitionEnd = useCallback(() => {
    dismissAlert();
    clearTimeout(timerRef.current);
  }, [dismissAlert]);

  return (
    <div
      className={clsx(
        'flex items-center rounded-sm p-5 duration-1000 transition-all',
        BG_COLORS[flashAlert.type],
        TEXT_COLORS[flashAlert.type],
        isDismissed && '-translate-y-600 opacity-0'
      )}
      onTransitionEnd={onTransitionEnd}
    >
      {ICONS[flashAlert.type]}
      <label className="body-s">{flashAlert.label}</label>
      {flashAlert.closable && (
        <button onClick={closeAlert} className="ml-25" aria-label="Close">
          <CloseIcon size={18} />
        </button>
      )}
    </div>
  );
};
