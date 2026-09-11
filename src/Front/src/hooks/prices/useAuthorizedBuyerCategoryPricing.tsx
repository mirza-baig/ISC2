import {
  AuthorizedBuyerCategoryPricing,
  decodeAuthorizedBuyerPricingVoucher,
} from 'lib/authorizedBuyer';

import useAuthorizedBuyerPricingVoucher from '../cart/useAuthorizedBuyerPricingVoucher';

export { resolveCategoryDiscount } from 'lib/authorizedBuyer';

export default function useAuthorizedBuyerCategoryPricing():
  | AuthorizedBuyerCategoryPricing[]
  | undefined {
  const { voucher } = useAuthorizedBuyerPricingVoucher();

  return decodeAuthorizedBuyerPricingVoucher(voucher)?.categoryPricing;
}
