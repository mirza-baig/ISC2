import { useRef, useState } from 'react';
import { OrderHistoryPageLabels, OrderPrintLabels } from './OrderHistory';
import { PrintableOrder } from 'types/index';
import { getCurrencySymbol, parsePrice } from 'utils/index';
import { ImageField } from '@sitecore-jss/sitecore-jss-nextjs';
import OrderLineItem from './OrderLineItem';
import OrderUserInformation from './OrderUserInformation';
import OrderPrice from './OrderPrice';
import OrderStatus from './OrderStatus';
import ChevronDownIcon from 'icons/ChevronDownIcon';
import clsx from 'clsx';
import OrderPrintButton from './OrderPrintButton';
import { useLoggedUser } from 'hooks/index';

type OrderHistoryComponentProps = {
  fields: {
    order: PrintableOrder;
    orderLabels: OrderHistoryPageLabels;
    printLabels: OrderPrintLabels;
    logo: ImageField;
  };
};

const Order = ({ fields }: OrderHistoryComponentProps) => {
  const { user } = useLoggedUser();
  const { order, orderLabels, printLabels, logo } = fields;
  const [isOpen, setIsOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const hasMoreThanOneLineItem = order.lineItems && order.lineItems.length > 1;

  const restLineItems = (order.lineItems || [])
    .slice(1, order.lineItems?.length)
    .map((lineItem, x) => (
      <OrderLineItem
        key={`lineitem-${order.orderId}-${x}`}
        fields={{
          ...lineItem,
          id: `${order.orderId}-${x}`,
          isHidden: !isOpen,
          quantityLabel: printLabels.quantityLabel,
        }}
      />
    ));

  const LogoContainer = () => {
    return logo.value?.src ? (
      <div className="hidden print:flex max-w-40 p-5">
        <img src={logo.value.src} alt={logo.value.alt?.toString()} />
      </div>
    ) : null;
  };

  const OrderInformation = () => {
    return (
      <div className="flex flex-col-reverse gap-y-3 sm:flex-row print:flex-row justify-between bg-gray-10 p-5">
        <div className="w-full space-y-2 print:space-y-5">
          <h5 className="text-lg sm:text-xl font-bold">{`${orderLabels.orderLabel} #${order.orderId}`}</h5>
          <div className="hidden print:flex">
            <OrderUserInformation order={order} labels={printLabels} />
          </div>
          <div className="flex flex-col sm:flex-row print:flex-col text-sm-base">
            {user?.fullName && (
              <div className="hidden print:flex space-x-1">
                <strong>{`${printLabels.nameLabel}: `}</strong>
                <span>{user?.fullName}</span>
              </div>
            )}
            {user?.email && (
              <div className="hidden print:flex space-x-1">
                <strong>{`${printLabels.emailLabel}: `}</strong>
                <span>{user?.email}</span>
              </div>
            )}
            <span className="sm:pr-4 print:pr-0">
              <strong>{`${orderLabels.dateLabel}: `}</strong>
              <span>{order.orderDate.replace(/-/g, '/')}</span>
            </span>
            {order.paymentType && (
              <span className="sm:px-4 sm:border-x print:px-0 print:border-none border-gray-50">
                <strong>{`${orderLabels.paymentLabel}: `}</strong>
                <span>{order.paymentType}</span>
              </span>
            )}
            <span
              className={clsx(
                'sm:pl-4 print:hidden',
                !Boolean(order.paymentType) && 'sm:border-s border-gray-50'
              )}
            >
              <strong>{`${orderLabels.orderTotalLabel}: `}</strong>
              <span className="space-x-0.5">
                <span>{getCurrencySymbol(order.orderTotal.currencyCode)}</span>
                <span>
                  {parsePrice(order.orderTotal.centAmount, order.orderTotal.fractionDigits)}
                </span>
              </span>
            </span>
          </div>
        </div>
        <div className="flex flex-row sm:w-48 sm:flex-col justify-between sm:space-y-3 sm:items-end">
          <OrderStatus fields={{ orderStatus: order.orderStatus }} />
          <div>
            <OrderPrintButton
              contentRef={contentRef}
              printInvoiceCtaLabel={orderLabels.printInvoiceCtaLabel}
            />
          </div>
        </div>
      </div>
    );
  };

  const OrderLineItems = () => {
    return order.lineItems && order.lineItems.length > 0 ? (
      <div className={'px-5'}>
        {/* Always display first lineItem, split rest for animation purpose */}
        <OrderLineItem
          fields={{
            ...order.lineItems[0],
            id: `${order.orderId}-0`,
            additionalClasses: clsx(!hasMoreThanOneLineItem && 'border-none'),
            quantityLabel: printLabels.quantityLabel,
          }}
        />
        {hasMoreThanOneLineItem && restLineItems && (
          <>
            <div className={clsx('print:open transition-height', isOpen && 'open')}>
              <div className="overflow-hidden">{restLineItems}</div>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsOpen((prevIsOpen) => !prevIsOpen);
              }}
              aria-label={isOpen ? orderLabels.viewLessCtaLabel : orderLabels.viewMoreCtaLabel}
              className="print:hidden cta secondary-cta text-sm-base my-5 py-2 px-5"
            >
              <span className="flex items-center gap-x-2">
                {isOpen ? orderLabels.viewLessCtaLabel : orderLabels.viewMoreCtaLabel}
                <ChevronDownIcon size={15} className={clsx(isOpen && 'rotate-180')} />
              </span>
            </button>
          </>
        )}
      </div>
    ) : null;
  };

  return (
    <div ref={contentRef} className="border border-gray-50 print:border-none rounded-lg">
      <LogoContainer />
      <OrderInformation />
      <OrderLineItems />
      <div className="hidden print:flex">
        <OrderPrice
          fields={{
            tax: order.tax,
            subTotal: order.subTotal,
            orderTotal: order.orderTotal,
            labels: printLabels,
          }}
        />
      </div>
    </div>
  );
};

export default Order;
