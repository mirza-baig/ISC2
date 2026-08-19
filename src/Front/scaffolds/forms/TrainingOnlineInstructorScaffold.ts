import { FormElement, FormElementTypes, FormFields } from 'types/forms';
// This could be restored in the next project iteration
// import { ThirdPartyFieldsStructure } from './ThirdPartyFieldsStructure';

export const TrainingOnlineInstructorScaffold = [
  {
    label: 'Training Options',
    name: FormFields.Headline.key,
    type: FormElementTypes.headline,
  },
  {
    label: FormFields.Region.label,
    name: FormFields.Region.key,
    type: FormElementTypes.select,
    isRequired: true,
    isConfigurationOption: true,
  },
  // This could be resored in the next project iteration
  // {
  //   label: FormFields.TrainingProvider.label,
  //   name: FormFields.TrainingProvider.key,
  //   type: FormElementTypes.select,
  //   isRequired: true,
  //   isConfigurationOption: true,
  // },
  {
    label: FormFields.TrainingDuration.label,
    name: FormFields.TrainingDuration.key,
    type: FormElementTypes.radio,
    isConditionallyRequired: true,
    // hideForThirdParty: true,
    isConfigurationOption: true,
  },
  {
    label: FormFields.StartDate.label,
    name: FormFields.StartDate.key,
    type: FormElementTypes.schedule,
    isRequired: true,
    // hideForThirdParty: true,
  },
  {
    label: FormFields.EndDate.label,
    name: FormFields.EndDate.key,
    type: FormElementTypes.schedule,
    isRequired: true,
    // hideForThirdParty: true,
  },
  {
    label: FormFields.PurchaseOptions.label,
    name: FormFields.PurchaseOptions.key,
    type: FormElementTypes.radio,
    isRequired: true,
    isTrainingOnlyMode: true,
    noAlgoliaConnection: true,
    alwaysShowPrice: true,
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
