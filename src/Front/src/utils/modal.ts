import { MutableRefObject, ReactNode, RefObject } from 'react';

export const getFocusedElementBeforePopup = (
  refData: string | ReactNode | null,
  modalRef: RefObject<HTMLDivElement | null>,
  focusableElementsRef: MutableRefObject<HTMLElement[]>
) => {
  if (!refData || !modalRef?.current) {
    return;
  }

  // Save the focused element
  const focusedElementBeforePopup = document.activeElement as HTMLElement;

  // Find all focusable elements within the modal
  const focusableElements = modalRef.current.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  // Convert NodeList to an array
  focusableElementsRef.current = Array.from(focusableElements) as HTMLElement[];

  // Focus the first focusable element in the popup
  if (focusableElementsRef.current.length > 0) {
    focusableElementsRef.current[0].focus();
  }

  return focusedElementBeforePopup;
};

export const focusTrapHandler = (
  event: KeyboardEvent | Event,
  focusableElementsRef: MutableRefObject<HTMLElement[]>
) => {
  if (event instanceof KeyboardEvent && event.key === 'Tab') {
    const firstElement = focusableElementsRef.current[0];
    const lastElement = focusableElementsRef.current[focusableElementsRef.current.length - 1];

    if (document.activeElement === lastElement && !event.shiftKey) {
      firstElement.focus();
      event.preventDefault();
    } else if (document.activeElement === firstElement && event.shiftKey) {
      lastElement.focus();
      event.preventDefault();
    }
  }
};
