import { PrintableOrder, TypedMoney } from 'types/index';

import { getCurrencySymbol } from './currencies';
import { getShortIsoDate } from './date';

const EXPORT_COLUMNS = [
  { header: 'Organization', key: 'organization', width: 30 },
  { header: 'Buyer', key: 'buyer', width: 26 },
  { header: 'PO Number', key: 'poNumber', width: 18 },
  { header: 'Customer Order Reference', key: 'customerOrderReference', width: 28 },
  { header: 'Order Number', key: 'orderNumber', width: 18 },
  { header: 'Date', key: 'orderDate', width: 14 },
  { header: 'Tax', key: 'tax', width: 14 },
  { header: 'Order Total', key: 'orderTotal', width: 16 },
  { header: 'Order Status', key: 'orderStatus', width: 18 },
  { header: 'Products', key: 'products', width: 46 },
  { header: 'Product Quantities', key: 'productQuantities', width: 20 },
] as const;

const MULTILINE_COLUMN_KEYS: string[] = ['products', 'productQuantities'];

const NOT_AVAILABLE = 'N/A';

const WORKSHEET_NAME = 'Order History';
const FILE_NAME_PREFIX = 'Order-History';
const XLSX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export type OrderHistoryExportContext = {
  organization?: string;
  buyer?: string;
};

const orNotAvailable = (value?: string | number | null) => {
  const text = value === undefined || value === null ? '' : String(value).trim();

  return text || NOT_AVAILABLE;
};

const toAmount = (money?: TypedMoney) => {
  if (!money || typeof money.centAmount !== 'number') {
    return undefined;
  }

  return money.centAmount / Math.pow(10, money.fractionDigits || 0);
};

const toCurrencyFormat = (money?: TypedMoney) => {
  const symbol = getCurrencySymbol(money?.currencyCode || '');
  const fractionDigits = money?.fractionDigits ?? 2;

  return `"${symbol}"#,##0${fractionDigits > 0 ? `.${'0'.repeat(fractionDigits)}` : ''}`;
};

const toExportRow = (order: PrintableOrder, { organization, buyer }: OrderHistoryExportContext) => {
  const products = order.products || [];

  const tax = toAmount(order.tax);
  const orderTotal = toAmount(order.orderTotal);

  return {
    organization: orNotAvailable(organization),
    buyer: orNotAvailable(buyer),
    poNumber: orNotAvailable(order.poNumber),
    customerOrderReference: orNotAvailable(order.customerOrderReference),
    orderNumber: orNotAvailable(order.orderId),
    orderDate: orNotAvailable(order.orderDate),
    tax: tax ?? NOT_AVAILABLE,
    orderTotal: orderTotal ?? NOT_AVAILABLE,
    orderStatus: orNotAvailable(order.orderStatus),
    products: products.length
      ? products.map(({ productItemName }) => orNotAvailable(productItemName)).join('\n')
      : NOT_AVAILABLE,
    productQuantities: products.length
      ? products.map(({ productQuantity }) => orNotAvailable(productQuantity)).join('\n')
      : NOT_AVAILABLE,
  };
};

const downloadWorkbook = (buffer: ArrayBuffer, fileName: string) => {
  const url = URL.createObjectURL(new Blob([buffer], { type: XLSX_MIME_TYPE }));
  const link = document.createElement('a');

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

export const exportOrderHistoryToExcel = async (
  orders: PrintableOrder[],
  context: OrderHistoryExportContext = {}
) => {
  const { Workbook } = await import('exceljs');

  const workbook = new Workbook();
  const worksheet = workbook.addWorksheet(WORKSHEET_NAME);

  worksheet.columns = EXPORT_COLUMNS.map(({ header, key, width }) => ({ header, key, width }));

  worksheet.getRow(1).font = { bold: true };

  orders.forEach((order) => {
    const row = worksheet.addRow(toExportRow(order, context));

    MULTILINE_COLUMN_KEYS.forEach((key) => {
      row.getCell(key).alignment = { wrapText: true, vertical: 'top' };
    });
    if (typeof row.getCell('tax').value === 'number') {
      row.getCell('tax').numFmt = toCurrencyFormat(order.tax);
    }

    if (typeof row.getCell('orderTotal').value === 'number') {
      row.getCell('orderTotal').numFmt = toCurrencyFormat(order.orderTotal);
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();

  downloadWorkbook(buffer, `${FILE_NAME_PREFIX}-${getShortIsoDate(new Date())}.xlsx`);
};
