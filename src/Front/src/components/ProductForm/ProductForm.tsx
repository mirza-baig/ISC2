import {
  TextField,
  ComponentRendering,
  Field,
  RichTextField,
  LinkField,
} from '@sitecore-jss/sitecore-jss-nextjs';

import { DropLinkFieldType } from 'types/index';
import { ProductFormProvider } from 'providers/index';
import { ProductFormModalLabelsType } from 'utils/index';
import ProductFormContent from './ProductFormContent';

export type ProductScheduledModalLabels = {
  heading: TextField;
  redirectLink: LinkField;
  errorHeading: TextField;
  unsuccessDescription: TextField;
  isExpiredLabel: TextField;
  isCancelledLabel: TextField;
  isAllocatedLabel: TextField;
};

export type FormLabelsAndTooltips = {
  fields: {
    currencyChangeModal: ProductFormModalLabelsType;
    peaceOfMindTermsModal?: ProductFormModalLabelsType;
    thirdPartyModal: ProductFormModalLabelsType;
    productOptionsScheduledModal: {
      fields: ProductScheduledModalLabels;
    };
    formNotice?: RichTextField;
    toolTips: TextField;
    labels: TextField;
    messages: TextField;
    headline: TextField;
    primaryCtaLabel: TextField;
  };
};

export interface ProductFormPropsFields {
  formType: DropLinkFieldType;
  formLabelsAndTooltips: FormLabelsAndTooltips;
  sku: Field<string>;
  productKey: Field<string>;
  headline: Field<string>;
}

interface ProductFormProps {
  fields: ProductFormPropsFields;
  rendering: ComponentRendering;
}

const ProductForm = ({ fields, rendering }: ProductFormProps) => {
  return (
    <ProductFormProvider rendering={rendering}>
      <ProductFormContent fields={fields} />
    </ProductFormProvider>
  );
};

export default ProductForm;
