import clsx from 'clsx';
import { TypedMoney } from 'types/index';
import { getCurrencySymbol, parsePrice } from 'utils/index';

interface OrderLineItemProps {
  fields: {
    id: string;
    name: string;
    price: TypedMoney;
    quantity?: number;
    labels: string[];
    isHidden?: boolean;
    additionalClasses?: string;
    quantityLabel: string;
  };
}

const OrderLineItem = ({ fields }: OrderLineItemProps) => {
  const {
    id,
    name,
    price,
    quantity = 0,
    labels,
    isHidden = false,
    quantityLabel,
    additionalClasses,
  } = fields;

  return (
    <div
      className={clsx(
        'flex flex-col sm:flex-row justify-between sm:mx-3 py-7.5 border-b border-gray-30',
        isHidden && 'overflow-hidden',
        additionalClasses
      )}
      aria-hidden={isHidden}
    >
      <div className="flex flex-col">
        <div className="space-y-2">
          <h6 className="text-sm-base sm:text-lg">{name}</h6>
          {labels?.length > 0 && (
            <div className="space-y-2">
              {labels.map((label, x) => (
                <div
                  key={`label-${id}-${x}`}
                  className="text-gray-90 text-xs sm:text-sm-base leading-5 sm:leading-6"
                >
                  {label}
                </div>
              ))}
            </div>
          )}
        </div>
        {quantity > 1 && (
          <div className="text-xs mt-3 sm:mt-5">{`${quantityLabel}: ${quantity}`}</div>
        )}
      </div>
      <div className="text-sm-base self-end sm:self-center font-bold space-x-0.5 mt-3 sm:mt-0">
        <span>{getCurrencySymbol(price.currencyCode)}</span>
        <span>{parsePrice(price.centAmount, price.fractionDigits)}</span>
      </div>
    </div>
  );
};

export default OrderLineItem;
