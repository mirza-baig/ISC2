import { MouseEventHandler, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import { useRouter } from 'next/router';
import clsx from 'clsx';

import { Cart, CartLineItem } from 'types/index';
import { LineItemLoadingIndicator, LineItemPrice, BundleLineItemProducts } from 'ui/index';
import {
  formatDateRange,
  getPriceQuantityFor,
  getUTCTime,
  getVariantAttributes,
  isBundleLineItem,
  parsePriceFromMoney,
} from 'utils/index';
import { useCart, useLineItems } from 'providers/index';
import { useRemoveFromCart } from 'hooks/index';
import { TrashIcon } from 'icons/index';

export namespace OrderSummaryLineItem {
  export type Props = {
    lineItem: CartLineItem;
    productNotAvailableLabel: string;
    userPriceLabel: string;
    orderDetailsMode?: boolean;
  };
}

const TEXT_CLASSES = 'flex space-x-4 body-m !tracking-normal';

export const OrderSummaryLineItem = ({
  lineItem,
  productNotAvailableLabel,
  userPriceLabel,
  orderDetailsMode,
}: OrderSummaryLineItem.Props) => {
  const router = useRouter();

  const { lineItemHasDiscounts } = useLineItems();
  const { activeCart } = useCart();

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

  const hasDiscounts = useMemo(
    () => lineItemHasDiscounts(lineItem),
    [lineItemHasDiscounts, lineItem]
  );

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
    if (activeCart.computed.isB2B) {
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
  }, [activeCart.computed.isB2B, attributes, date, lineItem.quantity]);

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
    const totalPrice = parsePriceFromMoney(lineItem.totalPrice, 1, false);

    if (isBundleLineItem(lineItem)) {
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
      <>
        <div className={clsx(TEXT_CLASSES, isNotAvailable && !orderDetailsMode && 'opacity-30')}>
          <LineItemPrice
            type="user-specific"
            userPriceLabel={userPriceLabel}
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
  }, [
    activeCart.computed.currencySymbol,
    attributes,
    hasDiscounts,
    isNotAvailable,
    lineItem,
    secondLineText,
    secondLineValue,
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
