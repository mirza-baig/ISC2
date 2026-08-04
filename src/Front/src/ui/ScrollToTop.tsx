import { useCallback, useEffect, useState } from 'react';
import { goToTop } from 'utils/goToTop';
import { ArrowUpIcon } from 'icons/index';

const ScrollToTop = () => {
  const [showButton, setShowButton] = useState(false);

  const onScroll = useCallback(() => {
    const scrollY = window.pageYOffset;
    const height = window.innerHeight;

    setShowButton(scrollY >= height / 2);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', onScroll);

    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, [onScroll]);

  if (!showButton) {
    return null;
  }

  return (
    <button
      aria-label="Scroll to top"
      onClick={() => goToTop()}
      className="w-12 h-12 flex bg-dark-green items-center justify-center rounded-sm fixed bottom-5 right-5 sm:bottom-28 sm:right-28 text-white-00 rounded-lg z-scroll-to-top"
    >
      <ArrowUpIcon size={22} />
    </button>
  );
};

export default ScrollToTop;
