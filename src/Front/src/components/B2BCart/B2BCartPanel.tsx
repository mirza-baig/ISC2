import { useEffect, useMemo, useRef, type ReactNode } from 'react';

import { CloseIcon } from 'icons/index';
import type { CartLineItem } from 'types/index';

import { useB2BCartLabels } from '../Search/B2BPrivateClassContext';
// Private classes are deferred to a later phase (bug sweep 2026-08-19) — see the destructure below.
// import { useB2BPrivateClass } from '../Search/B2BPrivateClassContext';

import B2BCartLineRow, { type B2BCartLineRowProps } from './B2BCartLineRow';
import B2BCartTotalsBlock, {
  type B2BCartCheckoutCta,
  type B2BCartDiscountDisplay,
} from './B2BCartTotalsBlock';
import UpdateSpinner from './UpdateSpinner';
import useB2BCartThumbnails from './useB2BCartThumbnails';
import { getLineAnswersKey, hasLineSessionStarted, isTrainingProduct } from './b2bCartLine';

export type B2BCartQuote = {
  salesNumber?: string;
  invoiceNumber?: string;
  validUntil?: string;
};

export interface B2BCartPanelProps {
  items: CartLineItem[];
  count: number;
  currencySymbol: string;
  subtotalDisplay: string;
  taxesDisplay: string;
  totalDisplay: string;
  showTaxNote: boolean;
  discounts?: B2BCartDiscountDisplay[];
  showFooter?: boolean;
  canEditQuantity: boolean;
  maxLineQuantity: number | null;
  clampQuantity: NonNullable<B2BCartLineRowProps['clampQuantity']>;
  quantityLabelAlign?: 'left' | 'right';
  isCpq: boolean;
  allowCpqQuantity?: boolean;
  quote: B2BCartQuote;
  isPreloading?: boolean;
  onClose?: () => void;
  onCheckout: () => void;
  checkoutCta?: Pick<B2BCartCheckoutCta, 'label' | 'disabled'>;
  onUpdateQuantity: B2BCartLineRowProps['onUpdate'];
  onRemoveLine: B2BCartLineRowProps['onRemove'];
  isBusy: boolean;
  /**
   * The line whose quantity is being written right now, if any. Lets the list hold that row in
   * place while it is briefly absent from the cart — see `visibleItems` below.
   */
  pendingUpdateLineId?: string | null;
  leadingRows?: ReactNode;
  className?: string;
}

const DOCK_CLASSNAME =
  'flex max-h-[calc(100vh-7rem)] w-full flex-col rounded-lg border border-gray-50 bg-white-00 max-sm:h-full max-sm:max-h-none max-sm:rounded-none max-sm:border-0 sm:w-[290px]';

const B2BCartPanel = ({
  items,
  count,
  currencySymbol,
  subtotalDisplay,
  taxesDisplay,
  totalDisplay,
  showTaxNote,
  discounts,
  showFooter = true,
  canEditQuantity,
  maxLineQuantity,
  clampQuantity,
  quantityLabelAlign,
  isCpq,
  allowCpqQuantity = false,
  quote,
  isPreloading = false,
  onClose,
  onCheckout,
  checkoutCta,
  onUpdateQuantity,
  onRemoveLine,
  isBusy,
  pendingUpdateLineId,
  leadingRows,
  className = DOCK_CLASSNAME,
}: B2BCartPanelProps): JSX.Element => {
  const labels = useB2BCartLabels();
  // Private classes are deferred to a later phase (bug sweep 2026-08-19) — commented out rather
  // than deleted so this can be restored by uncommenting when the feature ships.
  // const { getAnswers, setAnswers, clearAnswers, openLocationModal } = useB2BPrivateClass();

  // `useUpdateLineItemQuantity` has no native commercetools "set quantity" operation to call, so a
  // DECREASE (and any change to a bundle) is a remove followed by a re-add. Both write the cart
  // they return straight into the query cache, so between the two the line really is gone from the
  // cart and the row vanished and came back a moment later — on a full-page list that reads as the
  // cart rebuilding itself. The row is held in its old position for the duration instead.
  //
  // Held only for a quantity write (`pendingUpdateLineId`), never for a removal: Remove must still
  // take the row away at once. The re-added line arrives with a NEW line id, so the check for "is it
  // back yet" is by `getLineAnswersKey` (sku/bundle identity, stable across the pair) — an id
  // comparison would leave the placeholder next to the new row for a frame.
  const previousItemsRef = useRef<CartLineItem[]>(items);

  useEffect(() => {
    if (!pendingUpdateLineId) {
      previousItemsRef.current = items;
    }
  }, [items, pendingUpdateLineId]);

  const visibleItems = useMemo(() => {
    if (!pendingUpdateLineId || items.some((li) => li.id === pendingUpdateLineId)) {
      return items;
    }

    const previousIndex = previousItemsRef.current.findIndex((li) => li.id === pendingUpdateLineId);
    const pendingItem = previousItemsRef.current.find((li) => li.id === pendingUpdateLineId);

    if (!pendingItem) {
      return items;
    }

    const pendingKey = getLineAnswersKey(pendingItem);
    if (items.some((li) => getLineAnswersKey(li) === pendingKey)) {
      return items;
    }

    const held = [...items];
    held.splice(Math.min(previousIndex, held.length), 0, pendingItem);
    return held;
  }, [items, pendingUpdateLineId]);

  // Thumbnails resolve for the rows on screen, held row included: keyed on the visible SKUs, the
  // bulk lookup does not go back into its loading state and drop every image mid-update.
  const {
    showThumbnail,
    getThumbnail,
    isLoading: thumbnailsLoading,
  } = useB2BCartThumbnails(visibleItems);

  const startedLineIds = new Set(visibleItems.filter(hasLineSessionStarted).map((li) => li.id));
  const checkoutBlocked = startedLineIds.size > 0;

  return (
    <section className={className}>
      <div className="relative flex items-center justify-center border-b border-gray-50 px-4 py-3">
        <span className="absolute left-4 text-sm font-semibold text-black-100">{labels.title}</span>
        <span className="text-sm text-gray-70">
          {count} {count === 1 ? labels.item : labels.items}
        </span>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close cart"
            className="absolute right-3 flex h-6 w-6 cursor-pointer items-center justify-center rounded border border-gray-50 text-gray-70 hover:text-black-100"
          >
            <CloseIcon size={12} />
          </button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {isCpq && (
          <div className="border-b border-gray-50 bg-black-05 px-4 py-3">
            {quote.salesNumber && (
              <p className="text-xs font-semibold text-black-100">
                {labels.cpqSalesNumber} {quote.salesNumber}
              </p>
            )}
            {quote.invoiceNumber && (
              <p className="mt-0.5 text-xs font-semibold text-black-100">
                {labels.cpqInvoiceNumber} {quote.invoiceNumber}
              </p>
            )}
            {quote.validUntil && (
              <p className="mt-0.5 text-xs text-gray-90">
                {labels.cpqValidUntil} {quote.validUntil}
              </p>
            )}
            <p className="mt-1.5 text-xs text-gray-70">{labels.cpqNotice}</p>
          </div>
        )}

        {isPreloading && (
          <p
            aria-live="polite"
            className="flex items-center justify-center gap-2 border-b border-gray-50 px-4 py-3 text-xs text-gray-70"
          >
            {labels.preloadLoading}
            <UpdateSpinner />
          </p>
        )}

        {leadingRows}

        {visibleItems.map((li) => {
          // Private classes are deferred to a later phase (bug sweep 2026-08-19) — `lineSku` was
          // also used to key the private-class answers store; that usage is commented out below.
          // const lineSku = getLineAnswersKey(li);
          // const answers = getAnswers(lineSku);
          return (
            <B2BCartLineRow
              key={li.id}
              item={li}
              currencySymbol={currencySymbol}
              updateLabel={labels.update}
              removeLabel={labels.remove}
              quantityLabel={
                isTrainingProduct(li.productType?.name, li.name)
                  ? labels.attendees
                  : labels.quantity
              }
              onUpdate={onUpdateQuantity}
              // onRemove={(item) => {
              //   onRemoveLine(item);
              //   clearAnswers(lineSku);
              // }}
              onRemove={onRemoveLine}
              isBusy={isBusy}
              isPrivate={false}
              hasStarted={startedLineIds.has(li.id)}
              startedLabel={labels.sessionStarted}
              readOnly={isCpq}
              canEditQuantity={canEditQuantity}
              allowQuantityWhenReadOnly={allowCpqQuantity}
              maxQuantity={maxLineQuantity}
              clampQuantity={clampQuantity}
              quantityLabelAlign={quantityLabelAlign}
              showThumbnail={showThumbnail(li) && !thumbnailsLoading}
              thumbnailSrc={getThumbnail(li)}
              // committedAnswers={answers}
              // onCommitAnswers={(a) => setAnswers(lineSku, a)}
              // openLocationModal={openLocationModal}
            />
          );
        })}
      </div>

      {showFooter && (
        <div className="border-t border-gray-50 px-4 pb-4 pt-3">
          <B2BCartTotalsBlock
            subtotalDisplay={subtotalDisplay}
            taxesDisplay={taxesDisplay}
            totalDisplay={totalDisplay}
            showTaxNote={showTaxNote}
            discounts={discounts}
            checkoutBlocked={checkoutBlocked}
            onCheckout={onCheckout}
            checkoutCta={checkoutCta}
          />
        </div>
      )}
    </section>
  );
};

export { DOCK_CLASSNAME };
export default B2BCartPanel;
