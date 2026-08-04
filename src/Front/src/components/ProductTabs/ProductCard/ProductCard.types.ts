import { Field, ImageField, LinkField, TextField } from '@sitecore-jss/sitecore-jss-nextjs';

export interface ProductCardFields {
  displayName: string;
  name: string;
  id: string;
  url: string;
  fields: {
    badgeLogoImage: ImageField;
    headline: TextField;
    logoImage: ImageField;
    description: TextField;
    headlinePill: TextField;
    productKey: TextField;
    productTitle1: TextField;
    productValue1: TextField;
    productAttribute1ToolTipText: TextField;
    productTitle2: TextField;
    productValue2: TextField;
    productAttribute2ToolTipText: TextField;
    productTitle3: TextField;
    productValue3: TextField;
    productAttribute3ToolTipText: TextField;
    productExternalUrl: LinkField;
    regularPriceText: TextField;
    candidatePriceText: TextField;
    memberPriceText: TextField;
    associatePriceText: TextField;
    discountText: TextField;
    cta: LinkField;
    sku: TextField;
    isForFreeText: Field<string>;
    loginBtnText: Field<string>;
    promoPills: Field<string>;
    formType?: {
      displayName: string;
      fields: {
        Value: TextField;
      };
      id: string;
      name: string;
      url: string;
    };
  };
}
