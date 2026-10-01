import type { OrderProduct, PrintableOrder } from 'types/index';

type ShopperOrganizationRef = {
  id: string;
  name: string;
};

type ShopperContextForOrders = {
  type: 'myself' | 'organization';
  organization?: ShopperOrganizationRef | null;
} | null;

type RawOrderProduct = OrderProduct & {
  quantity?: number;
};

type RawPrintableOrder = Omit<PrintableOrder, 'products'> & {
  businessName?: string;
  companyName?: string;
  userName?: string;
  organization?: string;
  buyer?: string;
  products?: RawOrderProduct[];
};

const hasText = (value?: string): boolean => Boolean(value?.trim());

const normalizeText = (value?: string): string | undefined => {
  const trimmedValue = value?.trim();
  if (!trimmedValue) {
    return undefined;
  }

  const hasWrappingQuotes =
    (trimmedValue.startsWith('"') && trimmedValue.endsWith('"')) ||
    (trimmedValue.startsWith("'") && trimmedValue.endsWith("'"));

  return hasWrappingQuotes ? trimmedValue.slice(1, -1).trim() || undefined : trimmedValue;
};

const firstText = (...values: Array<string | undefined>): string | undefined =>
  values.map(normalizeText).find((value) => Boolean(value));

const toQuantity = (value: unknown): number => {
  const quantity = Number(value);
  return Number.isFinite(quantity) ? quantity : 0;
};

export const normalizePrintableOrder = (order: RawPrintableOrder): PrintableOrder => ({
  ...order,
  accountId: firstText(order.accountId),
  accountName: firstText(
    order.accountName,
    order.organization,
    order.businessName,
    order.companyName
  ),
  buyerId: firstText(order.buyerId),
  buyerFullName: firstText(order.buyerFullName, order.buyer, order.userName),
  buyerEmail: firstText(order.buyerEmail),
  poNumber: firstText(order.poNumber),
  customerOrderReference: firstText(order.customerOrderReference),
  products: (order.products || []).map((product) => ({
    ...product,
    productQuantity: toQuantity(product.productQuantity ?? product.quantity),
  })),
});

export const isOrganizationOrder = (order: PrintableOrder): boolean =>
  hasText(order.accountId) ||
  hasText(order.accountName) ||
  hasText(order.buyerId) ||
  hasText(order.buyerFullName) ||
  hasText(order.poNumber) ||
  hasText(order.customerOrderReference);

const matchesSelectedOrganization = (
  order: PrintableOrder,
  organization: ShopperOrganizationRef
): boolean => {
  const accountId = order.accountId?.trim();
  if (accountId && accountId === organization.id) {
    return true;
  }

  const accountName = order.accountName?.trim();
  if (!accountName) {
    return false;
  }

  return accountName.toLowerCase() === organization.name.trim().toLowerCase();
};

const hasAccountTaggedOrder = (orders: PrintableOrder[]): boolean =>
  orders.some((order) => hasText(order.accountId) || hasText(order.accountName));

const SALESFORCE_TEMPORARY_ORDER_NUMBER = /^14\d{16,}$/;
const COMMERCETOOLS_ORDER_NUMBER = /^0\d{5,9}$/;

const isSalesforceTemporaryOrderNumber = (orderId?: string): boolean =>
  SALESFORCE_TEMPORARY_ORDER_NUMBER.test(orderId?.trim() || '');

const isCommercetoolsOrderNumber = (orderId?: string): boolean =>
  COMMERCETOOLS_ORDER_NUMBER.test(orderId?.trim() || '');

const commerceToolsOrderIdFrom = (order: PrintableOrder): string | undefined =>
  [order.orderNumber, order.orderId, order.orderReferenceNumber, order.customerOrderReference]
    .map(normalizeText)
    .find((value) => value && isSalesforceTemporaryOrderNumber(value));

export const preferCommerceToolsOrderId = (order: PrintableOrder): PrintableOrder => {
  const orderId = commerceToolsOrderIdFrom(order);
  return orderId && orderId !== order.orderId ? { ...order, orderId } : order;
};

const isSalesforceOrderShell = (order: PrintableOrder): boolean =>
  isCommercetoolsOrderNumber(order.orderId) && order.origin?.trim().toLowerCase() === 'salesforce';

const normalizeProductName = (value?: string): string =>
  (value || '')
    .toLowerCase()
    .replace(/\(.*?\)/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const productNames = (order: PrintableOrder): Set<string> =>
  new Set(
    (order.products || [])
      .map((product) => normalizeProductName(product.productItemName))
      .filter(Boolean)
  );

const sharesProduct = (left: PrintableOrder, right: PrintableOrder): boolean => {
  const rightNames = [...productNames(right)];

  for (const leftName of productNames(left)) {
    if (
      rightNames.some(
        (rightName) =>
          leftName === rightName || leftName.includes(rightName) || rightName.includes(leftName)
      )
    ) {
      return true;
    }
  }

  return false;
};

const withoutOrganizationTags = (order: PrintableOrder): PrintableOrder => ({
  ...order,
  accountId: undefined,
  accountName: undefined,
  buyerId: undefined,
  buyerFullName: undefined,
  buyerEmail: undefined,
  organization: undefined,
  buyer: undefined,
  poNumber: undefined,
  customerOrderReference: undefined,
});

const isUnpairedSalesforceShell = (
  order: PrintableOrder,
  orders: PrintableOrder[],
  consumedShells: Set<PrintableOrder>
): boolean => {
  if (consumedShells.has(order) || !isSalesforceOrderShell(order)) {
    return false;
  }

  const total = order.orderTotal?.centAmount;
  if (typeof total === 'number' && total !== 0) {
    return orders.some(
      (candidate) =>
        candidate !== order &&
        commerceToolsOrderIdFrom(candidate) &&
        candidate.orderDate === order.orderDate &&
        sharesProduct(candidate, order)
    );
  }

  return true;
};

export const collapseSalesforceOrderShells = (orders: PrintableOrder[]): PrintableOrder[] => {
  const consumedShells = new Set<PrintableOrder>();

  const paidOrders = orders.map((order) => {
    if (!commerceToolsOrderIdFrom(order)) {
      return preferCommerceToolsOrderId(order);
    }

    const shell = orders.find(
      (candidate) =>
        candidate !== order &&
        !consumedShells.has(candidate) &&
        isSalesforceOrderShell(candidate) &&
        candidate.orderDate === order.orderDate &&
        sharesProduct(candidate, order)
    );

    if (!shell) {
      return preferCommerceToolsOrderId(order);
    }

    consumedShells.add(shell);
    return preferCommerceToolsOrderId(order);
  });

  return paidOrders
    .filter(
      (order) =>
        !consumedShells.has(order) && !isUnpairedSalesforceShell(order, paidOrders, consumedShells)
    )
    .map((order) => {
      const withCommerceToolsId = preferCommerceToolsOrderId(order);

      if (
        commerceToolsOrderIdFrom(withCommerceToolsId) &&
        withCommerceToolsId.origin?.trim().toLowerCase() === 'salesforce'
      ) {
        return withoutOrganizationTags(withCommerceToolsId);
      }

      return withCommerceToolsId;
    });
};

export const filterOrdersForShopperContext = (
  orders: PrintableOrder[],
  shopperContext: ShopperContextForOrders
): PrintableOrder[] => {
  if (!shopperContext) {
    return orders;
  }

  if (shopperContext.type === 'myself') {
    return orders.filter((order) => !isOrganizationOrder(order));
  }

  const selectedOrganization = shopperContext.organization;
  if (!selectedOrganization) {
    return orders.filter((order) => isOrganizationOrder(order));
  }

  if (hasAccountTaggedOrder(orders)) {
    return orders.filter(
      (order) =>
        matchesSelectedOrganization(order, selectedOrganization) ||
        (!hasText(order.accountId) && !hasText(order.accountName) && isOrganizationOrder(order))
    );
  }

  return orders.filter((order) => isOrganizationOrder(order));
};
