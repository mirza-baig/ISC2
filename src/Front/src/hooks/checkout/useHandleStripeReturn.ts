import { useRouter } from 'next/router';
import { useEffect, useMemo, useRef, useState } from 'react';

import { ANALYTICS_EVENTS, LOCALSTORAGE_KEYS } from 'constants/index';
import useAnalyticsTracking from 'hooks/useAnalyticsTracking';
import { useCart, useCheckoutProcess } from 'providers/index';
import { buildPurchaseEcommercePayload } from 'utils/analytics';
import { useAnalyticsItems } from 'utils/cart';
import {
  buildConfirmationRedirectUrl,
  getQueryParam,
  getStripeCheckoutReturnParams,
  withRedirectStatus,
} from 'utils/checkoutReturnUrl';

import useCreateOrderFromCart from './useCreateOrderFromCart';

type PlaceOrderResult = {
  order?: {
    orderNumber?: string;
  };
};

const getOrderNumber = (
  placeOrderResult: PlaceOrderResult | null | undefined
): string | undefined => placeOrderResult?.order?.orderNumber;

export default function useHandleStripeReturn() {
  const router = useRouter();
  const { fields } = useCheckoutProcess();
  const { activeCart, getCartSuccess } = useCart();
  const { createOrderAsync } = useCreateOrderFromCart();
  const { track } = useAnalyticsTracking();
  const mappedItems = useAnalyticsItems();
  const [isCompletingStripeReturn, setIsCompletingStripeReturn] = useState(false);
  const hasHandledReturn = useRef(false);

  const stripeReturn = useMemo(
    () => (router.isReady ? getStripeCheckoutReturnParams(router.query) : null),
    [router.isReady, router.query]
  );

  const cartIdForPlaceOrder = useMemo(() => {
    const fromCart = activeCart?.id;
    if (fromCart) {
      return fromCart;
    }

    if (typeof window === 'undefined') {
      return undefined;
    }

    return (
      sessionStorage.getItem(LOCALSTORAGE_KEYS.STRIPE_RETURN_CART_ID) ||
      localStorage.getItem(LOCALSTORAGE_KEYS.ACTIVE_CART_ID) ||
      getQueryParam(router.query.cartId) ||
      undefined
    );
  }, [activeCart?.id, router.query]);

  const isHandlingStripeReturn = stripeReturn !== null;
  const isCartReadyForPlaceOrder = Boolean(cartIdForPlaceOrder) || getCartSuccess;

  useEffect(() => {
    if (!router.isReady || !stripeReturn || hasHandledReturn.current) {
      return;
    }

    if (!isCartReadyForPlaceOrder) {
      return;
    }

    const baseRedirectUrl = buildConfirmationRedirectUrl(fields.confirmPurchaseCta.value.href);

    if (!cartIdForPlaceOrder) {
      hasHandledReturn.current = true;
      localStorage.setItem(
        LOCALSTORAGE_KEYS.ORDER_ERROR,
        JSON.stringify({ message: 'Cart not found after payment redirect' })
      );
      window.location.href = withRedirectStatus(baseRedirectUrl, 'failed');
      return;
    }

    hasHandledReturn.current = true;

    const completeStripeReturn = async () => {
      setIsCompletingStripeReturn(true);

      if (stripeReturn.redirectStatus !== 'succeeded') {
        window.location.href = withRedirectStatus(baseRedirectUrl, 'failed');
        return;
      }

      try {
        const placeOrderResult = await createOrderAsync({
          intentPaymentId: stripeReturn.paymentIntentId,
          cartID: cartIdForPlaceOrder,
        });
        const orderNumber = getOrderNumber(placeOrderResult);

        if (!orderNumber) {
          throw new Error('Order number missing after place order');
        }

        localStorage.setItem(LOCALSTORAGE_KEYS.ORDER_NUMBER, orderNumber);
        localStorage.removeItem(LOCALSTORAGE_KEYS.ORDER_ERROR);
        sessionStorage.removeItem(LOCALSTORAGE_KEYS.STRIPE_RETURN_CART_ID);

        window.location.href = withRedirectStatus(baseRedirectUrl, 'succeeded');

        try {
          track({ ecommerce: null });
          track({
            event: ANALYTICS_EVENTS.PURCHASE,
            ecommerce: buildPurchaseEcommercePayload({
              transactionId: activeCart?.id ?? cartIdForPlaceOrder,
              currencyCode: activeCart?.computed?.currencyCode,
              subtotal: activeCart?.computed?.subtotal,
              taxValue: activeCart?.computed?.taxValue,
              mappedItems,
              discountCodes: activeCart?.discountCodes,
            }),
          });
        } catch (e: unknown) {
          /* empty */
        }
      } catch (err) {
        localStorage.setItem(LOCALSTORAGE_KEYS.ORDER_ERROR, JSON.stringify(err || {}));
        window.location.href = withRedirectStatus(baseRedirectUrl, 'failed');
      }
    };

    void completeStripeReturn();
  }, [
    activeCart?.computed?.currencyCode,
    activeCart?.computed?.subtotal,
    activeCart?.computed?.taxValue,
    activeCart?.discountCodes,
    activeCart?.id,
    cartIdForPlaceOrder,
    createOrderAsync,
    fields.confirmPurchaseCta.value.href,
    getCartSuccess,
    isCartReadyForPlaceOrder,
    mappedItems,
    router.isReady,
    stripeReturn,
    track,
  ]);

  return { isHandlingStripeReturn, isCompletingStripeReturn };
}
