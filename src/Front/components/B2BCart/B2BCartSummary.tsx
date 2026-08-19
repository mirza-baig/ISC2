import type { ReactNode } from 'react';
import clsx from 'clsx';

import { CartSummaryPrices } from 'ui/index';

import { useB2BCartLabels } from '../Search/B2BPrivateClassContext';

export interface B2BCartSummaryProps {
  showTaxes: boolean;
  checkoutBlocked: boolean;
  onCheckout: () => void;
  coupon?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

const B2BCartSummary = ({
  showTaxes,
  checkoutBlocked,
  onCheckout,
  coupon,
  footer,
  className,
}: B2BCartSummaryProps): JSX.Element => {
  const labels = useB2BCartLabels();

  return (
    <section
      className={clsx(
        'flex flex-col rounded-lg border border-gray-70 bg-white px-6 py-8 md:p-10',
        className
      )}
    >
      <h3 className="text-2xl font-light mb-3 md:mb-8 md:headline-m">{labels.orderSummary}</h3>

      {coupon}

      <div className="flex flex-col gap-3 md:gap-2 !mb-4 !mt-5">
        <CartSummaryPrices
          labels={{
            subtotalLabel: labels.subtotal,
            taxLabel: labels.taxes,
            taxTbd: labels.taxesTbd,
            totalLabel: labels.total,
          }}
          showTaxes={showTaxes}
        />
      </div>

      <div className="flex flex-col items-center gap-4 mt-4 md:gap-2 md:mt-8">
        <button
          type="button"
          onClick={onCheckout}
          disabled={checkoutBlocked}
          title={checkoutBlocked ? labels.checkoutBlocked : undefined}
          aria-label={labels.checkout}
          className={clsx(
            'primary-cta tracking-link flex w-full justify-center',
            checkoutBlocked && 'opacity-50 pointer-events-none cursor-default'
          )}
        >
          {labels.checkout}
        </button>

        {checkoutBlocked && (
          <p className="text-center text-xs font-semibold text-red-error">
            {labels.checkoutBlocked}
          </p>
        )}

        {footer}
      </div>
    </section>
  );
};

export default B2BCartSummary;
