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
  /** Per-item quantity. Overrides the payload-level `quantity` in `useAddToCart`, so ONE mutation
   *  can carry several lines at different quantities (needed by the B2B currency re-price path,
   *  which must rebuild the whole cart in a single UPDATE_CART). Omit to use the shared quantity. */
  quantity?: number;
  /**
   * B2B opt-in, forwarded to the cart service on a BUNDLE add only. It lets the cart hold the same
   * bundle more than once (one class, several dates) and makes `quantity` mean seats on that add.
   * Omitted by every other caller, and omitting it is the pre-existing behaviour.
   */
  allowMultiple?: boolean;
};
