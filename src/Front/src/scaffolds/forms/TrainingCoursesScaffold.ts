import { FormElement, FormElementTypes, FormFields } from 'types/forms';

export const TrainingCoursesScaffold = [
  {
    label: 'Course Options',
    name: FormFields.Headline.key,
    type: FormElementTypes.headline,
  },
  {
    label: FormFields.BundleOptions?.label,
    name: FormFields.BundleOptions.key,
    type: FormElementTypes.radio,
    isRequired: true,
    isRequiredLabelHidden: true,
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
] as FormElement[];
