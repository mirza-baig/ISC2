import { ProductPrice, TypedMoney } from './pricing';

export enum ProductTypes {
  bundle = 'product-bundle',
}

export enum FormTypes {
  TrainingOnlineInstructor = 'training-online-instructor',
  TrainingOnlineSelfPaced = 'training-online-self-paced',
  TrainingClassroomBased = 'training-classroom-based',
  CertificationExam = 'certification',
  Courses = 'courses',
  Certificate = 'certificate',
  SkillBuilder = 'skill-builder',
}

export enum FormElementTypes {
  headline = 'headline',
  select = 'select',
  radio = 'radio',
  checkbox = 'checkbox',
  schedule = 'schedule',
  description = 'description',
  disclaimer = 'disclaimer',
  formNotice = 'form-notice',
  priceSummary = 'price-summary',
  button = 'button',
}

// Labels are managed in Sitecore, declare default fallback values here
export const FormFields: { [key: string]: { key: string; label?: string } } = {
  Headline: { key: 'headline' },
  Region: { label: 'Region', key: 'region.key' },
  Country: { label: 'Country', key: 'country' },
  City: { label: 'City', key: 'city' },
  State: { label: 'State', key: 'state' },
  TrainingProvider: { label: 'Training Provider', key: 'trainingProvider.key' },
  TrainingDuration: { label: 'Training Duration', key: 'duration.key' },
  StartDate: { label: 'Start Date', key: 'startDate' },
  EndDate: { label: 'End Date', key: 'endDate' },
  PurchaseOptions: { label: 'Purchase Option', key: 'purchase-options' },
  BundleOptions: { key: 'bundle-options' },
  Disclaimer: { key: 'purchaseOptionTitle' },
  Description: { key: 'description' },
  Modal: { key: 'modal' },
  PriceSummary: { key: 'price-summary' },
  Button: { label: 'Buy now', key: 'buyNowCta' },
  ThirdPartyCta: { key: 'thirdPartyCta' },
  FormNotice: { key: 'form-notice' },
};

export const FormAdditionalData = {
  SingleProductSelection: { key: 'singleProductSelection' },
  NarrowResultsByFilters: { key: 'narrowResultsByFilters' },
  DisclaimerNotice: { key: 'purchaseOptionNotice' },
  SmallQtyWarning: { key: 'smallQtyWarning' },
  NoQtyWarning: { key: 'noQtyWarning' },
  NoDatesForSelectedOptions: { key: 'noDatesForSelectedOptions' },
  ChooseAnotherTimeline: { key: 'chooseAnotherTimeline' },
  SelectDates: { key: 'selectDates' },
  ConfirmDateSelection: { key: 'confirmDateSelection' },
  ClassesDetails: { key: 'classesDetails' },
  NoOptions: { key: 'noOptions' },
  ChangeSchedule: { key: 'changeSchedule' },
  SelectProducts: { key: 'selectProducts' },
  ProductFetchError: { key: 'productFetchError' },
  ConfirmOptionsCta: { key: 'confirmOptionsCta' },
};

export const INNER_PROVIDER_KEY = 'isc2';
export const PRODUCT_ONLY_KEY = 'product-value';
export const CALENDAR_TERM_START = {
  SHORT: 0,
  MEDIUM: 5,
  LONG: 7,
};

export const CALENDAR_TABS = [
  {
    key: CALENDAR_TERM_START.SHORT,
    label: `Next ${CALENDAR_TERM_START.MEDIUM - 1} months`,
    end: CALENDAR_TERM_START.MEDIUM - 1,
  },
  {
    key: CALENDAR_TERM_START.MEDIUM,
    label: `${CALENDAR_TERM_START.MEDIUM}-${CALENDAR_TERM_START.LONG - 1} months`,
    start: CALENDAR_TERM_START.MEDIUM - 1,
    end: CALENDAR_TERM_START.LONG - 1,
  },
  {
    key: CALENDAR_TERM_START.LONG,
    label: `${CALENDAR_TERM_START.LONG}+ months`,
    start: CALENDAR_TERM_START.LONG - 1,
  },
];

export type FormOption = {
  label: string;
  value: string;
  price?: ProductPrice;
  addOn?: FormOption[];
  disabled?: boolean;
  productMessage?: string;
};

type OptionalProps =
  | {
      type:
        | FormElementTypes.headline
        | FormElementTypes.select
        | FormElementTypes.radio
        | FormElementTypes.description
        | FormElementTypes.formNotice
        | FormElementTypes.disclaimer
        | FormElementTypes.priceSummary
        | FormElementTypes.button;
      values?: FormOption[];
    }
  | { type: FormElementTypes.schedule; values: ProductDateGroup[] };

export type FormElement = OptionalProps & {
  label: string;
  name: string;
  isRequired?: boolean;
  isConditionallyRequired?: boolean;
  tooltip?: string;
  hideForThirdParty?: boolean;
  href?: string;
  additionalClasses?: string;
  values?: ProductDateGroup[] | FormOption[];
  noAlgoliaConnection?: boolean;
  isRequiredLabelHidden?: boolean;
  isConfigurationOption?: boolean;
  isTrainingOnlyMode?: boolean;
  alwaysShowPrice?: boolean;
};

export type FormElementOptionPricing = {
  [key: string]: FormOption[];
};

export interface ProductDate {
  text?: string;
  isoStart?: Date;
  isoEnd?: Date;
  sku: string;
  weekScheduleText: string;
}

export interface ProductDateGroup {
  key: number;
  text?: string;
  dates: ProductDate[];
}

export type ProductOptionData = {
  value: string | boolean | Date | null;
  price?: ProductPrice;
  noAlgoliaConnection?: boolean;
};

export type ProductOptionValue = {
  data: ProductOptionData;
  options?: {
    [key: string]: ProductOptionData;
  };
};

export type ProductOptions = {
  [key: string]: ProductOptionValue;
};

export type ProductHitKeyValuePair = {
  key: string;
  label: string;
};

export type ProductIsoDates = {
  isoStart?: Date;
  isoEnd?: Date;
};

export type ProductItemRef = {
  name: string;
  value: { id: string; typeId: string } | number;
};

export interface ProductHit {
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  timeZone?: string;
  timeZoneIana?: { key: string; label?: string };
  isoStart?: Date;
  isoEnd?: Date;
  daysOfWeek: string;
  productID?: string;
  sku: string;
  duration?: ProductHitKeyValuePair | undefined;
  trainingProvider?: ProductHitKeyValuePair | undefined;
  title: string;
  parentTitle: string;
  copyName?: string;
  modality?: ProductHitKeyValuePair | undefined;
  division?: ProductHitKeyValuePair | undefined;
  focusArea?: ProductHitKeyValuePair | undefined;
  proficiencyArea?: ProductHitKeyValuePair | undefined;
  description?: string;
  itemsRef?: [ProductItemRef][];
  itemVariantSkuList?: string[];
  isMasterVariant?: boolean;
  link?: string[];
  productMessage?: string;
  productType?: string;
  productTypeLabel?: string;
  skuReferencesVariant?: string[];
  skuReferencesProduct?: string[];
  itemProductKeyList?: string[];
  productKey: string;
  expand?: boolean;
}

export type AlgoliaApiResponse = {
  facets?: {
    [facetKey: string]: {
      [label: string]: number;
    };
  };
  hits: ProductHit[];
};

export type ProductFormFacetData = {
  [name: string]: {
    label: string;
    value: string;
  }[];
};

export type ProductFormSearchResult = {
  results: ProductHit[];
  currentFacetOptions: ProductFormFacetData;
};

export const BUNDLE_TYPES = {
  PRODUCT: 'productBundles',
  VARIANT: 'variantBundles',
};

export type BundleOption = ProductHit & {
  disabled?: boolean;
  price?: TypedMoney;
};

export type BundleOptions = {
  productBundles?: BundleOption[];
  variantBundles?: BundleOption[];
};

export type BundleProductKeyItemSkuMap = {
  [productKey: string]: string[];
};
