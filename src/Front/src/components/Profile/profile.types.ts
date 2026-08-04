export type ProfileSectionProps = {
  cancelText: string;
  saveChangesText: string;
  editMode: boolean;
  cancelEditMode: () => void;
};

export type EmploymentInformationLabels = {
  employmentInformationHeading: string;
  employmentInformationEditCtaLabel: string;
  employerNameLabel: string;
  employerNameTooltip: string;
  jobTitleLabel: string;
  workEmailLabel: string;
  workEmailTooltip: string;
  workPhoneLabel: string;
  governmentContractorSwitchLabel: string;
  governmentEmployerSwitchLabel: string;
};

export type ContactInformationLabels = {
  contactInformationHeading: string;
  contactInformationEditCtaLabel: string;
  firstNameLabel: string;
  lastNameLabel: string;
  howToEditNameNotice: string;
  countryLabel: string;
  countryTooltip: string;
  phoneLabel: string;
  prefixLabel: string;
  suffixLabel: string;
  nicknameLabel: string;
  pronounLabel: string;
};

export type AddressInformationLabels = {
  addressInformationHeading: string;
  addressInformationEditCtaLabel: string;
  mailingAddressText: string;
  billingAddressText: string;
  addressLabel: string;
  addressTooltip: string;
  countryLabel: string;
  countryTooltip: string;
  stateProvinceLabel: string;
  stateProvinceTooltip: string;
  cityLabel: string;
  cityTooltip: string;
  zipCodeLabel: string;
  zipCodeTooltip: string;
  billingAsMailingCheckboxLabel: string;
};
