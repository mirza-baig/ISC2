export const URL_PATH_PATTERN = /^[A-Za-z0-9\-._~%!$&'()*+,;=:@/]*$/;

export const isUrlPath = (value: string): boolean => URL_PATH_PATTERN.test(value);

export const stripQueryAndFragment = (value: string): string => value.split('#')[0].split('?')[0];

export const ITEM_NAME_PATTERN = /^[A-Za-z0-9\-._~%!$&'()*+,;=:@ ]+$/;

export const isItemName = (value: string): boolean =>
  ITEM_NAME_PATTERN.test(value) && value !== '.' && value !== '..';
