import { NONE_SELECTED, PREFIX_OPTIONS, PRONOUNS_OPTIONS, SUFFIX_OPTIONS } from 'constants/account';

export const getContactInformationFieldsDropdownOptions = (
  fieldName: string
): { name: string; value: string }[] => {
  switch (fieldName) {
    case 'prefix':
      return [
        NONE_SELECTED,
        ...PREFIX_OPTIONS.map((option) => ({
          name: option,
          value: option,
        })),
      ];
    case 'suffix':
      return [
        NONE_SELECTED,
        ...SUFFIX_OPTIONS.map((option) => ({
          name: option,
          value: option,
        })),
      ];
    case 'pronouns':
      return [
        NONE_SELECTED,
        ...PRONOUNS_OPTIONS.map((option) => ({
          name: option,
          value: option,
        })),
      ];
    default:
      return [];
  }
};
