import { useEffect } from 'react';

export default function useDisableScroll({ disable }: { disable: boolean }) {
  useEffect(() => {
    if (!document.body) {
      return;
    }

    document.body.style.overflow = disable ? 'hidden' : '';

    return () => {
      document.body.style.overflow = '';
    };
  }, [disable]);
}
