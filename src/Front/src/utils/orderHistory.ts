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

const orderQuantities = (order: PrintableOrder): number[] => [
  ...(order.products || []).map((product) => toQuantity(product.productQuantity)),
  ...(order.lineItems || []).map((lineItem) => toQuantity(lineItem.quantity)),
];

export const isOrganizationOrder = (order: PrintableOrder): boolean => {
  if (orderQuantities(order).some((quantity) => quantity > 1)) {
    return true;
  }

  return (
    hasText(order.accountId) ||
    hasText(order.accountName) ||
    hasText(order.buyerId) ||
    hasText(order.buyerFullName) ||
    hasText(order.poNumber) ||
    hasText(order.customerOrderReference)
  );
};

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

const isSalesforceOrderShell = (order: PrintableOrder): boolean =>
  isCommercetoolsOrderNumber(order.orderId) && order.origin?.trim().toLowerCase() === 'salesforce';

const productNames = (order: PrintableOrder): Set<string> =>
  new Set(
    (order.products || [])
      .map((product) => product.productItemName?.trim().toLowerCase())
      .filter((name): name is string => Boolean(name))
  );

const sharesProduct = (left: PrintableOrder, right: PrintableOrder): boolean => {
  const rightNames = productNames(right);

  for (const name of productNames(left)) {
    if (rightNames.has(name)) {
      return true;
    }
  }

  return false;
};

const withShellAccount = (order: PrintableOrder, shell: PrintableOrder): PrintableOrder => ({
  ...order,
  accountId: firstText(order.accountId, shell.accountId),
  accountName: firstText(order.accountName, shell.accountName),
  buyerId: firstText(order.buyerId, shell.buyerId),
  buyerFullName: firstText(order.buyerFullName, shell.buyerFullName),
  buyerEmail: firstText(order.buyerEmail, shell.buyerEmail),
  organization: firstText(order.organization, shell.organization),
  buyer: firstText(order.buyer, shell.buyer),
  poNumber: firstText(order.poNumber, shell.poNumber),
  customerOrderReference: firstText(order.customerOrderReference, shell.customerOrderReference),
});

export const collapseSalesforceOrderShells = (orders: PrintableOrder[]): PrintableOrder[] => {
  const consumedShells = new Set<PrintableOrder>();

  const paidOrders = orders.map((order) => {
    if (!isSalesforceTemporaryOrderNumber(order.orderId)) {
      return order;
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
      return order;
    }

    consumedShells.add(shell);
    return withShellAccount(order, shell);
  });

  return paidOrders.filter((order) => !consumedShells.has(order));
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
