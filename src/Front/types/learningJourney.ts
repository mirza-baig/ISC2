export interface SpecialAccommodation {
  id: string;
  name: string;
  status: string;
  expirationDate?: string | null;
  unrestrictedWhenPreApproved: boolean;
}

export interface LearningJourneyElement {
  productType: string;
  productInfo: {
    key: string;
    sku: string;
    name: string;
    description?: string | null;
    allocatedBy?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    dateTime?: string | null;
  };
  productStatus?: {
    href?: string | null;
    status: string;
    label: string;
    type: 'button' | 'pill';
  };
  specialAccommodations?: SpecialAccommodation[];
  error?: {
    code: string;
    message: string;
  };
}

export interface EnrollmentValidation {
  productKey: string;
  isBeforeEnrollment: boolean;
  formattedDate?: string;
}
