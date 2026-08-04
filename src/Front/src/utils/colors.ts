import resolveConfig from 'tailwindcss/resolveConfig';
import colors from 'tailwindcss/colors';
import tailwindConfig from 'tailwind.config.js';

import { DropLinkFieldType } from 'types/index';

type ColorMap = { [key: string]: string };

const fullConfig = resolveConfig(tailwindConfig);
const tailwindColorMap = fullConfig?.theme?.colors || {};
type ColorKey = keyof typeof tailwindColorMap;
export const customColors: ColorMap = Object.keys(tailwindColorMap || {})
  .filter((key: string) => !(key in colors))
  .reduce((acc: ColorMap, curr: string) => {
    acc[curr] = tailwindColorMap[curr as ColorKey] as string;
    return acc;
  }, {});

export const mapHexColorToTailwindClass = (
  hex: string,
  colorMap: ColorMap = customColors as ColorMap
): string => {
  const mapKeys = Object.keys(colorMap);

  for (let i = 0; i < mapKeys.length; i++) {
    const key = mapKeys[i];
    if (typeof colorMap[key] === 'string' && colorMap[key]?.toUpperCase() === hex?.toUpperCase()) {
      return key;
    }
  }

  return '';
};

export const getTailwindColorClass = (hex: string, prop: 'bg' | 'text') => {
  const colorClass = mapHexColorToTailwindClass(hex);

  if (colorClass) {
    return `${prop}-${colorClass}`;
  }

  return '';
};

export const getContrastTextColor = (backgroundThemeField?: DropLinkFieldType) => {
  const colorFieldValue = backgroundThemeField?.fields?.Value?.value as string;

  if (['dark-blue', 'dark-green', 'gray-90'].includes(colorFieldValue?.toLowerCase())) {
    return 'text-white-00';
  }

  return 'text-black-100';
};
