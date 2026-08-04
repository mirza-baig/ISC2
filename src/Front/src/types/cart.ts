import { Field, TextField, ImageField, RichTextField } from '@sitecore-jss/sitecore-jss-nextjs';

export type OptionalDonationPopupNoticeFields = {
  fields: {
    heading: Field<string>;
    description: RichTextField;
  };
};

export type CartWarningPopupNoticeFields = {
  fields: {
    heading: Field<string>;
    description: RichTextField;
    primaryCtaLabel: Field<string>;
  };
};

type CartModalFields = {
  fields: {
    heading: Field<string>;
    description: Field<string>;
    primaryCtaLabel: Field<string>;
    secondaryCtaLabel: Field<string>;
  };
};

export type CartFields = {
  title: TextField;
  shoppingCartIcon: ImageField;
  emptyCartSubtitle: TextField;
  labelsNoticesAndTooltips: Field<string>;
  normalCartSubtitle: Field<string>;
  optionalDonationProductKey: Field<string>;
  optionalDonationPopupNotice: OptionalDonationPopupNoticeFields;
  cartWarningPopupNotice: CartWarningPopupNoticeFields;
  cartStatusAvailablePopupNotice: CartModalFields;
  cartStatusUnavailablePopupNotice: CartModalFields;
  errorLabels: Field<string>;
  tryAgainList: RichTextField;
  alertIcon: ImageField;
};

export type CartLabels = {
  yourPriceLabel: string;
  quantityLabel: string;
  emptyStateNotice: string;
  salesNumberLabel: string;
  SFInvoiceNumberLabel: string;
  validUntilLabel: string;
  inventoryLabel: string;
  donationsCheckboxLabel: string;
  donationsCustomAmountLabel: string;
  donationsErrorMessage: string;
  donationsFetchErrorMessage: string;
  donationsOptionsListLabel: string;
  donationsSubmitButtonLabel: string;
  productNotAvailableNotice: string;
  removeProductsNotAvailableMessage: string;
  clearNotAvailableProductsModalHeading?: string;
  clearNotAvailableProductsModalDescription?: string;
  clearNotAvailableProductsModalPrimaryCTALabel?: string;
  clearNotAvailableProductsModalSecondaryCTALabel?: string;
};

export type CouponErrorCode = {
  key: string;
  reason?: {
    [subKey: string]: string;
  };
};

export const CouponErrorLabels: { [key: string]: CouponErrorCode } = {
  MAX_CART_DISCOUNTS_REACHED: {
    key: 'maxCartDiscountsReached',
  },
  STORE_CART_DISCOUNTS_LIMIT_REACHED: {
    key: 'storeCartDiscountsReached',
  },
  NO_MATCHING_PRODUCT_DISCOUNT_FOUND: {
    key: 'validationMessageProductSpecificCoupon',
  },
  CART_DISCOUNT_CODE_NOT_MATCH: {
    key: 'validationMessageProductSpecificCoupon',
  },
  DISCOUNT_CODE_NON_APPLICABLE: {
    key: 'validationMessageNotApplicable',
    reason: {
      DoesNotExist: 'validationMessageNotFound',
      TimeRangeNonApplicable: 'validationMessageExpired',
    },
  },
};

export type AddToCartHit = {
  sku: string;
  pickedProducts?: { sku: string; productKey: string }[];
};
