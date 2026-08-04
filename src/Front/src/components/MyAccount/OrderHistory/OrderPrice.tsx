import { TypedMoney } from 'types/index';
import { OrderPrintLabels } from './OrderHistory';
import { getCurrencySymbol, parsePriceFromMoney } from 'utils/index';
import { useMemo } from 'react';

interface OrderPriceProps {
  fields: {
    tax?: TypedMoney;
    subTotal?: TypedMoney;
    orderTotal: TypedMoney;
    labels: OrderPrintLabels;
  };
}

const OrderPrice = ({ fields }: OrderPriceProps) => {
  const { labels, tax, subTotal, orderTotal } = fields;

  const fallbackValue = useMemo(() => {
    return {
      centAmount: 0,
      fractionDigits: orderTotal.fractionDigits,
    } as TypedMoney;
  }, [orderTotal]);

  return (
    <div className="w-full p-5 text-base text-right">
      <div className="space-x-1">
        <strong>{labels.subTotalLabel}:</strong>
        <span className="space-x-0.5">
          <span>{getCurrencySymbol(orderTotal.currencyCode)}</span>
          <span>{parsePriceFromMoney(subTotal ?? fallbackValue, 1, false)}</span>
        </span>
      </div>
      <div className="space-x-1">
        <strong>{labels.taxLabel}:</strong>
        <span className="space-x-0.5">
          <span>{getCurrencySymbol(orderTotal.currencyCode)}</span>
          <span>{parsePriceFromMoney(tax ?? fallbackValue, 1, false)}</span>
        </span>
      </div>
      <div className="space-x-1">
        <strong>{labels.totalLabel}:</strong>
        <span className="space-x-0.5">
          <span>{getCurrencySymbol(orderTotal.currencyCode)}</span>
          <span>{parsePriceFromMoney(orderTotal, 1, false)}</span>
        </span>
      </div>
    </div>
  );
};

export default OrderPrice;
