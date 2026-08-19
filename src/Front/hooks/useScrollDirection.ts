import { useEffect, useRef, useState } from 'react';

type Direction = 'down' | 'up';

const THRESHOLD = 25;
const MAXOFFSETFROMTOP = 400;

export default function useScrollDirection() {
  const [scrollDirection, setScrollDirection] = useState<Direction>();
  const [isAtVeryTop, setIsAtVeryTop] = useState(true);

  const lastScrollY = useRef(0);

  useEffect(() => {
    lastScrollY.current = window.pageYOffset;

    const updateScrollDirection = () => {
      const scrollY = window.pageYOffset;
      const direction = scrollY > lastScrollY.current ? 'down' : 'up';
      const delta = Math.abs(scrollY - lastScrollY.current);

      if (direction !== scrollDirection && (delta > THRESHOLD || scrollY > MAXOFFSETFROMTOP)) {
        setScrollDirection(direction);
      }

      setIsAtVeryTop(scrollY < THRESHOLD);

      lastScrollY.current = scrollY > 0 ? scrollY : 0;
    };

    window.addEventListener('scroll', updateScrollDirection);

    return () => {
      window.removeEventListener('scroll', updateScrollDirection); // clean up
    };
  }, [scrollDirection]);

  return { scrollDirection, isAtVeryTop };
}
