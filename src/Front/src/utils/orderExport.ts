import { PrintableOrder, TypedMoney } from 'types/index';

import { getCurrencySymbol } from './currencies';
import { getShortIsoDate } from './date';

/**
 * The Order History export, one row per order.
 *
 * Columns are fixed and in the order the story lists them. `Organization` and `Buyer` are
 * not part of the orders payload, so they are passed in from the shopper context and the
 * logged-in user. `PO Number` and `Customer Order Reference` are optional on
 * `PrintableOrder` because `salesforceGetOrders` does not return them yet — the columns
 * are written either way so the file shape does not change once it does.
 */
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

/** Columns holding one line per product, so the two stay readable side by side. */
const MULTILINE_COLUMN_KEYS: string[] = ['products', 'productQuantities'];

const WORKSHEET_NAME = 'Order History';
const FILE_NAME_PREFIX = 'Order-History';
const XLSX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export type OrderHistoryExportContext = {
  /** From the shopper context; blank when the user is not shopping for an organization. */
  organization?: string;
  /** The logged-in user's full name. */
  buyer?: string;
};

/**
 * Cent amounts as a real number so Excel can sum and sort them, rather than the display
 * string `parsePrice` builds for the page.
 */
const toAmount = (money?: TypedMoney) => {
  if (!money || typeof money.centAmount !== 'number') {
    return undefined;
  }

  return money.centAmount / Math.pow(10, money.fractionDigits || 0);
};

/** Currency number format for the money columns, e.g. `"$"#,##0.00`. */
const toCurrencyFormat = (money?: TypedMoney) => {
  const symbol = getCurrencySymbol(money?.currencyCode || '');
  const fractionDigits = money?.fractionDigits ?? 2;

  return `"${symbol}"#,##0${fractionDigits > 0 ? `.${'0'.repeat(fractionDigits)}` : ''}`;
};

const toExportRow = (order: PrintableOrder, { organization, buyer }: OrderHistoryExportContext) => {
  const products = order.products || [];

  return {
    organization: organization || '',
    buyer: buyer || '',
    poNumber: order.poNumber || '',
    customerOrderReference: order.customerOrderReference || '',
    orderNumber: order.orderId || '',
    orderDate: order.orderDate || '',
    tax: toAmount(order.tax),
    orderTotal: toAmount(order.orderTotal),
    orderStatus: order.orderStatus || '',
    products: products.map(({ productItemName }) => productItemName || '').join('\n'),
    productQuantities: products.map(({ productQuantity }) => productQuantity ?? '').join('\n'),
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

/**
 * Builds the Order History workbook from the orders already on the page and hands it to
 * the browser as a download.
 *
 * ExcelJS is imported dynamically — it is a large dependency and nothing else on the My
 * Account page needs it, so it stays out of the initial bundle until the user exports.
 */
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

    row.getCell('tax').numFmt = toCurrencyFormat(order.tax);
    row.getCell('orderTotal').numFmt = toCurrencyFormat(order.orderTotal);
  });

  const buffer = await workbook.xlsx.writeBuffer();

  downloadWorkbook(buffer, `${FILE_NAME_PREFIX}-${getShortIsoDate(new Date())}.xlsx`);
};
