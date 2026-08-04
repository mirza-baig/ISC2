import { FormElement, FormElementTypes, FormFields } from 'types/forms';

export const CertificationExamScaffold = [
  {
    label: 'Certification Options',
    name: FormFields.Headline.key,
    type: FormElementTypes.headline,
  },
  {
    label: FormFields.PurchaseOptions.label,
    name: FormFields.PurchaseOptions.key,
    type: FormElementTypes.radio,
    isRequired: true,
    noAlgoliaConnection: true,
  },
  {
    label: '',
    name: FormFields.PriceSummary.key,
    type: FormElementTypes.priceSummary,
  },
  {
    label: FormFields.Button.label,
    name: FormFields.Button.key,
    type: FormElementTypes.button,
  },
  {
    label: '',
    name: FormFields.FormNotice.key,
    type: FormElementTypes.formNotice,
  },
] as FormElement[];
