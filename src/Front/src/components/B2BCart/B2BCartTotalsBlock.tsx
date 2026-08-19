import { Fragment } from 'react';

import { useB2BCartLabels } from '../Search/B2BPrivateClassContext';

export type B2BCartCheckoutCta = {
  label?: string;
  disabled?: boolean;
  onClick?: () => void;
};

export type B2BCartDiscountDisplay = {
  key: string;
  label: string;
  display: string;
};

export interface B2BCartTotalsBlockProps {
  subtotalDisplay: string;
  taxesDisplay: string;
  totalDisplay: string;
  showTaxNote: boolean;
  checkoutBlocked: boolean;
  onCheckout: () => void;
  checkoutCta?: Pick<B2BCartCheckoutCta, 'label' | 'disabled'>;
  discounts?: B2BCartDiscountDisplay[];
}

const B2BCartTotalsBlock = ({
  subtotalDisplay,
  taxesDisplay,
  totalDisplay,
  showTaxNote,
  checkoutBlocked,
  onCheckout,
  checkoutCta,
  discounts,
}: B2BCartTotalsBlockProps): JSX.Element => {
  const labels = useB2BCartLabels();
  const ctaLabel = checkoutCta?.label?.trim() || labels.checkout;
  const ctaDisabled = checkoutBlocked || Boolean(checkoutCta?.disabled);

  return (
    <>
      <div className="flex items-end gap-6">
        <div className="ml-auto grid w-fit grid-cols-[auto_auto] gap-x-3 text-sm">
          <span className="text-gray-90">{labels.subtotal}</span>
          <span className="text-right text-black-100">{subtotalDisplay}</span>
          <span className="text-gray-90">{labels.taxes}</span>
          <span className="text-right text-gray-70">{taxesDisplay}</span>
          {discounts?.map(({ key, label, display }) => (
            <Fragment key={key}>
              <span className="text-gray-90">{label}</span>
              <span className="text-right text-discount before:content-['-'] before:mr-1">
                {display}
              </span>
            </Fragment>
          ))}
          <span className="text-base text-black-100">{labels.total}</span>
          <span className="text-right text-base font-bold text-black-100">{totalDisplay}</span>
        </div>
        <div className="shrink-0">
          <button
            type="button"
            onClick={onCheckout}
            disabled={ctaDisabled}
            title={checkoutBlocked ? labels.checkoutBlocked : undefined}
            aria-label={ctaLabel}
            className="rounded bg-dark-green px-5 py-3 text-sm font-semibold text-white-00 enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
          >
            {ctaLabel}
          </button>
        </div>
      </div>
      {checkoutBlocked && (
        <p className="mt-2.5 text-center text-xs font-semibold text-red-error">
          {labels.checkoutBlocked}
        </p>
      )}
      {showTaxNote && <p className="mt-2.5 text-center text-xs text-gray-70">{labels.taxNote}</p>}
    </>
  );
};

export default B2BCartTotalsBlock;
