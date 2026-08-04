import { useMemo } from 'react';
import { BackgroundGradient } from 'types/index';

const useBackgroundGradient = (
  backgroundGradient?: BackgroundGradient,
  defaultGradientColor = 'bg-transparent'
) => {
  return useMemo(() => {
    const bgColor = backgroundGradient?.fields?.backgroundGradient?.value || '';
    if (bgColor) {
      return `bg-${bgColor}`;
    }
    return defaultGradientColor;
  }, [backgroundGradient, defaultGradientColor]);
};

export default useBackgroundGradient;
