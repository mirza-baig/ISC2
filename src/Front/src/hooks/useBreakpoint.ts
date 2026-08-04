import { useState, useEffect } from 'react';

const breakpoints = {
  'max-sm': 767,
  sm: 768,
  md: 1024,
  lg: 1200,
  xl: 1440,
};

const useBreakpoint = () => {
  const [breakpoint, setBreakpoint] = useState('');

  const handleResize = () => {
    const width = window.innerWidth > 0 ? window.innerWidth : screen.width;
    const currentBreakpoint = (Object.keys(breakpoints) as Array<keyof typeof breakpoints>)
      .reverse()
      .find((key) => width >= breakpoints[key]);
    setBreakpoint(currentBreakpoint || 'max-sm');
  };

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return breakpoint;
};

export default useBreakpoint;
