import { MouseEventHandler, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import { useRouter } from 'next/router';
import clsx from 'clsx';

import { Cart, CartLineItem } from 'types/index';
import { LineItemLoadingIndicator, LineItemPrice, BundleLineItemProducts } from 'ui/index';
import {
  formatDateRange,
  getLineItemTotalBeforeCartDiscounts,
  getPriceQuantityFor,
  getUTCTime,
  getVariantAttributes,
  isBundleLineItem,
  parsePriceFromMoney,
} from 'utils/index';
import { useCart, useLineItems } from 'providers/index';
import { useB2BCartAccess, useRemoveFromCart } from 'hooks/index';
import { TrashIcon } from 'icons/index';

export namespace OrderSummaryLineItem {
  export type Props = {
    lineItem: CartLineItem;
    productNotAvailableLabel: string;
    userPriceLabel: string;
    orderDetailsMode?: boolean;
    isPrepaidDiscountOnCart?: boolean;
  };
}

const TEXT_CLASSES = 'flex space-x-4 body-m !tracking-normal';

export const OrderSummaryLineItem = ({
  lineItem,
  productNotAvailableLabel,
  userPriceLabel,
  orderDetailsMode,
  isPrepaidDiscountOnCart,
}: OrderSummaryLineItem.Props) => {
  const router = useRouter();

  const { lineItemHasDiscounts } = useLineItems();
  const { activeCart } = useCart();
  const { isAuthorizedBuyer } = useB2BCartAccess();

  const onItemRemovedFromCart = useCallback(
    (cart: Cart) => {
      if (!cart.totalLineItemQuantity) {
        router.replace('/');
      }
    },
    [router]
  );

  const { removeFromCart, isRemovingFromCart } = useRemoveFromCart({
    onSuccess: onItemRemovedFromCart,
  });

  const totalBeforePrepaidDiscount = useMemo(
    () => (isPrepaidDiscountOnCart ? getLineItemTotalBeforeCartDiscounts(lineItem) : undefined),
    [isPrepaidDiscountOnCart, lineItem]
  );

  const hasDiscounts = useMemo(() => {
    if (!totalBeforePrepaidDiscount) {
      return lineItemHasDiscounts(lineItem);
    }

    // Only the product's own sale price is struck through; the prepaid discount has its row.
    const nonMemberTotal = parsePriceFromMoney(
      lineItem.nonMemberPrice,
      getPriceQuantityFor(lineItem)
    );
    const beforeTotal = parsePriceFromMoney(totalBeforePrepaidDiscount, 1);

    return Number(nonMemberTotal) > Number(beforeTotal);
  }, [lineItemHasDiscounts, lineItem, totalBeforePrepaidDiscount]);

  const isNotAvailable = useMemo(
    () => lineItem.availableQuantity === 0,
    [lineItem.availableQuantity]
  );

  const attributes = useMemo(() => getVariantAttributes(lineItem.variant), [lineItem.variant]);

  const date = useMemo(() => {
    return {
      isoStart: getUTCTime({
        time: attributes.start_time,
        date: attributes.start_date,
        timeZone: attributes.time_zone_iana || attributes.time_zone,
      }),
      isoEnd: getUTCTime({
        time: attributes.end_time,
        date: attributes.end_date,
        timeZone: attributes.time_zone_iana || attributes.time_zone,
      }),
    };
  }, [attributes]);

  const secondLineText = useMemo(() => {
    if (activeCart.computed.isB2B || isAuthorizedBuyer) {
      return `Quantity: ${lineItem.quantity}`;
    }

    const dateValue = formatDateRange(date);
    const isTimeSetUp = attributes.start_time && attributes.end_time;

    const time =
      date.isoStart &&
      date.isoEnd &&
      isTimeSetUp &&
      `, ${format(date.isoStart, 'HH:mm aa')} to ${format(date.isoEnd, 'HH:mm aa')}`;
    if (!attributes['modality'] || !dateValue) return undefined;

    return `${attributes['modality']} ${dateValue}${time}`;
  }, [activeCart.computed.isB2B, isAuthorizedBuyer, attributes, date, lineItem.quantity]);

  const secondLineValue = useMemo(() => {
    if (!hasDiscounts) {
      return '';
    }

    return parsePriceFromMoney(lineItem.nonMemberPrice, getPriceQuantityFor(lineItem), false);
  }, [hasDiscounts, lineItem]);

  const onTrashIconClick: MouseEventHandler = useCallback(
    (ev) => {
      ev.preventDefault();

      removeFromCart({ lineItems: [lineItem] });
    },
    [lineItem, removeFromCart]
  );

  const LineItemContent = useMemo(() => {
    const name = attributes.copy_name || attributes.name || lineItem.name;
    const totalPrice = parsePriceFromMoney(
      totalBeforePrepaidDiscount ?? lineItem.totalPrice,
      1,
      false
    );

    const showAuthorizedBuyerPricing = isAuthorizedBuyer && hasDiscounts;
    const isAuthorizedBuyerView = activeCart.computed.isB2B || isAuthorizedBuyer;

    const PricingStack = (
      <div className="flex flex-col items-end shrink-0">
        {showAuthorizedBuyerPricing ? (
          <LineItemPrice
            type="user-specific"
            userPriceLabel={userPriceLabel}
            value={totalPrice}
            currency={activeCart.computed.currencySymbol}
          />
        ) : (
          <LineItemPrice value={totalPrice} currency={activeCart.computed.currencySymbol} />
        )}
        {secondLineValue !== '' && (
          <LineItemPrice
            strikeThrough
            value={secondLineValue}
            currency={activeCart.computed.currencySymbol}
          />
        )}
      </div>
    );

    if (isBundleLineItem(lineItem)) {
      if (!isAuthorizedBuyerView) {
        return (
          <>
            <LineItemPrice
              strikeThrough={hasDiscounts}
              textClassName="body-s"
              valueClassName="body-m"
              title={name}
              value={totalPrice}
              currency={activeCart.computed.currencySymbol}
            />
            <BundleLineItemProducts lineItem={lineItem} />
          </>
        );
      }

      return (
        <div
          className={clsx(
            'flex justify-between items-start gap-4',
            isNotAvailable && !orderDetailsMode && 'opacity-30'
          )}
        >
          <div className="flex flex-col">
            <label className="body-m">{name}</label>
            <BundleLineItemProducts lineItem={lineItem} alwaysShowQuantity />
          </div>
          {PricingStack}
        </div>
      );
    }

    if (!isAuthorizedBuyerView) {
      return (
        <>
          <div className={clsx(TEXT_CLASSES, isNotAvailable && !orderDetailsMode && 'opacity-30')}>
            <LineItemPrice
              title={name}
              value={totalPrice}
              currency={activeCart.computed.currencySymbol}
            />
          </div>
          <div className={clsx(TEXT_CLASSES, isNotAvailable && !orderDetailsMode && 'opacity-30')}>
            <LineItemPrice
              strikeThrough={hasDiscounts}
              textClassName="body-s"
              valueClassName="body-m"
              title={secondLineText}
              value={secondLineValue}
              currency={activeCart.computed.currencySymbol}
            />
          </div>
        </>
      );
    }

    return (
      <div
        className={clsx(
          'flex justify-between items-start gap-4',
          isNotAvailable && !orderDetailsMode && 'opacity-30'
        )}
      >
        <div className="flex flex-col">
          <label className="body-m">{name}</label>
          <label className="body-s text-gray-90 mt-1">{secondLineText}</label>
        </div>
        {PricingStack}
      </div>
    );
  }, [
    activeCart.computed.currencySymbol,
    activeCart.computed.isB2B,
    attributes,
    hasDiscounts,
    isAuthorizedBuyer,
    isNotAvailable,
    lineItem,
    secondLineText,
    secondLineValue,
    totalBeforePrepaidDiscount,
    userPriceLabel,
    orderDetailsMode,
  ]);

  return (
    <li key={lineItem.id} className="relative [&:not(:first-child)]:pt-3">
      {isRemovingFromCart && <LineItemLoadingIndicator />}

      {LineItemContent}

      {isNotAvailable && !orderDetailsMode && (
        <div className="flex justify-between items-center mt-2">
          <label className="warning-pill">{productNotAvailableLabel}</label>
          <button onClick={onTrashIconClick} aria-label="Delete product">
            <TrashIcon size={24} />
          </button>
        </div>
      )}
    </li>
  );
};
