import { MouseEventHandler, useCallback, useMemo } from 'react';
import clsx from 'clsx';

import { TrashIcon } from 'icons/index';
import { CartLineItem as TCartLineItem } from 'types/index';
import { isDonationItem, parsePriceFromMoney } from 'utils/index';
import { useGetAlgoliaSitecoreData, useRemoveFromCart } from 'hooks/index';
import { useCart, useLineItems, useCartFields } from 'providers/index';
import { ProductThumbnail } from 'ui/ProductThumbnail';
import {
  LineItemLoadingIndicator,
  LineItemPrice,
  LineItemAttributes,
  LineItemSeats,
} from 'ui/index';

export namespace CartLineItem {
  export type Props = {
    lineItem: TCartLineItem;
  };
}

const THUMBNAIL_IMAGE_CLASSES = 'h-20 lg:h-30 aspect-square bg-white -my-3 lg:-my-5';

export const CartLineItem = ({ lineItem }: CartLineItem.Props) => {
  const { activeCart } = useCart();
  const { labels } = useCartFields();
  const { algoliaIndex, lineItemHasDiscounts } = useLineItems();
  const { removeFromCart, isRemovingFromCart } = useRemoveFromCart();
  const { algoliaData, algoliaDataIsLoading } = useGetAlgoliaSitecoreData({
    productKeysList: [lineItem?.productKey],
    algoliaIndex,
  });

  const hasDiscounts = useMemo(
    () => lineItemHasDiscounts(lineItem),
    [lineItemHasDiscounts, lineItem]
  );

  const isDonation = useMemo(() => isDonationItem(lineItem?.name), [lineItem]);

  const disableLink = useMemo(
    () => isRemovingFromCart || activeCart.computed.isB2B,
    [isRemovingFromCart, activeCart.computed.isB2B]
  );

  const ThumbnailImageContent = useMemo(() => {
    return (
      <span className={THUMBNAIL_IMAGE_CLASSES}>
        {!algoliaDataIsLoading && (
          <ProductThumbnail
            src={algoliaData?.thumbnailImage}
            alt={lineItem.id}
            className={clsx(lineItem.availableQuantity === 0 && 'grayscale opacity-75')}
          />
        )}
      </span>
    );
  }, [algoliaData?.thumbnailImage, algoliaDataIsLoading, lineItem.availableQuantity, lineItem.id]);

  const PricingContent = useMemo(() => {
    if (hasDiscounts) {
      return (
        <>
          <LineItemPrice
            type="user-specific"
            userPriceLabel={labels.yourPriceLabel}
            value={parsePriceFromMoney(lineItem.totalPrice, 1, false)}
            currency={activeCart.computed.currencySymbol}
          />
          <LineItemPrice
            strikeThrough={hasDiscounts}
            value={parsePriceFromMoney(lineItem.nonMemberPrice, lineItem.quantity, false)}
            currency={activeCart.computed.currencySymbol}
          />
        </>
      );
    }

    return (
      <LineItemPrice
        value={parsePriceFromMoney(
          Boolean(lineItem.nonMemberPrice) ? lineItem.nonMemberPrice : lineItem.price.value,
          lineItem.quantity,
          false
        )}
        currency={activeCart.computed.currencySymbol}
      />
    );
  }, [hasDiscounts, lineItem, activeCart, labels?.yourPriceLabel]);

  const onTrashIconClick: MouseEventHandler = useCallback(
    (ev) => {
      ev.preventDefault();
      removeFromCart({ lineItems: [lineItem] });
    },
    [lineItem, removeFromCart]
  );

  return (
    <a
      href={disableLink ? 'javascript:void(0)' : algoliaData?.url}
      className={clsx(
        'flex flex-col relative py-4 border-t border-t-gray-30 lg:border lg:border-gray-70 lg:rounded-lg lg:p-5',
        disableLink && 'pointer-events-none',
        lineItem.availableQuantity === 0 && '!border-gray-50'
      )}
    >
      <div className="flex">
        {!isDonation && ThumbnailImageContent}
        <div
          className={clsx(
            'flex flex-col flex-grow pr-5 lg:pr-8 lg:self-center',
            !isDonation && 'pl-2 lg:pl-5'
          )}
        >
          <div className="flex flex-col">
            <LineItemAttributes
              lineItem={lineItem}
              isOutOfStock={lineItem.availableQuantity === 0}
            />

            {activeCart.computed.isB2B && (
              <label className="body-s mt-3 hidden lg:flex">
                {labels.quantityLabel}: {lineItem.quantity}
              </label>
            )}
          </div>

          <LineItemSeats
            fewSeatsLabel={labels.inventoryLabel}
            notAvailableLabel={labels.productNotAvailableNotice}
            lineItem={lineItem}
            className="mt-2 self-start"
          />
        </div>

        <div
          className={clsx(
            'flex flex-col items-end space-y-2',
            activeCart.computed.isB2B ? 'justify-end' : 'justify-between'
          )}
        >
          {!activeCart.computed.isB2B && (
            <button onClick={onTrashIconClick} aria-label="Delete product">
              <TrashIcon size={24} />
            </button>
          )}

          <span className="hidden lg:flex lg:flex-col">{PricingContent}</span>
        </div>
      </div>

      <div
        className={clsx(
          'flex items-center mt-3 lg:hidden',
          activeCart.computed.isB2B ? 'justify-between' : 'justify-end'
        )}
      >
        {activeCart.computed.isB2B && (
          <label className="body-s whitespace-nowrap">
            {labels.quantityLabel}: {lineItem.quantity}
          </label>
        )}

        <div className="flex flex-col">{PricingContent}</div>
      </div>

      {isRemovingFromCart && <LineItemLoadingIndicator className="lg:rounded-lg" />}
    </a>
  );
};
