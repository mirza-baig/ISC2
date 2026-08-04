import { useMutation } from '@tanstack/react-query';

import { useCart, useCheckoutProcess, usePersonalize } from 'providers/index';
import { ConfirmPaymentPayload, Cart, CartLineItem } from 'types/index';
import useAnalyticsTracking from 'hooks/useAnalyticsTracking';
import { useAnalyticsItems, addComputedFieldsToLineItems } from 'utils/cart';
import { parsePriceFromMoney } from 'utils/index';
import useCreateOrderFromCart from './useCreateOrderFromCart';
import useHandleStripePayment from './useHandleStripePayment';
import useHandlePaypalPayment from './useHandlePaypalPayment';
import { PAYMENT_METHODS } from 'constants/checkout';
import { ANALYTICS_EVENTS } from 'constants/analytics';
import { buildPurchaseEcommercePayload, formatAnalyticsCouponCodes } from 'utils/analytics';
import { LOCALSTORAGE_KEYS } from 'constants/index';
import { buildConfirmationRedirectUrl, withRedirectStatus } from 'utils/checkoutReturnUrl';

const sendEngagePurchaseEvent = (
  cartLineItems: CartLineItem[],
  currency: string,
  transactionId: string,
  engage: {
    event: (
      type: string,
      eventData: Record<string, unknown>,
      extensionData?: Record<string, unknown>
    ) => Promise<unknown>;
  } | null
) => {
  if (!engage) {
    return;
  }

  if (!cartLineItems || cartLineItems.length === 0) {
    return;
  }

  const totalValue = cartLineItems.reduce((sum, lineItem) => {
    const originalPrice = parsePriceFromMoney(lineItem.price.value, 1) as number;
    const discountedPrice = lineItem.price.discounted?.value
      ? (parsePriceFromMoney(lineItem.price.discounted.value, 1) as number)
      : null;
    const itemPrice = discountedPrice || originalPrice;
    return sum + itemPrice * lineItem.quantity;
  }, 0);

  const eventData = {
    channel: 'WEB',
    currency: currency,
    pointOfSale: process.env.NEXT_PUBLIC_ENGAGE_TARGET_POS || 'WEB',
    value: totalValue,
    reference_id: transactionId,
    status: 'PURCHASED',
    products: cartLineItems.map((lineItem) => {
      const originalPrice = parsePriceFromMoney(lineItem.price.value, 1) as number;
      const discountedPrice = lineItem.price.discounted?.value
        ? (parsePriceFromMoney(lineItem.price.discounted.value, 1) as number)
        : null;

      return {
        name: lineItem.name,
        type: lineItem.productType?.name || 'Product',
        item_id: lineItem.variant.sku,
        productId: lineItem.productKey,
        referenceId: lineItem.productKey,
        orderedAt: new Date().toISOString(),
        quantity: lineItem.quantity,
        price: discountedPrice || originalPrice,
        originalPrice: originalPrice,
        currency: currency,
      };
    }),
  };

  const extensionData = {
    source: 'purchaseComplete',
    timestamp: new Date().toISOString(),
  };

  try {
    engage.event(ANALYTICS_EVENTS.PURCHASE_CDP, eventData, extensionData);
  } catch (e: unknown) {
    /* empty */
  }
};

type PlaceOrderResponse = {
  redirectURL: string;
  status: 'failed' | 'succeeded';
};

export default function useConfirmPayment() {
  const { activeCart } = useCart();
  const { track } = useAnalyticsTracking();
  const mappedItems = useAnalyticsItems();
  const { engage } = usePersonalize();

  const { fields } = useCheckoutProcess();
  const { createOrderAsync, createOrderError } = useCreateOrderFromCart();
  const { handleStripePayment } = useHandleStripePayment();
  const { handlePaypalPayment } = useHandlePaypalPayment();

  const trackPaymentInfo = (paymentMethod: string) => {
    const coupon = formatAnalyticsCouponCodes(activeCart?.discountCodes);

    track({ ecommerce: null });
    track({
      event: ANALYTICS_EVENTS.ADD_PAYMENT_INFO,
      ecommerce: {
        currency: activeCart?.computed?.currencyCode,
        value: Number(activeCart?.computed?.subtotal),
        payment_type: paymentMethod,
        items: mappedItems,
        ...(coupon !== undefined && { coupon }),
      },
    });

    if (engage && activeCart?.lineItems) {
      const cartWithComputedFields = addComputedFieldsToLineItems(activeCart as Cart);

      const totalValue = cartWithComputedFields.lineItems.reduce((sum, lineItem) => {
        const originalPrice = parsePriceFromMoney(lineItem.price.value, 1) as number;
        const discountedPrice = lineItem.price.discounted?.value
          ? (parsePriceFromMoney(lineItem.price.discounted.value, 1) as number)
          : null;
        const itemPrice = discountedPrice || originalPrice;
        return sum + itemPrice * lineItem.quantity;
      }, 0);

      const eventData = {
        channel: 'WEB',
        currency: activeCart?.computed?.currencyCode || 'USD',
        pointOfSale: process.env.NEXT_PUBLIC_ENGAGE_TARGET_POS || 'WEB',
        value: totalValue,
        payment_type: paymentMethod,
        products: cartWithComputedFields.lineItems.map((lineItem) => {
          const originalPrice = parsePriceFromMoney(lineItem.price.value, 1) as number;
          const discountedPrice = lineItem.price.discounted?.value
            ? (parsePriceFromMoney(lineItem.price.discounted.value, 1) as number)
            : null;

          return {
            name: lineItem.name,
            type: lineItem.productType?.name || 'Product',
            item_id: lineItem.variant.sku,
            productId: lineItem.productKey,
            referenceId: lineItem.productKey,
            quantity: lineItem.quantity,
            price: discountedPrice || originalPrice,
            originalPrice: originalPrice,
            currency: activeCart?.computed?.currencyCode || 'USD',
          };
        }),
      };

      const extensionData = {
        source: 'paymentInfo',
        payment_method: paymentMethod,
        timestamp: new Date().toISOString(),
      };

      try {
        engage.event(ANALYTICS_EVENTS.ADD_PAYMENT_INFO, eventData, extensionData);
      } catch (e: unknown) {
        /* empty */
      }
    }
  };

  const { mutate, isPending, error } = useMutation({
    mutationFn: async (payload: ConfirmPaymentPayload) => {
      const baseRedirectUrl = buildConfirmationRedirectUrl(fields.confirmPurchaseCta.value.href);

      let paymentResult = null;

      try {
        if (payload.paymentMethod !== PAYMENT_METHODS.FREE) {
          const isStripe = payload.paymentMethod === PAYMENT_METHODS.STRIPE;

          if (isStripe) {
            paymentResult = await handleStripePayment();
          } else {
            paymentResult = await handlePaypalPayment.bind(null, payload)();
          }
        }

        const { order } = await createOrderAsync(paymentResult?.orderPayload ?? null);

        // Change label depending on error message
        if (!order?.orderNumber || createOrderError) {
          throw createOrderError;
        }

        trackPaymentInfo(payload.paymentMethod);

        localStorage.setItem(LOCALSTORAGE_KEYS.ORDER_NUMBER, order.orderNumber);
        return {
          redirectURL: withRedirectStatus(baseRedirectUrl, 'succeeded'),
          status: 'succeeded',
        };
      } catch (err) {
        localStorage.setItem(LOCALSTORAGE_KEYS.ORDER_ERROR, JSON.stringify(err || {}));
        return { redirectURL: withRedirectStatus(baseRedirectUrl, 'failed'), status: 'failed' };
      }
    },
    onSuccess: async ({ redirectURL, status }: PlaceOrderResponse) => {
      if (status === 'succeeded') {
        track({ ecommerce: null });
        track({
          event: ANALYTICS_EVENTS.PURCHASE,
          ecommerce: buildPurchaseEcommercePayload({
            transactionId: activeCart?.id,
            currencyCode: activeCart?.computed?.currencyCode,
            subtotal: activeCart?.computed?.subtotal,
            taxValue: activeCart?.computed?.taxValue,
            mappedItems,
            discountCodes: activeCart?.discountCodes,
          }),
        });

        if (engage && activeCart?.id) {
          const cartWithComputedFields = addComputedFieldsToLineItems(activeCart as Cart);
          sendEngagePurchaseEvent(
            cartWithComputedFields.lineItems,
            activeCart?.computed?.currencyCode || 'USD',
            activeCart.id,
            engage
          );
        }
      }

      window.location.href = redirectURL;
    },
  });

  return {
    isConfirmingPayment: isPending,
    confirmPaymentError: error,
    confirmPayment: mutate,
  };
}
