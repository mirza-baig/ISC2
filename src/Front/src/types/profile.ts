import { z } from 'zod';

import { AddressSchema } from './users';
import { PRODUCT_REDEEM_MODAL_ERRORS, PRODUCT_REDEEM_MODAL_STATUS } from 'constants/index';

export const ContactInformationSchema = z.object({
  prefix: z.string().trim().max(80).optional(),
  suffix: z.string().trim().max(80).optional(),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  nickname: z.string().trim().max(80).optional(),
  pronouns: z.string().trim().max(80).optional(),
  phoneNumber: z.string().trim().min(1).max(40),
});

export type ContactInformation = z.infer<typeof ContactInformationSchema>;

export const EmploymentInformationSchema = z.object({
  employer: z.string().trim().max(75).optional(),
  jobTitle: z.string().trim().max(255).optional(),
  workEmail: z.string().trim().min(1).max(255).email('email'),
  workPhone: z.string().trim().max(40).optional(),
  isGovernmentContractor: z.boolean(),
  isGovernmentEmployee: z.boolean(),
});

export type EmploymentInformation = z.infer<typeof EmploymentInformationSchema>;

export const AddressInformationSchema = z.object({
  mailingAddress: AddressSchema,
  billingAddress: AddressSchema.optional(),
  isSameAddress: z.boolean(),
});

export type AddressInformation = z.infer<typeof AddressInformationSchema>;

export type ProfileFormSections = EmploymentInformation | ContactInformation | AddressInformation;

export type CPECreditsLabels = {
  heading: string;
  tasksCompletedLabel: string;
  certificationStatusLabel: string;
  cpesCompletedLabel: string;
  percentageCompletedLabel: string;
};

export type CPECredit = {
  badgeTypeName: string;
  certName: string;
  creditsApplied: number;
  creditsNeeded: number;
  endDate: string | null;
  image: string;
  percentComplete: number;
  startDate: string | null;
};

export type AllocationsLabels = {
  title: string;
  orderLabel: string;
  dateLabel: string;
  allocationNumberLabel: string;
  allocatedLabel: string;
  expiredFlagLabel: string;
  completeAllocationBeforeLabel: string;
  allocatedProductsExpiryMessage: string;
  noAllocationsLabel: string;
  allocationConsentCheckboxLabel: string;
  consentTermsAndConditionsLinkLabel: string;
  filterByLabel: string;
  productNameFilterLabel: string;
  orderNumberFilterLabel: string;
  createDateFilterLabel: string;
  expirationDateFilterLabel: string;
  fromDateLabel: string;
  toDateLabel: string;
  clearFiltersLabel: string;
  noResultsLabel: string;
  invalidDateErrorLabel: string;
};

export type AllocationDetailsLabels = AllocationsLabels & {
  addUsersCtaLabel: string;
  addUsersModalAddCtaLabel: string;
  addUsersModalCancelCtaLabel: string;
  addUsersModalFirstNameLabel: string;
  addUsersModalLastNameLabel: string;
  addUsersModalRequiredLabel: string;
  addUsersModalSelectForAllocationLabel: string;
  addUsersModalTitle: string;
  addUsersModalWorkEmailLabel: string;
  allocatedFilterLabel: string;
  cancelUploadCtaLabel: string;
  confirmSelectedCtaLabel: string;
  existingUsersOptionLabel: string;
  invitationSentStatusLabel: string;
  redeemedByUserStatusLabel: string;
  remainingFilterLabel: string;
  removeUserCtaAltText: string;
  searchUsersByEmailPlaceholder: string;
  selectAllOptionLabel: string;
  uploadCsvFileCtaLabel: string;
  uploadProcessingStatusLabel: string;
  usersFromFileOptionLabel: string;
  userAcceptedInvitationLabel: string;
  cancelCtaLabel: string;
  reallocateCtaLabel?: string;
  reallocatePopupTitle?: string;
};

export type AllocationDetailsMessages = {
  userNotAssociatedMessage: string;
  expiredWindowMessage: string;
  emailInstructionsSentMessage: string;
  maximumNumberOfUsersMessage: string;
  multipleUsersSuccessfulyAllocatedMessage: string;
  multipleUsersSuccessfulyRemovedMessage: string;
  singleUserSuccessfulyAllocatedMessage: string;
  singleUserSuccessfulyRemovedMessage: string;
  userAlreadyAllocatedMessage: string;
  userNotEligibleMessage: string;
  addUsersModalInvalidEmailErrorMessage: string;
  addUsersModalRequiredErrorMessage: string;
  emptyListMessage: string;
  multipleUsersSuccessfulyCreatedMessage: string;
  singleUserSuccessfulyCreatedMessage: string;
  failedToAllocateSingleUserMessage: string;
  failedToAllocateMultipleUsersMessage: string;
  failedToCreateSingleUserMessage: string;
  failedToCreateMultipleUsersMessage: string;
  failedToRemoveSingleUserMessage: string;
  singleUserAlreadyExistsMessage: string;
  invalidImportFileFormatMessage: string;
  reallocatePopopDescription?: string;
};

export type AllocationUser = {
  firstName: string;
  lastName: string;
  email: string;
  isAllocated?: boolean;
  isAccepted?: boolean;
  isAvailableToAllocate?: boolean;
  isCancelled?: boolean;
  isExpired?: boolean;
  isFailedToAllocate?: boolean;
  isRedeemed?: boolean;
  emailAlreadyAllocated?: boolean;
  progressStatus?: string | null;
};

export type AllocationSummary = {
  allocated: number;
  available: number;
  expired: number;
  cancelled: number;
  failedToAllocate: number;
  accepted: number;
  redeemed: number;
  total: number;
};

export type Allocation = {
  id: string;
  expired?: boolean;
  name: string;
  completeBefore: string;
  trainingProvider?: string;
  trainingMode?: string;
  trainingDate?: string;
  orderNumber?: string;
  allocationSummary: AllocationSummary;
  date: string;
  expirationDate: string;
  users: AllocationUser[];
  key: string;
  sku: string;
};

export type SalesforceAllocationDetailsGetApi = {
  orderStartDate: string;
  expirationDate: string;
  isOrderExpired: boolean;
  trainingMode: string;
  trainingDate: string;
  productType: string;
  productInfo: {
    code: string;
    key: string;
    sku: string;
    name: string;
    flowType: PRODUCT_REDEEM_MODAL_STATUS;
    '3rdPartyPlatform': string;
  };
  allocationSummary: AllocationSummary;
  users?: AllocationUser[];
  message?: PRODUCT_REDEEM_MODAL_ERRORS;
};

export type SalesforceAllocationsGetApi = {
  [orderNumber: string]: {
    [productCode: string]: SalesforceAllocationDetailsGetApi;
  }[];
};

export type AllocationDeleteResponse = {
  allocationSummary: AllocationSummary;
  deletedMemberInfo: AllocationUser;
  message: string | null;
  success: boolean;
};

export type AllocationAddResponse = {
  allocationSummary: AllocationSummary;
  allocatedUsers: {
    memberInfo: AllocationUser;
    message: string | null;
    success: boolean;
  }[];
  success?: boolean;
  message?: string;
};

export type AllocationCreateResponse = {
  users: AllocationUser[];
  success?: boolean;
  message?: string;
};
