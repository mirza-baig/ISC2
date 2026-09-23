import { Field, ImageField } from '@sitecore-jss/sitecore-jss-nextjs';
import { useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { getShortIsoDate, parseFieldsFromURLString } from 'utils/index';
import { filterOrdersForShopperContext } from 'utils/orderHistory';
import { PrintableOrder, OrderProduct } from 'types/index';
import useGetAllOrders from 'hooks/order/useGetAllOrders';
import { useLoggedUser, useIsBusinessBuyer, useOnEventOutside } from 'hooks/index';
import { useShopperContext } from 'providers/shopperContext';
import ChevronDownIcon from 'icons/ChevronDownIcon';
import Order from './Order';
import LoadingIndicator from 'ui/LoadingIndicator';
import OrderHistoryExportButton from './OrderHistoryExportButton';

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
  printReceiptCtaLabel?: string;
  accountNameLabel?: string;
  buyerNameLabel?: string;
  poNumberLabel?: string;
  customerOrderReferenceLabel?: string;
  searchPlaceholder?: string;
  sortNewestFirstLabel?: string;
  sortOldestFirstLabel?: string;
  filterBuyerLabel?: string;
  filterProductLabel?: string;
  filterPoNumberLabel?: string;
  filterOrderNumberLabel?: string;
  exportButtonLabel?: string;
  quantityLabel?: string;
  allFilterOptionLabel?: string;
  noFilterValuesLabel?: string;
  noMatchingOrdersMessage?: string;
  exportExcelCtaLabel?: string;
}

export const sitecoreOrderHistoryLabel = (
  labels: OrderHistoryPageLabels,
  key: keyof OrderHistoryPageLabels,
  fallback: string
) => {
  const value = labels[key];
  return value?.trim() || fallback;
};

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
  allOptionLabel,
  noValuesLabel,
}: {
  label: string;
  value: string;
  options: string[];
  onSelect: (next: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  allOptionLabel: string;
  noValuesLabel: string;
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
              {allOptionLabel}
            </button>
          </li>
          {options.length === 0 ? (
            <li className="px-3 py-1.5 text-xs text-gray-70">{noValuesLabel}</li>
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
  const { shopperContext } = useShopperContext();
  const contextOrders = useMemo(
    () => filterOrdersForShopperContext(orders, shopperContext),
    [orders, shopperContext]
  );

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
  const [sortNewestFirst, setSortNewestFirst] = useState(true);

  const filterOptions = useMemo(() => {
    if (!contextOrders) {
      return {
        buyer: [] as string[],
        product: [] as string[],
        po: [] as string[],
        customerRef: [] as string[],
        orderNumber: [] as string[],
      };
    }

    return {
      buyer: uniqueValues(contextOrders.map((order) => order.buyerFullName)),
      product: uniqueValues(
        contextOrders.flatMap((order) =>
          (order.products || []).map((product) => product.productItemName)
        )
      ),
      po: uniqueValues(contextOrders.map((order) => order.poNumber)),
      customerRef: uniqueValues(contextOrders.map((order) => order.customerOrderReference)),
      orderNumber: uniqueValues(contextOrders.map((order) => order.orderId || order.orderNumber)),
    };
  }, [contextOrders]);

  const filteredOrders = useMemo(() => {
    if (!contextOrders) return [];

    const query = searchQuery.trim().toLowerCase();

    return contextOrders.filter((order: PrintableOrder) => {
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
    contextOrders,
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

  const sortedOrders = useMemo(() => {
    const withIndex = filteredOrders.map((order, index) => ({ order, index }));
    withIndex.sort((a, b) => {
      const dateDiff =
        new Date(a.order.orderDate).getTime() - new Date(b.order.orderDate).getTime();
      const diff = sortNewestFirst ? -dateDiff : dateDiff;
      return diff !== 0 ? diff : a.index - b.index;
    });
    return withIndex.map(({ order }) => order);
  }, [filteredOrders, sortNewestFirst]);

  const ordersElements = useMemo(() => {
    return sortedOrders?.map((order: PrintableOrder) => {
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
  }, [fields.logo, orderLabels, sortedOrders, printLabels]);

  if (isGettingAllOrders || isGettingUser) {
    return <LoadingIndicator className="self-center" />;
  }

  const hasOrders = Boolean(contextOrders && contextOrders.length > 0);
  const searchPlaceholder = sitecoreOrderHistoryLabel(
    orderLabels,
    'searchPlaceholder',
    'Search orders...'
  );
  const allFilterOptionLabel = sitecoreOrderHistoryLabel(
    orderLabels,
    'allFilterOptionLabel',
    'All'
  );
  const noFilterValuesLabel = sitecoreOrderHistoryLabel(
    orderLabels,
    'noFilterValuesLabel',
    'No values'
  );
  const filterDropdownLabels = {
    allOptionLabel: allFilterOptionLabel,
    noValuesLabel: noFilterValuesLabel,
  };

  return (
    <section className="flex flex-col gap-5 mt-0!">
      <h2 className="text-sm-base sm:text-lg">{getOrderLabel(hasOrders)}</h2>
      {isBusinessBuyer && hasOrders && (
        <div className="flex items-center gap-2 flex-wrap mb-6">
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="text-xs px-2.5 py-1.5 rounded border border-gray-50 bg-input-disabled text-gray-90 outline-none min-w-40"
            aria-label={searchPlaceholder}
          />

          <FilterDropdown
            label={sitecoreOrderHistoryLabel(orderLabels, 'filterBuyerLabel', 'Buyer')}
            value={filterBuyer}
            options={filterOptions.buyer}
            onSelect={setFilterBuyer}
            isOpen={openFilter === 'buyer'}
            onToggle={() => toggleFilter('buyer')}
            {...filterDropdownLabels}
          />
          <FilterDropdown
            label={sitecoreOrderHistoryLabel(orderLabels, 'filterProductLabel', 'Product')}
            value={filterProduct}
            options={filterOptions.product}
            onSelect={setFilterProduct}
            isOpen={openFilter === 'product'}
            onToggle={() => toggleFilter('product')}
            {...filterDropdownLabels}
          />
          <FilterDropdown
            label={sitecoreOrderHistoryLabel(orderLabels, 'filterPoNumberLabel', 'PO Number')}
            value={filterPo}
            options={filterOptions.po}
            onSelect={setFilterPo}
            isOpen={openFilter === 'po'}
            onToggle={() => toggleFilter('po')}
            {...filterDropdownLabels}
          />
          <FilterDropdown
            label={sitecoreOrderHistoryLabel(
              orderLabels,
              'customerOrderReferenceLabel',
              'Customer Order Reference'
            )}
            value={filterCustomerRef}
            options={filterOptions.customerRef}
            onSelect={setFilterCustomerRef}
            isOpen={openFilter === 'customerRef'}
            onToggle={() => toggleFilter('customerRef')}
            {...filterDropdownLabels}
          />
          <FilterDropdown
            label={sitecoreOrderHistoryLabel(orderLabels, 'filterOrderNumberLabel', 'Order Number')}
            value={filterOrderNumber}
            options={filterOptions.orderNumber}
            onSelect={setFilterOrderNumber}
            isOpen={openFilter === 'orderNumber'}
            onToggle={() => toggleFilter('orderNumber')}
            {...filterDropdownLabels}
          />

          <button
            type="button"
            className="flex items-center gap-1 px-2.5 py-1 rounded text-xs cursor-pointer border border-gray-50 bg-transparent text-gray-70 ml-auto"
            onClick={() => setSortNewestFirst((current) => !current)}
            aria-label={
              sortNewestFirst
                ? sitecoreOrderHistoryLabel(
                    orderLabels,
                    'sortNewestFirstLabel',
                    'Date: Newest first'
                  )
                : sitecoreOrderHistoryLabel(
                    orderLabels,
                    'sortOldestFirstLabel',
                    'Date: Oldest first'
                  )
            }
          >
            {sortNewestFirst
              ? sitecoreOrderHistoryLabel(orderLabels, 'sortNewestFirstLabel', 'Date: Newest first')
              : sitecoreOrderHistoryLabel(
                  orderLabels,
                  'sortOldestFirstLabel',
                  'Date: Oldest first'
                )}
            <ChevronDownIcon
              size={10}
              className={clsx('text-gray-70', sortNewestFirst && 'rotate-180')}
            />
          </button>

          <OrderHistoryExportButton
            orders={sortedOrders}
            exportExcelCtaLabel={orderLabels.exportExcelCtaLabel}
          />
        </div>
      )}
      {hasOrders && filteredOrders.length === 0 ? (
        <p className="text-sm text-gray-70">
          {sitecoreOrderHistoryLabel(
            orderLabels,
            'noMatchingOrdersMessage',
            'No orders match the current filters.'
          )}
        </p>
      ) : (
        ordersElements
      )}
    </section>
  );
};

export default OrderHistory;
