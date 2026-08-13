import clsx from 'clsx';
import { MouseEventHandler, useCallback, useMemo } from 'react';

import { CartLineItem, LineItemAlgoliaData } from 'types/index';
import { TrashIcon } from 'icons/index';
import { isDonationItem, parsePriceFromMoney } from 'utils/index';
import { useRemoveFromCart } from 'hooks/index';
import { useCart, useLineItems, useMiniCartFields } from 'providers/index';
import {
  LineItemAttributes,
  LineItemLoadingIndicator,
  LineItemPrice,
  LineItemSeats,
} from 'ui/index';
import { ProductThumbnail } from 'ui/ProductThumbnail';

const THUMBNAIL_IMAGE_CLASSES = 'h-20 aspect-square -mt-3 mr-3';

export namespace MiniCartLineItem {
  export type Props = {
    lineItem: CartLineItem;
    /** Resolved by the parent from one batched Algolia search. */
    algoliaData?: LineItemAlgoliaData;
    algoliaDataIsLoading?: boolean;
  };
}

export const MiniCartLineItem = ({
  lineItem,
  algoliaData,
  algoliaDataIsLoading,
}: MiniCartLineItem.Props) => {
  const { lineItemHasDiscounts } = useLineItems();
  const { labels } = useMiniCartFields();
  const { activeCart } = useCart();

  const { removeFromCart, isRemovingFromCart } = useRemoveFromCart();

  const NOT_AVAILABLE_CLASS = clsx(lineItem.availableQuantity === 0 && 'opacity-40');

  const hasDiscounts = useMemo(
    () => lineItemHasDiscounts(lineItem),
    [lineItemHasDiscounts, lineItem]
  );

  const isDonation = useMemo(() => isDonationItem(lineItem?.name), [lineItem]);

  const onTrashIconClick: MouseEventHandler = useCallback(
    (ev) => {
      ev.preventDefault();

      removeFromCart({ lineItems: [lineItem] });
    },
    [lineItem, removeFromCart]
  );

  const ThumbnailImageContent = useMemo(() => {
    return (
      <span className={THUMBNAIL_IMAGE_CLASSES}>
        {!algoliaDataIsLoading && (
          <ProductThumbnail
            src={algoliaData?.thumbnailImage}
            alt={lineItem.id}
            className={NOT_AVAILABLE_CLASS}
          />
        )}
      </span>
    );
  }, [algoliaDataIsLoading, algoliaData?.thumbnailImage, lineItem.id, NOT_AVAILABLE_CLASS]);

  return (
    <a href={algoliaData?.url} className="py-4 flex flex-col relative">
      <div className="flex w-full items-start">
        {!isDonation && ThumbnailImageContent}

        <div className={clsx('flex flex-1 flex-col mr-5 text-start', NOT_AVAILABLE_CLASS)}>
          <LineItemAttributes lineItem={lineItem} />
        </div>

        <button onClick={onTrashIconClick} aria-label="Delete product">
          <TrashIcon size={24} />
        </button>
      </div>

      <div className="flex justify-between items-center mt-2">
        <LineItemSeats
          fewSeatsLabel={labels.inventoryLabel}
          notAvailableLabel={labels.productNotAvailableNotice}
          lineItem={lineItem}
          className="!self-center !mt-0"
        />

        <div className={clsx('flex flex-col', NOT_AVAILABLE_CLASS)}>
          {hasDiscounts && (
            <LineItemPrice
              type="user-specific"
              userPriceLabel={labels.yourPriceLabel}
              value={parsePriceFromMoney(lineItem.totalPrice, 1, false)}
              currency={activeCart.computed.currencySymbol}
            />
          )}

          <LineItemPrice
            strikeThrough={hasDiscounts}
            textClassName={hasDiscounts ? '!font-semibold' : ''}
            currency={activeCart.computed.currencySymbol}
            value={parsePriceFromMoney(
              Boolean(lineItem.nonMemberPrice) ? lineItem.nonMemberPrice : lineItem.price.value,
              lineItem.quantity,
              false
            )}
          />
        </div>
      </div>

      {isRemovingFromCart && <LineItemLoadingIndicator />}
    </a>
  );
};
