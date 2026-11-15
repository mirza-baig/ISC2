import { renderToStaticMarkup } from 'react-dom/server';

import OrderLineItem from 'components/MyAccount/OrderHistory/OrderLineItem';

jest.mock('utils/index', () => ({
  getCurrencySymbol: () => '$',
  parsePrice: (centAmount: number) => (centAmount / 100).toFixed(2),
}));

const renderLineItem = (quantity: number, showQuantity?: boolean) =>
  renderToStaticMarkup(
    <OrderLineItem
      fields={{
        id: 'order-1-0',
        name: 'CISSP Exam',
        price: { centAmount: 74900, currencyCode: 'USD', fractionDigits: 2 } as never,
        quantity,
        labels: [],
        quantityLabel: 'Quantity',
        showQuantity,
      }}
    />
  );

describe('OrderLineItem quantity', () => {
  it('hides a single quantity for individual buyers', () => {
    expect(renderLineItem(1)).not.toContain('Quantity: 1');
  });

  it('shows quantities above one for individual buyers', () => {
    expect(renderLineItem(3)).toContain('Quantity: 3');
  });

  it('shows a single quantity for business buyers', () => {
    expect(renderLineItem(1, true)).toContain('Quantity: 1');
  });

  it('hides a zero quantity for business buyers', () => {
    expect(renderLineItem(0, true)).not.toContain('Quantity:');
  });
});
