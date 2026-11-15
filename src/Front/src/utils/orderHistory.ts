import type { OrderProduct, PrintableOrder, TypedMoney } from 'types/index';

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
  buyerContactId?: string;
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

const scaleSalesforceTotal = (order: RawPrintableOrder): TypedMoney => {
  const { orderTotal, subTotal } = order;
  const isSalesforceOrder = order.origin?.trim().toLowerCase() === 'salesforce';

  return isSalesforceOrder &&
    orderTotal &&
    subTotal &&
    orderTotal.fractionDigits < subTotal.fractionDigits
    ? { ...orderTotal, fractionDigits: subTotal.fractionDigits }
    : orderTotal;
};

export const normalizePrintableOrder = (order: RawPrintableOrder): PrintableOrder => ({
  ...order,
  orderTotal: scaleSalesforceTotal(order),
  accountId: firstText(order.accountId),
  accountName: firstText(
    order.accountName,
    order.organization,
    order.businessName,
    order.companyName
  ),
  buyerId: firstText(order.buyerId, order.buyerContactId),
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

const isSalesforceOrder = (order: PrintableOrder): boolean =>
  order.origin?.trim().toLowerCase() === 'salesforce';

const isSalesforceOrderShell = (order: PrintableOrder): boolean =>
  isCommercetoolsOrderNumber(order.orderId) && isSalesforceOrder(order);

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

const buyerNameTokens = (order: PrintableOrder): Set<string> =>
  new Set(
    (order.buyerFullName || '')
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(Boolean)
  );

const normalizedEmail = (order: PrintableOrder): string | undefined =>
  order.buyerEmail?.trim().toLowerCase() || undefined;

const sameBuyer = (left: PrintableOrder, right: PrintableOrder): boolean => {
  const leftEmail = normalizedEmail(left);
  const rightEmail = normalizedEmail(right);

  if (leftEmail && rightEmail) {
    return leftEmail === rightEmail;
  }

  const leftName = left.buyerFullName?.trim().toLowerCase();
  const rightName = right.buyerFullName?.trim().toLowerCase();

  if (!leftName || !rightName || leftName === rightName) {
    return true;
  }

  const leftTokens = buyerNameTokens(left);
  const rightTokens = buyerNameTokens(right);
  const [shorter, longer] =
    leftTokens.size <= rightTokens.size ? [leftTokens, rightTokens] : [rightTokens, leftTokens];

  return (
    [...shorter].every((token) => longer.has(token)) &&
    left.subTotal?.centAmount === right.subTotal?.centAmount
  );
};

const isUnpairedSalesforceShell = (
  order: PrintableOrder,
  orders: PrintableOrder[],
  consumedShells: Set<PrintableOrder>
): boolean => {
  if (consumedShells.has(order) || !isSalesforceOrderShell(order)) {
    return false;
  }

  return orders.some(
    (candidate) =>
      candidate !== order &&
      commerceToolsOrderIdFrom(candidate) &&
      candidate.orderDate === order.orderDate &&
      sameBuyer(candidate, order) &&
      sharesProduct(candidate, order)
  );
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
        sameBuyer(candidate, order) &&
        sharesProduct(candidate, order)
    );

    if (!shell) {
      return preferCommerceToolsOrderId(order);
    }

    consumedShells.add(shell);
    return preferCommerceToolsOrderId(order);
  });

  const commerceToolsOrderIds = new Set(
    paidOrders.filter((order) => !isSalesforceOrder(order)).map(({ orderId }) => orderId)
  );
  const salesforceBuyerNames = new Map(
    paidOrders
      .filter((order) => isSalesforceOrder(order) && order.buyerFullName)
      .map((order) => [order.orderId, order.buyerFullName])
  );

  return paidOrders
    .filter(
      (order) =>
        !consumedShells.has(order) &&
        !isUnpairedSalesforceShell(order, paidOrders, consumedShells) &&
        !(isSalesforceOrder(order) && commerceToolsOrderIds.has(order.orderId))
    )
    .map((order) => {
      const buyerFullName = isSalesforceOrder(order)
        ? undefined
        : salesforceBuyerNames.get(order.orderId);

      return buyerFullName ? { ...order, buyerFullName } : order;
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
