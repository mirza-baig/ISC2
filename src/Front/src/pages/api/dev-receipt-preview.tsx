
import { NextApiRequest, NextApiResponse } from 'next';
import { renderToBuffer } from '@react-pdf/renderer';

import { BusinessTransactionReceipt } from 'components/Order/BusinessTransactionReceipt';
import { BusinessReceiptData } from 'types/index';

const SAMPLE: BusinessReceiptData = {
  orderNumber: '142026081180789237',
  orderDate: 'August 11, 2026',
  orderStatus: 'Confirmed',
  currencyCode: 'USD',
  organizationName: 'OTP Training Partner Ltd',
  isc2EntityName: 'ISC2 Inc.',
  buyerName: 'Sam Guy',
  buyerEmail: 'sam.guy@businessco.ca',
  billingAddressLines: [
    '409A Northshore Dr, #05-238',
    'Singapore, Armed Forces Americas, 02360',
    'US',
  ],
  poNumber: 'PO-1234567890',
  customerOrderReference: 'Q4 security training',
  taxIdNumber: '98-7654321',
  intacctCustomerId: 'CUST-004821',
  lineItems: [
    {
      name: 'SSCP Online Instructor-Led',
      quantity: 2,
      listPrice: '$1900.00',
      discountedPrice: '$1710.00',
      subtotal: '$3420.00',
    },
    {
      name: 'CISSP Classroom Training',
      location: 'Chicago, IL — 123 Main Street',
      quantity: 1,
      listPrice: '$2400.00',
      subtotal: '$2400.00',
    },
    {
      name: 'CGRC Exam Voucher',
      quantity: 3,
      listPrice: '$599.00',
      subtotal: '$1797.00',
    },
  ],
  subtotal: '$7617.00',
  tax: '$0.00',
  total: '$7617.00',
  paymentMethod: 'Preapproved Credit',
};

/**
 * `?empty=1` drops every field that has no data source yet, showing what a receipt looks
 * like today: no organization, PO, reference, tax or Intacct identifiers.
 */
const withoutUnsourcedFields = (data: BusinessReceiptData): BusinessReceiptData => ({
  ...data,
  organizationName: undefined,
  isc2EntityName: undefined,
  poNumber: undefined,
  customerOrderReference: undefined,
  taxIdNumber: undefined,
  intacctCustomerId: undefined,
  lineItems: data.lineItems.map(({ location: _location, ...lineItem }) => lineItem),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const data = req.query.empty ? withoutUnsourcedFields(SAMPLE) : SAMPLE;
  const buffer = await renderToBuffer(<BusinessTransactionReceipt data={data} />);

  res.setHeader('Content-Type', 'application/pdf');
  res.send(buffer);
}
