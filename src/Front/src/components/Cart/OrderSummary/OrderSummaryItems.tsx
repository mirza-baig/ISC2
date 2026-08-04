import { useCart } from 'providers/index';

import { OrderSummaryLineItem } from './OrderSummaryLineItem';

export namespace OrderSummaryItems {
  export type Props = {
    productNotAvailableLabel: string;
    userPriceLabel: string;
    orderDetailsMode?: boolean;
  };
}

export const OrderSummaryItems = ({
  productNotAvailableLabel,
  userPriceLabel,
  orderDetailsMode,
}: OrderSummaryItems.Props) => {
  const { activeCart } = useCart();

  if (!activeCart?.lineItems) {
    return null;
  }

  return (
    <div className="pb-4 border-b border-gray-50">
      <ul className="flex flex-col gap-3 max-h-80 overflow-y-auto divide-y divide-gray-30">
        {activeCart.lineItems.map((lineItem) => (
          <OrderSummaryLineItem
            key={lineItem.id}
            lineItem={lineItem}
            userPriceLabel={userPriceLabel}
            productNotAvailableLabel={productNotAvailableLabel}
            orderDetailsMode={orderDetailsMode}
          />
        ))}
      </ul>
    </div>
  );
};
