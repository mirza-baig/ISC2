import { useEffect } from 'react';

const useEscapeKeyToExit = (callback: () => void) => {
  useEffect(() => {
    const close = (evt: KeyboardEvent) => {
      if (evt.key === 'Escape') {
        callback();
      }
    };

    window.addEventListener('keydown', close);

    return () => {
      window.removeEventListener('keydown', close);
    };
  }, [callback]);
};

export default useEscapeKeyToExit;
