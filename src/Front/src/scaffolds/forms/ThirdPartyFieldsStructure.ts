import { FormElement, FormElementTypes, FormFields } from 'types/forms';

export const ThirdPartyFieldsStructure = [
  {
    name: FormFields.Description.key,
    type: FormElementTypes.description,
    hideForThirdParty: false,
  },
  {
    name: FormFields.Disclaimer.key,
    type: FormElementTypes.disclaimer,
    hideForThirdParty: false,
  },
] as FormElement[];
