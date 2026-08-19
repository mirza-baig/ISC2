import { useMemo } from 'react';

import { parsePrice } from 'utils/index';
import { useCart } from 'providers/index';

import { LineItemPrice } from './LineItemPrice';
import { FREE_PRICE } from 'constants/index';

export namespace CartSummaryPrices {
  export type Props = {
    labels: {
      totalLabel?: string;
      subtotalLabel: string;
      taxLabel?: string;
      taxTbd: string;
    };
    showTaxes?: boolean;
  };
}

export const CartSummaryPrices = ({ labels, showTaxes }: CartSummaryPrices.Props) => {
  const { activeCart, isFreeOrder } = useCart();

  const taxes = useMemo(() => {
    if (isFreeOrder) {
      return FREE_PRICE;
    }

    if (showTaxes && activeCart.taxedPrice) {
      return activeCart.computed.taxValue;
    }

    return undefined;
  }, [activeCart.computed.taxValue, activeCart.taxedPrice, isFreeOrder, showTaxes]);

  return (
    <>
      <div className="space-y-2 w-full">
        <LineItemPrice
          title={labels?.subtotalLabel.replace('{0}', activeCart.computed.itemsQuantity.toString())}
          value={activeCart.computed.subtotal.toFixed(2)}
          currency={activeCart.computed.currencySymbol}
        />

        <LineItemPrice
          title={labels?.taxLabel}
          value={taxes}
          currency={activeCart.computed.currencySymbol}
          taxTbdLabel={labels?.taxTbd}
        />

        {activeCart.discountOnTotalPrice?.includedDiscounts.map(
          ({ discount, discountedAmount }) => (
            <LineItemPrice
              key={discount.id || discount.name}
              title={discount.name}
              value={parsePrice(discountedAmount.centAmount, discountedAmount.fractionDigits)}
              currency={activeCart.computed.currencySymbol}
              type="discount"
            />
          )
        )}
      </div>

      {labels?.totalLabel && (
        <div className="border-t border-gray-50 px-2 py-3 !font-bold bg-black-05 flex items-center justify-between">
          <LineItemPrice
            textClassName="body-l font-bold text-gray-90"
            title={labels?.totalLabel}
            value={activeCart.computed.totalPrice!}
            currency={activeCart.computed.currencySymbol}
          />
        </div>
      )}
    </>
  );
};
