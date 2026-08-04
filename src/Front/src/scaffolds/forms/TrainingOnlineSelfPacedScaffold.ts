import { FormElement, FormElementTypes, FormFields } from 'types/forms';
// This could be restored in the next project iteration
// import { ThirdPartyFieldsStructure } from './ThirdPartyFieldsStructure';

export const TrainingOnlineSelfPacedScaffold = [
  {
    label: 'Training Options',
    name: FormFields.Headline.key,
    type: FormElementTypes.headline,
  },
  // This could be restored in the next project iteration
  // {
  //   label: FormFields.TrainingProvider.label,
  //   name: FormFields.TrainingProvider.key,
  //   type: FormElementTypes.select,
  //   isConfigurationOption: true,
  //   isRequired: true,
  // },
  {
    label: FormFields.TrainingDuration.label,
    name: FormFields.TrainingDuration.key,
    type: FormElementTypes.radio,
    isConditionallyRequired: true,
    isConfigurationOption: true,
    // hideForThirdParty: true,
  },
  {
    label: FormFields.PurchaseOptions.label,
    name: FormFields.PurchaseOptions.key,
    type: FormElementTypes.radio,
    isRequired: true,
    // hideForThirdParty: true,
    noAlgoliaConnection: true,
  },
  // This could be restored in the next project iteration
  // ...ThirdPartyFieldsStructure,
  {
    label: '',
    name: FormFields.PriceSummary.key,
    type: FormElementTypes.priceSummary,
    // hideForThirdParty: true,
  },
  {
    label: FormFields.Button.label,
    name: FormFields.Button.key,
    type: FormElementTypes.button,
  },
] as FormElement[];
