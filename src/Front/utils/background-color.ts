import twConfig from '../../tailwind.config';
import { DropLinkFieldType } from 'types/index';

export const formatBackgroundColorCssClassName = (
  backgroundThemeField?: DropLinkFieldType,
  defaultValue = 'bg-gray-10'
) => {
  const colorFieldValue = backgroundThemeField?.fields?.Value?.value as string;

  if (
    colorFieldValue &&
    (twConfig?.theme?.extend?.colors as Record<string, string>)[colorFieldValue]
  ) {
    return `bg-${colorFieldValue}`;
  }

  return defaultValue;
};
