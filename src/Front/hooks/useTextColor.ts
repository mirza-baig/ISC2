import { useMemo } from 'react';
import { mapHexColorToTailwindClass } from 'utils/index';
import { BackgroundGradient } from 'types/index';

const useTextColor = (
  backgroundGradient?: BackgroundGradient,
  defaultTextColor = 'text-black-100'
) => {
  return useMemo(() => {
    const foregroundColor = backgroundGradient?.fields?.contentHexColor?.value || '';
    const textClass = mapHexColorToTailwindClass(foregroundColor);

    if (foregroundColor && textClass) {
      return `text-${textClass}`;
    }

    return defaultTextColor;
  }, [backgroundGradient?.fields?.contentHexColor?.value, defaultTextColor]);
};

export default useTextColor;
