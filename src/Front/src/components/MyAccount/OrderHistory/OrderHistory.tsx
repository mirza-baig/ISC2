import { Field, ImageField } from '@sitecore-jss/sitecore-jss-nextjs';
import { useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { getShortIsoDate, parseFieldsFromURLString } from 'utils/index';
import { PrintableOrder, OrderProduct } from 'types/index';
import useGetAllOrders from 'hooks/order/useGetAllOrders';
import { useLoggedUser, useIsBusinessBuyer, useOnEventOutside } from 'hooks/index';
import ChevronDownIcon from 'icons/ChevronDownIcon';
import Order from './Order';
import LoadingIndicator from 'ui/LoadingIndicator';

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

type FilterKey = 'buyer' | 'product' | 'po' | 'customerRef' | 'orderNumber';

const uniqueValues = (values: Array<string | undefined>) =>
  Array.from(
    new Set(values.map((value) => (value || '').trim()).filter((value) => value.length > 0))
  ).sort((a, b) => a.localeCompare(b));

const includesFilter = (value: string | undefined, filter: string) =>
  !filter || (value || '').toLowerCase().includes(filter.toLowerCase());

const FilterDropdown = ({
  label,
  value,
  options,
  onSelect,
  isOpen,
  onToggle,
}: {
  label: string;
  value: string;
  options: string[];
  onSelect: (next: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useOnEventOutside(ref, ['mousedown', 'touchstart'], () => {
    if (isOpen) {
      onToggle();
    }
  });

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        className={clsx(
          'flex items-center gap-1 px-2.5 py-1 rounded text-xs cursor-pointer border border-gray-50 bg-transparent text-gray-70',
          value && 'border-isc2-green text-black-100'
        )}
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`Filter ${label}`}
      >
        {label}
        <ChevronDownIcon size={10} className={clsx('text-gray-70', isOpen && 'rotate-180')} />
      </button>
      {isOpen && (
        <ul
          role="listbox"
          aria-label={label}
          className="absolute left-0 top-full z-30 mt-1 max-h-60 min-w-44 overflow-auto rounded-lg border border-gray-50 bg-white-00 py-1 shadow-lg"
        >
          <li>
            <button
              type="button"
              role="option"
              aria-selected={!value}
              className={clsx(
                'block w-full cursor-pointer px-3 py-1.5 text-left text-xs',
                !value ? 'font-semibold text-isc2-green' : 'text-black-100 hover:bg-gray-10'
              )}
              onClick={() => {
                onSelect('');
                onToggle();
              }}
            >
              All
            </button>
          </li>
          {options.length === 0 ? (
            <li className="px-3 py-1.5 text-xs text-gray-70">No values</li>
          ) : (
            options.map((option) => (
              <li key={option}>
                <button
                  type="button"
                  role="option"
                  aria-selected={value === option}
                  className={clsx(
                    'block w-full cursor-pointer px-3 py-1.5 text-left text-xs',
                    value === option
                      ? 'font-semibold text-isc2-green'
                      : 'text-black-100 hover:bg-gray-10'
                  )}
                  onClick={() => {
                    onSelect(option);
                    onToggle();
                  }}
                >
                  {option}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};

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

  const isBusinessBuyer = useIsBusinessBuyer();

  const getOrderLabel = (hasOrders: boolean) => {
    return hasOrders
      ? orderLabels.orderHistoryIntroMessage.replace(
          '{currentDate}',
          getShortIsoDate(new Date(), '/')
        )
      : orderLabels.noOrderMessage;
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [filterBuyer, setFilterBuyer] = useState('');
  const [filterPo, setFilterPo] = useState('');
  const [filterCustomerRef, setFilterCustomerRef] = useState('');
  const [filterOrderNumber, setFilterOrderNumber] = useState('');
  const [filterProduct, setFilterProduct] = useState('');
  const [openFilter, setOpenFilter] = useState<FilterKey | null>(null);

  const filterOptions = useMemo(() => {
    if (!orders) {
      return {
        buyer: [] as string[],
        product: [] as string[],
        po: [] as string[],
        customerRef: [] as string[],
        orderNumber: [] as string[],
      };
    }

    return {
      buyer: uniqueValues(orders.map((order) => order.buyerFullName)),
      product: uniqueValues(
        orders.flatMap((order) => (order.products || []).map((product) => product.productItemName))
      ),
      po: uniqueValues(orders.map((order) => order.poNumber)),
      customerRef: uniqueValues(orders.map((order) => order.customerOrderReference)),
      orderNumber: uniqueValues(orders.map((order) => order.orderId || order.orderNumber)),
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    if (!orders) return [];

    const query = searchQuery.trim().toLowerCase();

    return orders.filter((order: PrintableOrder) => {
      const productNames = (order.products || [])
        .map((product) => product.productItemName || '')
        .join(' ');

      const matchesSearch = query
        ? [
            order.buyerFullName,
            order.poNumber,
            order.customerOrderReference,
            order.orderId,
            order.orderNumber,
            order.accountName,
            productNames,
          ]
            .join(' ')
            .toLowerCase()
            .includes(query)
        : true;

      return (
        matchesSearch &&
        includesFilter(order.buyerFullName, filterBuyer) &&
        includesFilter(order.poNumber, filterPo) &&
        includesFilter(order.customerOrderReference, filterCustomerRef) &&
        includesFilter(order.orderId || order.orderNumber, filterOrderNumber) &&
        includesFilter(productNames, filterProduct)
      );
    });
  }, [
    orders,
    searchQuery,
    filterBuyer,
    filterPo,
    filterCustomerRef,
    filterOrderNumber,
    filterProduct,
  ]);

  const toggleFilter = (key: FilterKey) => {
    setOpenFilter((current) => (current === key ? null : key));
  };

  const ordersElements = useMemo(() => {
    return filteredOrders?.map((order: PrintableOrder) => {
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
  }, [fields.logo, orderLabels, filteredOrders, printLabels]);

  if (isGettingAllOrders || isGettingUser) {
    return <LoadingIndicator className="self-center" />;
  }

  const hasOrders = Boolean(orders && orders.length > 0);

  return (
    <section className="flex flex-col gap-5 mt-0!">
      <h2 className="text-sm-base sm:text-lg">{getOrderLabel(hasOrders)}</h2>
      {isBusinessBuyer && hasOrders && (
        <div className="flex items-center gap-2 flex-wrap mb-6">
          <input
            type="text"
            placeholder="Search orders…"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="text-xs px-2.5 py-1.5 rounded border border-gray-50 bg-input-disabled text-gray-90 outline-none min-w-40"
            aria-label="Search orders"
          />

          <FilterDropdown
            label="Buyer"
            value={filterBuyer}
            options={filterOptions.buyer}
            onSelect={setFilterBuyer}
            isOpen={openFilter === 'buyer'}
            onToggle={() => toggleFilter('buyer')}
          />
          <FilterDropdown
            label="Product"
            value={filterProduct}
            options={filterOptions.product}
            onSelect={setFilterProduct}
            isOpen={openFilter === 'product'}
            onToggle={() => toggleFilter('product')}
          />
          <FilterDropdown
            label="PO Number"
            value={filterPo}
            options={filterOptions.po}
            onSelect={setFilterPo}
            isOpen={openFilter === 'po'}
            onToggle={() => toggleFilter('po')}
          />
          <FilterDropdown
            label="Customer Order Reference"
            value={filterCustomerRef}
            options={filterOptions.customerRef}
            onSelect={setFilterCustomerRef}
            isOpen={openFilter === 'customerRef'}
            onToggle={() => toggleFilter('customerRef')}
          />
          <FilterDropdown
            label="Order Number"
            value={filterOrderNumber}
            options={filterOptions.orderNumber}
            onSelect={setFilterOrderNumber}
            isOpen={openFilter === 'orderNumber'}
            onToggle={() => toggleFilter('orderNumber')}
          />

          <button
            type="button"
            disabled
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs ml-auto border border-gray-50 bg-gray-10 text-gray-70 cursor-not-allowed"
            title="Export generation in ITDEV-970"
          >
            <svg
              width="11"
              height="11"
              viewBox="0 0 16.5 16.5"
              fill="none"
              aria-hidden="true"
              className="mr-1"
            >
              <path
                d="M15 10.5V13.5C15 13.8978 14.842 14.2794 14.5607 14.5607C14.2794 14.842 13.8978 15 13.5 15H3C2.60218 15 2.22064 14.842 1.93934 14.5607C1.65804 14.2794 1.5 13.8978 1.5 13.5V10.5M12 6.75L8.25 10.5L4.5 6.75M8.25 10.5V1.5"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
              />
            </svg>
            Export to Excel
          </button>
        </div>
      )}
      {hasOrders && filteredOrders.length === 0 ? (
        <p className="text-sm text-gray-70">No orders match the current filters.</p>
      ) : (
        ordersElements
      )}
    </section>
  );
};

export default OrderHistory;
