import { ORDER_STATUS, STATUS_PILL_STYLES } from 'constants/account';

interface OrderStatusProps {
  fields: {
    orderStatus: string;
  };
}

const OrderStatus = ({ fields }: OrderStatusProps) => {
  const { orderStatus } = fields;

  switch (orderStatus.toLowerCase()) {
    case ORDER_STATUS.confirmed:
      return <span className={STATUS_PILL_STYLES.success}>{ORDER_STATUS.confirmed}</span>;
    case ORDER_STATUS.complete:
    case ORDER_STATUS.completed:
      return <span className={STATUS_PILL_STYLES.success}>{ORDER_STATUS.complete}</span>;
    case ORDER_STATUS.closed:
      return <span className={STATUS_PILL_STYLES.success}>{ORDER_STATUS.closed}</span>;
    case ORDER_STATUS.open:
      return <span className={STATUS_PILL_STYLES.success}>{ORDER_STATUS.open}</span>;
    case ORDER_STATUS.refunded:
      return <span className={STATUS_PILL_STYLES.success}>{ORDER_STATUS.refunded}</span>;
    case ORDER_STATUS.returned:
      return <span className={STATUS_PILL_STYLES.success}>{ORDER_STATUS.returned}</span>;
    case ORDER_STATUS.failed:
      return <span className={STATUS_PILL_STYLES.warning}>{ORDER_STATUS.failed}</span>;
    case ORDER_STATUS.cancelled:
      return <span className={STATUS_PILL_STYLES.warning}>{ORDER_STATUS.cancelled}</span>;
    default:
      console.error(`Order Status ${orderStatus} is not a valid/implemented status`);
      return <></>;
  }
};

export default OrderStatus;
