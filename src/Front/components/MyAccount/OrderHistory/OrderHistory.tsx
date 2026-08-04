import { Field, ImageField } from '@sitecore-jss/sitecore-jss-nextjs';
import { useMemo } from 'react';
import { getShortIsoDate, parseFieldsFromURLString } from 'utils/index';
import { PrintableOrder, OrderProduct } from 'types/index';
import useGetAllOrders from 'hooks/order/useGetAllOrders';
import Order from './Order';
import LoadingIndicator from 'ui/LoadingIndicator';
import { useLoggedUser } from 'hooks/index';

interface OrderHistoryPageProps {
  fields: {
    orderListLabelsAndMore: Field<string>;
    orderPrintLabelsAndMore: Field<string>;
    logo: ImageField;
  };
}

export interface OrderHistoryPageLabels {
  orderHistoryIntroMessage: string;
  orderLabel: string;
  noOrderMessage: string;
  dateLabel: string;
  paymentLabel: string;
  orderTotalLabel: string;
  printInvoiceCtaLabel: string;
  viewMoreCtaLabel: string;
  viewLessCtaLabel: string;
  shippedByLabel: string;
}

export interface OrderPrintLabels {
  nameLabel: string;
  addressLabel: string;
  cityLabel: string;
  regionLabel: string;
  postcodeLabel: string;
  countryLabel: string;
  emailLabel: string;
  productLabel: string;
  quantityLabel: string;
  priceLabel: string;
  amountLabel: string;
  taxLabel: string;
  subTotalLabel: string;
  totalLabel: string;
  billingAddress: string;
  mailingAddress: string;
}

const OrderHistory = ({ fields }: OrderHistoryPageProps) => {
  const { orders, isGettingAllOrders } = useGetAllOrders();
  const { isGettingUser } = useLoggedUser();

  const orderLabels = useMemo(
    () => parseFieldsFromURLString<OrderHistoryPageLabels>(fields?.orderListLabelsAndMore),
    [fields?.orderListLabelsAndMore]
  );

  const printLabels = useMemo(
    () => parseFieldsFromURLString<OrderPrintLabels>(fields?.orderPrintLabelsAndMore),
    [fields?.orderPrintLabelsAndMore]
  );

  const getOrderLabel = (hasOrders: boolean) => {
    return hasOrders
      ? orderLabels.orderHistoryIntroMessage.replace(
          '{currentDate}',
          getShortIsoDate(new Date(), '/')
        )
      : orderLabels.noOrderMessage;
  };

  const ordersElements = useMemo(() => {
    return orders?.map((order: PrintableOrder) => {
      const lineItems = {
        lineItems: order.products?.map((product: OrderProduct) => {
          const formatedLineItem = {
            name: product.productItemName,
            labels: [] as string[],
            price: product.productItemPrice,
            quantity: product.productQuantity,
          };

          if (product.shippedBy && product.productItemDescription) {
            formatedLineItem.labels.push(
              `${product.productItemDescription} | ${orderLabels.shippedByLabel} ${product.shippedBy}`
            );
          } else if (product.productItemDescription) {
            formatedLineItem.labels.push(`${product.productItemDescription}`);
          }

          if (product.productItemSchedule) {
            formatedLineItem.labels.push(product.productItemSchedule);
          }

          return formatedLineItem;
        }),
      };

      return (
        <Order
          key={order?.orderId}
          fields={{
            order: { ...order, ...lineItems },
            orderLabels,
            printLabels,
            logo: fields.logo,
          }}
        />
      );
    });
  }, [fields.logo, orderLabels, orders, printLabels]);

  if (isGettingAllOrders || isGettingUser) {
    return <LoadingIndicator className="self-center" />;
  }

  return (
    <section className="flex flex-col gap-5 mt-0!">
      <h2 className="text-sm-base sm:text-lg">{getOrderLabel(orders && orders.length > 0)}</h2>
      {ordersElements}
    </section>
  );
};

export default OrderHistory;
