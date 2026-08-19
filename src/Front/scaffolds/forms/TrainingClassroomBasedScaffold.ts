import { FormElement, FormElementTypes, FormFields } from 'types/forms';
// This could be restored in the next project iteration
// import { ThirdPartyFieldsStructure } from './ThirdPartyFieldsStructure';

export const TrainingClassroomBasedScaffold = [
  {
    label: 'Training Options',
    name: FormFields.Headline.key,
    type: FormElementTypes.headline,
  },
  {
    label: FormFields.Region.label,
    name: FormFields.Region.key,
    type: FormElementTypes.select,
    isConfigurationOption: true,
    isRequired: true,
  },
  {
    label: FormFields.Country.label,
    name: FormFields.Country.key,
    type: FormElementTypes.select,
    isConfigurationOption: true,
    isConditionallyRequired: true,
  },
  {
    label: FormFields.State.label,
    name: FormFields.State.key,
    type: FormElementTypes.select,
    isConfigurationOption: true,
    isConditionallyRequired: true,
    additionalClasses: 'flex-1 w-1/2 pdp-half-field',
  },
  {
    label: FormFields.City.label,
    name: FormFields.City.key,
    type: FormElementTypes.select,
    isConditionallyRequired: true,
    isConfigurationOption: true,
    additionalClasses: 'flex-1 w-1/2 pdp-half-field',
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
    isTrainingOnlyMode: true, // temporal solution till we get demands on the way to implement bundles and purchase options for other than exam forms
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
