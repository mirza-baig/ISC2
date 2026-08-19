import { ANALYTICS_EVENTS } from 'constants/index';
import { CartLineItem } from 'types/index';

import { parsePriceFromMoney } from './price';

export interface EngageClient {
  event: (
    type: string,
    eventData: Record<string, unknown>,
    extensionData?: Record<string, unknown>
  ) => Promise<unknown>;
}

export interface EngageEventOptions {
  source: string;
  extensionData?: Record<string, unknown>;
  errorMessage?: string;
}

const getLineItemPrices = (lineItem: CartLineItem) => {
  const originalPrice = parsePriceFromMoney(lineItem.price.value, 1) as number;
  const discountedPrice = lineItem.price.discounted?.value
    ? (parsePriceFromMoney(lineItem.price.discounted.value, 1) as number)
    : null;

  return { originalPrice, price: discountedPrice || originalPrice };
};

const sendEngageEvent = (
  engage: EngageClient,
  type: string,
  eventData: Record<string, unknown>,
  { source, extensionData, errorMessage }: EngageEventOptions
) => {
  try {
    engage.event(type, eventData, {
      source,
      ...extensionData,
      timestamp: new Date().toISOString(),
    });
  } catch (e: unknown) {
    if (errorMessage) {
      console.error(errorMessage, e);
    }
  }
};

export const sendEngageAddToCartEvents = (
  cartLineItems: CartLineItem[],
  currency: string,
  engage: EngageClient | null,
  options: EngageEventOptions
): void => {
  if (!engage || !cartLineItems || cartLineItems.length === 0) {
    return;
  }

  cartLineItems.forEach((lineItem) => {
    const { originalPrice, price } = getLineItemPrices(lineItem);

    sendEngageEvent(
      engage,
      ANALYTICS_EVENTS.ADD_TO_CART_CDP,
      {
        channel: 'WEB',
        currency: currency,
        pointOfSale: process.env.NEXT_PUBLIC_ENGAGE_TARGET_POS || 'WEB',
        product: {
          name: lineItem.name,
          type: lineItem.productType?.name || 'Product',
          item_id: lineItem.variant.sku,
          productId: lineItem.productKey,
          referenceId: lineItem.productKey,
          orderedAt: new Date().toISOString(),
          quantity: lineItem.quantity,
          price: price,
          originalPrice: originalPrice,
          currency: currency,
        },
      },
      options
    );
  });
};

export const sendEngageBeginCheckoutEvent = (
  cartLineItems: CartLineItem[],
  currency: string,
  engage: EngageClient | null,
  options: EngageEventOptions
): void => {
  if (!engage || !cartLineItems || cartLineItems.length === 0) {
    return;
  }

  const totalValue = cartLineItems.reduce(
    (sum, lineItem) => sum + getLineItemPrices(lineItem).price * lineItem.quantity,
    0
  );

  sendEngageEvent(
    engage,
    ANALYTICS_EVENTS.BEGIN_CHECKOUT_CDP,
    {
      channel: 'WEB',
      currency: currency,
      pointOfSale: process.env.NEXT_PUBLIC_ENGAGE_TARGET_POS || 'WEB',
      value: totalValue,
      product: cartLineItems.map((lineItem) => {
        return {
          item_id: lineItem.variant.sku,
        };
      }),
    },
    options
  );
};

const B2B_ENGAGE_OPTIONS = {
  source: 'b2bPaymentConfirmation',
  extensionData: {
    userType: 'B2B User',
    isB2BTransaction: true,
  },
};

// Sent right before a B2B order is placed, from the payment step and from the
// $0.00 shortcut that skips it.
export const sendEngageB2BPaymentConfirmationEvents = (
  cartLineItems: CartLineItem[],
  currency: string,
  engage: EngageClient | null
): void => {
  sendEngageAddToCartEvents(cartLineItems, currency, engage, {
    ...B2B_ENGAGE_OPTIONS,
    errorMessage: 'Error sending B2B add to cart CDP event:',
  });

  sendEngageBeginCheckoutEvent(cartLineItems, currency, engage, {
    ...B2B_ENGAGE_OPTIONS,
    errorMessage: 'Error sending B2B begin checkout CDP event:',
  });
};
