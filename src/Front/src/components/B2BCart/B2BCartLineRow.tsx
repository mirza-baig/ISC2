import { useEffect, useState } from 'react';
import clsx from 'clsx';

import { getPriceQuantityFor, parsePriceFromMoney } from 'utils/index';
import type { ClampQuantity } from 'hooks/cart/b2bLineQuantity';
import { ProductThumbnail } from 'ui/ProductThumbnail';
import type { CartLineItem } from 'types/index';

import { useB2BCartLabels } from '../Search/B2BPrivateClassContext';
// Private classes are deferred to a later phase (bug sweep 2026-08-19) — the questions block below
// and everything that fed it are commented out rather than deleted so they can be restored by
// uncommenting when the feature ships.
// import {
//   useB2BPrivateClassLabels,
//   type LocationMode,
//   type PrivateClassAnswers,
//   type B2BPrivateClassContextValue,
// } from '../Search/B2BPrivateClassContext';
// import { useB2BPrivateClassDraft } from '../Search/useB2BPrivateClassDraft';
// import { isPastCalendarDay, todayISODate } from '../Search/b2bDates';

import { getLineDisplayName } from './b2bCartLine';
import UpdateSpinner from './UpdateSpinner';

export interface B2BCartLineRowProps {
  item: CartLineItem;
  currencySymbol: string;
  updateLabel: string;
  removeLabel: string;
  quantityLabel: string;
  onUpdate: (item: CartLineItem, qty: number) => void;
  onRemove: (item: CartLineItem) => void;
  isBusy: boolean;
  isPrivate: boolean;
  hasStarted: boolean;
  startedLabel: string;
  readOnly: boolean;
  canEditQuantity?: boolean;
  allowQuantityWhenReadOnly?: boolean;
  maxQuantity?: number | null;
  clampQuantity?: ClampQuantity;
  quantityLabelAlign?: 'left' | 'right';
  showThumbnail?: boolean;
  thumbnailSrc?: string;
  // Private classes are deferred to a later phase (bug sweep 2026-08-19) — see the import comment
  // above.
  // committedAnswers: PrivateClassAnswers;
  // onCommitAnswers: (answers: PrivateClassAnswers) => void;
  // openLocationModal: B2BPrivateClassContextValue['openLocationModal'];
}

const B2BCartLineRow = ({
  item,
  currencySymbol,
  updateLabel,
  removeLabel,
  quantityLabel,
  onUpdate,
  onRemove,
  isBusy,
  isPrivate,
  hasStarted,
  startedLabel,
  readOnly,
  canEditQuantity = true,
  allowQuantityWhenReadOnly = false,
  maxQuantity = null,
  clampQuantity,
  quantityLabelAlign = 'left',
  showThumbnail = false,
  thumbnailSrc,
}: B2BCartLineRowProps): JSX.Element => {
  const [qty, setQty] = useState(item.quantity);
  // Private classes are deferred to a later phase (bug sweep 2026-08-19) — commented out along with
  // the questions block below so they can be restored by uncommenting when the feature ships.
  // const { draft, setDraft, areAnswersDirty, openAddressModal } = useB2BPrivateClassDraft(
  //   committedAnswers,
  //   openLocationModal
  // );
  // const L = useB2BPrivateClassLabels();
  const cartLabels = useB2BCartLabels();
  // const minDate = todayISODate();
  const displayName = getLineDisplayName(item);

  useEffect(() => {
    setQty(item.quantity);
  }, [item.quantity]);

  // const isDirty = areAnswersDirty || (canEditQuantity && qty !== item.quantity);
  const isDirty = canEditQuantity && qty !== item.quantity;

  // Private classes are deferred (bug sweep 2026-08-19): `isPrivate` is always false at every call
  // site today, so this always resolves true; the real check is commented out below.
  const privateComplete = true;
  // const privateComplete =
  //   !isPrivate ||
  //   (draft.requestedStartDate.trim() !== '' &&
  //     !isPastCalendarDay(draft.requestedStartDate) &&
  //     draft.locationMode !== '' &&
  //     qty >= 1 &&
  //     (draft.locationMode !== 'at-location' || draft.eventAddress.trim() !== ''));

  const commitQuantity = (value: number) => (clampQuantity ? clampQuantity(value) : value);

  const handleUpdate = () => {
    onUpdate(item, commitQuantity(qty));
    // onCommitAnswers(draft);
  };

  const unitMoney = item.price?.discounted?.value ?? item.price?.value;
  const unit = unitMoney ? `${currencySymbol}${parsePriceFromMoney(unitMoney, 1, false)}` : '—';
  const totalMoney = item.totalPrice ?? item.price?.value;
  const total = totalMoney
    ? `${currencySymbol}${parsePriceFromMoney(
        totalMoney,
        item.totalPrice ? 1 : getPriceQuantityFor(item),
        false
      )}`
    : '—';

  const showUpdateButton = canEditQuantity || isPrivate;
  const editableWhenReadOnly = readOnly && allowQuantityWhenReadOnly && canEditQuantity;

  const quantityRowClassName = clsx(
    'flex items-center gap-2',
    quantityLabelAlign === 'right' ? 'justify-end' : 'justify-between'
  );

  const staticQuantity = (
    <span className="shrink-0 text-sm font-semibold text-black-100">{item.quantity}</span>
  );

  const quantityInput = (
    <input
      type="number"
      min={1}
      max={maxQuantity ?? undefined}
      value={qty}
      onChange={(e) => setQty(commitQuantity(parseInt(e.target.value, 10) || 1))}
      aria-label={`${quantityLabel} for ${displayName}`}
      className="w-[52px] rounded border border-gray-50 p-1 text-center text-sm"
    />
  );

  const updateButton = (disabled: boolean) => (
    <button
      type="button"
      onClick={handleUpdate}
      disabled={disabled}
      className="flex items-center rounded border border-gray-50 bg-white-00 px-3 py-1.5 text-sm text-black-100 enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
    >
      {updateLabel}
      {isBusy && <UpdateSpinner />}
    </button>
  );

  return (
    <div className="border-b border-gray-50 px-4 py-4">
      <div className="mb-3 flex items-start gap-3">
        {showThumbnail && (
          <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded border border-gray-50 bg-white-00">
            <ProductThumbnail
              src={thumbnailSrc}
              alt={displayName}
              className={clsx(
                'h-full w-full object-contain',
                item.availableQuantity === 0 && 'grayscale opacity-75'
              )}
            />
          </span>
        )}
        <div className="flex min-w-0 flex-1 items-end justify-between gap-3">
          <span className="text-sm font-semibold leading-snug text-black-100">{displayName}</span>
          <div className="grid shrink-0 grid-cols-[auto_auto] gap-x-2 text-xs text-gray-70">
            <span>{cartLabels.price}</span>
            <span className="font-semibold">{unit}</span>
            <span className="text-sm">{cartLabels.total}</span>
            <span className="text-sm font-semibold">{total}</span>
          </div>
        </div>
      </div>

      {hasStarted && (
        <p role="alert" className="mb-3 text-xs font-semibold text-red-error">
          {startedLabel}
        </p>
      )}

      {/* Private classes are deferred to a later phase (bug sweep 2026-08-19) — `isPrivate` is
          always false at every call site today, so this never rendered anyway; kept commented
          rather than deleted so it can be restored by uncommenting when the feature ships.
      {isPrivate && !readOnly && (
        <div className="mb-3 space-y-2">
          <label className="block">
            <span className="mb-1 block text-xs text-gray-70">{L.requestedStartDate}</span>
            <input
              type="date"
              value={draft.requestedStartDate}
              min={minDate}
              onChange={(e) => setDraft((d) => ({ ...d, requestedStartDate: e.target.value }))}
              aria-label={`${L.requestedStartDate} for ${displayName}`}
              className="w-full cursor-pointer rounded border border-gray-50 p-1.5 text-sm"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-gray-70">{L.location}</span>
            <select
              value={draft.locationMode}
              onChange={(e) => {
                const mode = e.target.value as LocationMode;
                setDraft((d) => ({ ...d, locationMode: mode }));
                if (mode === 'at-location' && !draft.eventAddress) {
                  openAddressModal();
                }
              }}
              aria-label={`${L.location} for ${displayName}`}
              className="select-pos w-full cursor-pointer appearance-none rounded border border-gray-50 bg-white-00 px-3 py-1.5 text-sm"
            >
              <option value="">{L.locationChoose}</option>
              <option value="online">{L.locationOnline}</option>
              <option value="at-location">{L.locationAtLocation}</option>
            </select>
          </label>
          {draft.locationMode === 'at-location' && (
            <div className="text-xs">
              <span className="font-semibold text-black-100">{L.eventLocation}</span>
              <button
                type="button"
                onClick={openAddressModal}
                className="ml-2 cursor-pointer text-isc2-green underline"
              >
                {draft.eventAddress ? L.editAddress : L.selectAddress}
              </button>
              <div className="mt-0.5 text-gray-90">{draft.eventAddress || L.noAddress}</div>
            </div>
          )}
        </div>
      )}
      */}

      {readOnly ? (
        <div className={quantityRowClassName}>
          <span className="text-right text-xs text-gray-70">{quantityLabel}</span>
          {editableWhenReadOnly ? (
            <div className="flex shrink-0 items-center gap-2">
              {quantityInput}
              {updateButton(isBusy || hasStarted || qty === item.quantity)}
            </div>
          ) : (
            staticQuantity
          )}
        </div>
      ) : (
        <>
          <div className={clsx('mb-2', quantityRowClassName)}>
            <span className="text-right text-xs text-gray-70">{quantityLabel}</span>
            <div className="flex shrink-0 items-center gap-2">
              {canEditQuantity ? quantityInput : staticQuantity}
              {showUpdateButton &&
                updateButton(isBusy || hasStarted || !isDirty || !privateComplete)}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => onRemove(item)}
              disabled={isBusy}
              className="cursor-pointer text-xs text-gray-70 underline disabled:cursor-not-allowed disabled:opacity-50"
            >
              {removeLabel}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default B2BCartLineRow;
