import { useCallback, useEffect, useRef } from 'react';

import { useEscapeKey, useOnEventOutside } from 'hooks/index';
import { useModal } from 'providers/modal';
import { focusTrapHandler, getFocusedElementBeforePopup } from 'utils/modal';

const Modal = () => {
  // modal with focus trap
  const { modalContent, modalConfig, closeModal } = useModal();
  const modalRef = useRef<HTMLDivElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);
  const focusableElementsRef = useRef<HTMLElement[]>([]);

  const onModalClickOutside = useCallback(() => {
    if (modalConfig?.dismissOnClickOutside) {
      closeModal();
    }
  }, [closeModal, modalConfig?.dismissOnClickOutside]);

  useOnEventOutside(modalContentRef, ['mousedown', 'touchstart'], onModalClickOutside);
  useEscapeKey(onModalClickOutside);

  useEffect(() => {
    const focusedElementBeforePopup = getFocusedElementBeforePopup(
      modalContent,
      modalRef,
      focusableElementsRef
    );

    // Add event listener to trap focus
    const handleFocusTrap = (event: KeyboardEvent | Event) => {
      focusTrapHandler(event, focusableElementsRef);
    };

    document.addEventListener('keydown', handleFocusTrap as (event: Event) => void);

    return () => {
      document.removeEventListener('keydown', handleFocusTrap as (event: Event) => void);

      // Restore focus to the element that had it before the popup opened
      if (focusedElementBeforePopup) {
        focusedElementBeforePopup.focus();
      }
    };
  }, [modalContent]);

  return (
    <>
      {modalContent && (
        <div
          ref={modalRef}
          className="modal modal-overlay z-modal-overlay"
          aria-labelledby="modal-title"
          aria-describedby="modal-description"
          role="dialog"
          aria-modal="true"
        >
          <div className="z-modal-content w-full" ref={modalContentRef}>
            {modalContent}
          </div>
        </div>
      )}
    </>
  );
};

export default Modal;
