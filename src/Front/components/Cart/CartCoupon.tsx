import { Field } from '@sitecore-jss/sitecore-jss-nextjs';
import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';

import { useCart } from 'providers/index';
import { CouponErrorCode, CouponErrorLabels } from 'types/index';
import { CloseIcon, ChevronSquaredDownIcon } from 'icons/index';
import { parseFieldsFromURLString } from 'utils/index';
import { useApplyCouponCode, useRemoveCouponCode } from 'hooks/index';
import { COUPON_MAX_LENGTH } from 'constants/index';
import { LineItemLoadingIndicator } from 'ui/index';

interface CouponCodeLabels {
  couponTitle: string;
  applyButtonLabel: string;
  textInputPlaceholder: string;
  validationMessageEmpty: string;
  validationMessageInvalid: string;
  validationMessageRepeated: string;
  validationMessageExpired: string;
  validationMessageNotFound: string;
  validationMessageProductSpecificCoupon: string;
  validationMessageNotApplicable: string;
  storeCartDiscountsReached: string;
  maxCartDiscountsReached: string;
}

interface CartCouponProps {
  couponTitleAndLabels: Field<string>;
}

const CartCoupon = ({ couponTitleAndLabels }: CartCouponProps): JSX.Element => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentCoupon, setCurrentCoupon] = useState('');
  const [error, setError] = useState<string | null>(null);

  const parsedFields = parseFieldsFromURLString<CouponCodeLabels>(couponTitleAndLabels);

  const { couponCodeError, appliedCouponSuccess, applyCouponCode, isApplyingCouponCode } =
    useApplyCouponCode();

  const { removeCouponCode, isRemovingCouponCode } = useRemoveCouponCode();
  const { activeCart } = useCart();

  const isSubmitting = isRemovingCouponCode || isApplyingCouponCode;

  const appliedCoupons = useMemo(() => {
    if (activeCart?.discountCodes) {
      return activeCart.discountCodes.reduce((accum, discount) => {
        if (discount.discountCode) {
          return [...accum, discount.discountCode.code || discount.discountCode.name];
        }

        return accum;
      }, []);
    }

    return [];
  }, [activeCart]);

  useEffect(() => {
    if (couponCodeError && !error && currentCoupon) {
      const { code, reason } = couponCodeError.extensions || {};
      const errorData = code ? (CouponErrorLabels[code] as CouponErrorCode) : null;
      const key = errorData
        ? errorData?.reason?.[reason as keyof typeof errorData] || errorData?.key
        : null;
      const errorMessage = key
        ? parsedFields[key as keyof CouponCodeLabels]
        : couponCodeError?.message; // fallback in case of no sitecore message assigned

      setError(errorMessage);
    }
  }, [couponCodeError, currentCoupon, parsedFields, error]);

  useEffect(() => {
    if (appliedCouponSuccess) {
      setCurrentCoupon('');
      setError(null);
    }
  }, [appliedCouponSuccess]);

  const onApplyCoupon = () => {
    setError(null);

    if (isSubmitting) {
      return;
    }

    const enteredCoupon = currentCoupon.replace(/\s/g, '');
    if (!enteredCoupon) {
      return setError(parsedFields.validationMessageEmpty);
    }

    const codeHasBeenEntered = appliedCoupons.some(
      (coupon) => coupon.toLowerCase() === enteredCoupon.toLowerCase()
    );

    if (codeHasBeenEntered) {
      return setError(parsedFields.validationMessageRepeated);
    }

    if (enteredCoupon.length > COUPON_MAX_LENGTH) {
      return setError(parsedFields.validationMessageInvalid);
    }

    applyCouponCode({ discountCode: enteredCoupon });
  };

  const removeItem = (coupon: string) => {
    setError(null);

    if (isSubmitting || !activeCart?.discountCodes) {
      return;
    }

    const discount = activeCart.discountCodes.find(
      ({ discountCode }) => coupon === discountCode?.code
    );

    if (!discount || !discount.discountCode) {
      return;
    }

    removeCouponCode({ discountCodeId: discount.discountCode.id });
  };

  return (
    <div className="border-gray-30 relative border rounded-lg bg-gray-10 p-5">
      <button
        type="button"
        className="text-xsm font-semibold color-black-100 flex items-center px-1"
        onClick={() => {
          setIsOpen((state) => !state);
        }}
        aria-label={parsedFields.couponTitle}
      >
        {parsedFields.couponTitle}

        <ChevronSquaredDownIcon
          size={24}
          className={clsx('transition-all duration-150', isOpen && 'rotate-180', 'mx-0.5')}
        />
      </button>
      <div className={clsx('transition-height', isOpen && 'open')}>
        <div className="overflow-hidden px-1">
          <div className="flex items-stretch pt-2 flex-col gap-3 md:flex-row">
            <input
              className={clsx(
                error && 'border-red-error',
                'w-full transition-all duration-700 border-gray-70 border-1 rounded-md bg-white-00 text-xsm focus:ring-0 focus:border-2 focus:border-isc2-green focus:rounded-full px-4'
              )}
              type="text"
              value={currentCoupon}
              placeholder={parsedFields.textInputPlaceholder}
              onChange={(e) => setCurrentCoupon(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onApplyCoupon();
                }
              }}
            />
            <button
              type="button"
              disabled={!currentCoupon || isSubmitting}
              className="primary-cta min-w-102 tracking-tightest bold-link text-xsm px-3 flex justify-center items-center"
              onClick={onApplyCoupon}
              aria-label={parsedFields.applyButtonLabel}
            >
              {parsedFields.applyButtonLabel}
            </button>
          </div>
          {error && <p className="text-red-error body-s pt-1">{error}</p>}
          <ul className="flex flex-wrap pt-3">
            {appliedCoupons.map((coupon) => (
              <li
                key={coupon}
                className="bg-white-00 border border-gray-50 rounded-full mr-2 mb-2 py-1.5 pr-2 pl-4 flex items-center body-s truncate"
              >
                <span className="truncate">{coupon}</span>
                <button
                  onClick={() => removeItem(coupon)}
                  aria-label="Close"
                  disabled={isSubmitting}
                  className="flex items-center justify-center min-w-5.5 min-h-5.5 bg-gray-30 border-none rounded-full ml-2 focus-dark-green"
                >
                  <CloseIcon size={14} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {(isApplyingCouponCode || isRemovingCouponCode) && (
        <LineItemLoadingIndicator className="rounded-lg" />
      )}
    </div>
  );
};

export default CartCoupon;
