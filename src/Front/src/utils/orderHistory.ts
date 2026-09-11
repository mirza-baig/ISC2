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
  products?: RawOrderProduct[];
};

const hasText = (value?: string): boolean => Boolean(value?.trim());

const firstText = (...values: Array<string | undefined>): string | undefined =>
  values.map((value) => value?.trim()).find((value) => Boolean(value));

const toQuantity = (value: unknown): number => {
  const quantity = Number(value);
  return Number.isFinite(quantity) ? quantity : 0;
};

export const normalizePrintableOrder = (order: RawPrintableOrder): PrintableOrder => ({
  ...order,
  accountId: firstText(order.accountId),
  accountName: firstText(order.accountName, order.businessName, order.companyName),
  buyerId: firstText(order.buyerId),
  buyerFullName: firstText(order.buyerFullName, order.userName),
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
    return orders.filter((order) => matchesSelectedOrganization(order, selectedOrganization));
  }

  return orders.filter((order) => isOrganizationOrder(order));
};
