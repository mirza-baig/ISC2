import { useEffect, useCallback } from 'react';

type EventType = keyof GlobalEventHandlersEventMap;

const useOnEventOutside = (
  ref: React.RefObject<HTMLElement | null>,
  eventTypes: EventType[],
  callback: (event: Event) => void
) => {
  const handleOutside = useCallback(
    (event: Event) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback(event);
      }
    },
    [ref, callback]
  );

  useEffect(() => {
    eventTypes.forEach((eventType) => {
      document.addEventListener(eventType, handleOutside);
    });

    return () => {
      eventTypes.forEach((eventType) => {
        document.removeEventListener(eventType, handleOutside);
      });
    };
  }, [eventTypes, handleOutside]);

  return handleOutside;
};

export default useOnEventOutside;
