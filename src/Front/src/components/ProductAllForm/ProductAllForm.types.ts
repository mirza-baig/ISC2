import { TextField, RichTextField, Field } from '@sitecore-jss/sitecore-jss-nextjs';

// Template GUIDs for certification types (for reference)
export const TEMPLATE_GUIDS = {
  PRODUCT_FORM_PAGE: '{E007705A-251B-4395-9742-B98ACD4D5E5C}', // Regular product with ProductForm
  NON_PRODUCT_FORM_PAGE: '{4AEF5871-4199-459B-8982-EBDA0FC09928}', // Non-product (CC exam, etc.)
} as const;

// Helper to determine if certification is a NonProductFormPage
// Uses formLabelsAndTooltips presence as indicator since templateId isn't populated in multilist
export const isNonProductPage = (cert: CertificationItemFromMultilist): boolean => {
  // If templateId is available, use it (preferred method)
  if (cert.templateId) {
    const templateId = cert.templateId.toUpperCase();
    const nonProductGuid = TEMPLATE_GUIDS.NON_PRODUCT_FORM_PAGE.toUpperCase();
    return templateId === nonProductGuid;
  }

  // Fallback: NonProductFormPage items don't have formLabelsAndTooltips
  // If this field is missing, it's a NonProductFormPage
  return !cert.fields?.formLabelsAndTooltips;
};

export interface ProductAllFormFields {
  productListSelectorPlaceholder: TextField;
  noSelectionMessage: RichTextField;
  loadingMessage: TextField;
  errorMessage: RichTextField;
  formHeadlineText: TextField; // Text for "Purchase Exam" headline above dropdown
  productList: Field<CertificationItemFromMultilist[]>;
  formLabelsAndTooltips: {
    targetItem: {
      id: string;
      fields: {
        results: Array<{
          name: string;
          jsonValue: unknown;
        }>;
      };
    };
  };
}

// Certification item as returned from Sitecore multilist (has full fields)
export interface CertificationItemFromMultilist {
  id: string;
  url: string;
  name: string;
  displayName?: string;
  templateId?: string; // Add template ID to check type
  fields?: {
    allProductDropDownTitle?: { value: string };
    sku?: { value: string };
    productKey?: { value: string };
    headline?: { value: string };
    formType?: { value: string } | { targetItem?: { value?: { value: string } } };
    formLabelsAndTooltips?: { targetItem?: { id: string; name: string } };
    primaryCTA?: { value?: { href?: string; text?: string; target?: string } };
    // Price/label fields from individual cert pages
    regularPriceText?: { value: string };
    memberPriceText?: { value: string };
    candidatePriceText?: { value: string };
    associatePriceText?: { value: string };
    isForFreeText?: { value: string };
    discountText?: { value: string };
    loginBtnText?: { value: string };
    [key: string]: unknown;
  };
}
