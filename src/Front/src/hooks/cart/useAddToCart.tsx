import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useUserSession } from 'providers/index';
import {
  addComputedFieldsToLineItems,
  calculateDiscount,
  getServiceLayerAPI,
  getVariantAttributes,
  isDonationItem,
  parsePriceFromMoney,
  sendEngageAddToCartEvents,
} from 'utils/index';
import { ANALYTICS_EVENTS, DEFAULT_BRAND, QUERY_KEYS } from 'constants/index';
import { useAnalyticsTracking } from 'hooks/index';
import {
  AddToCartHit,
  Money,
  MutationCallbacks,
  ProductHit,
  UpdateCartResponse,
  CartLineItem,
} from 'types/index';
import { usePersonalize } from 'providers/index';

import useCreateCart from './useCreateCart';

type AddToCartProps = {
  items: (AddToCartHit | ProductHit)[];
  quantity?: number;
  externalPrice?: Money;
};

const getActions = ({ items, quantity, externalPrice }: AddToCartProps, currency: string) =>
  items.map((item) => {
    const basePayload = { sku: item.sku, currency };
    const pricePayload = externalPrice ? { externalPrice: { centPrecision: externalPrice } } : {};
    // A quantity carried on the ITEM wins over the payload-level one, which is shared by every
    // action in the batch. Without this, a single mutation can only add all of its lines at the
    // same quantity — see `rebuildCartInSelectedCurrency` in B2BProductLineHitContainer, which has
    // to re-add a whole B2B cart (mixed quantities) in ONE UPDATE_CART. `ProductHit` has no
    // `quantity`, so the PDP/donation callers are unaffected and keep using the shared value.
    const itemQuantity =
      'quantity' in item && item.quantity !== undefined ? item.quantity : quantity;
    // A bundle is identified by its picked products rather than a quantity — that has always been
    // true and stays true for the PDP, which sends neither of the two fields below. The B2B listing
    // does send them (see `buildAddPayload`): `allowMultiple` opts the cart service in to seats on
    // a bundle and to holding the same bundle more than once, and `quantity` is then the seat
    // count. Both are forwarded only when the caller actually set them, so every existing caller
    // produces byte-for-byte the action it produced before.
    const extraPayload =
      'pickedProducts' in item
        ? {
            pickedProducts: item.pickedProducts,
            ...('allowMultiple' in item && item.allowMultiple
              ? { allowMultiple: true, quantity: itemQuantity }
              : {}),
          }
        : { quantity: itemQuantity };

    return {
      addLineItem: {
        ...basePayload,
        ...pricePayload,
        ...extraPayload,
      },
    };
  });

const isCartInvalidError = (error: unknown): boolean => {
  if (!error) return false;

  const errorMessage = (error as { message?: string })?.message || error?.toString() || '';
  // Check both direct code property (for some errors) and extensions.code (for ServiceLayerError)
  const errorCode =
    (error as { code?: string })?.code ||
    (error as { extensions?: { code?: string } })?.extensions?.code ||
    '';

  const isInvalid =
    errorMessage.includes('URI not found') ||
    errorMessage.includes('/carts/') ||
    errorCode === 'ResourceNotFound' ||
    errorCode === 'InvalidOperation' ||
    errorCode === 'ConcurrentModification' ||
    errorCode === 'CART_NOT_FOUND' ||
    errorMessage.includes('was not found') ||
    errorMessage.includes('does not exist');

  return isInvalid;
};

export default function useAddToCart(callbacks?: MutationCallbacks) {
  const queryClient = useQueryClient();
  const { cartId, setCartId, currencyCode, userCountry } = useUserSession();
  const { createCartAsync, createCartError } = useCreateCart();
  const { track } = useAnalyticsTracking();
  const { engage } = usePersonalize();

  const { mutate, mutateAsync, isPending, error, isSuccess } = useMutation({
    mutationFn: async (payload: AddToCartProps) => {
      const api = await getServiceLayerAPI();

      let userCartId = cartId;
      let shouldRetryWithNewCart = false;

      if (!cartId) {
        userCartId = await createCartAsync();
        if (!userCartId) {
          console.log(createCartError);
          throw 'CANNOT_CREATE_CART';
        }
      }

      try {
        const { data } = await api.post<UpdateCartResponse>('', {
          query: 'UPDATE_CART',
          variables: {
            cartId: userCartId,
            country: userCountry,
            actions: getActions(payload, currencyCode),
          },
        });

        if ((data.errors || []).length) {
          const firstError = data.errors[0];

          if (isCartInvalidError(firstError)) {
            shouldRetryWithNewCart = true;
          } else {
            const isDonation = payload.items.some(
              (item) => 'title' in item && isDonationItem(item.title as string)
            );

            console.log(firstError);

            if (isDonation) {
              console.log({
                ...firstError,
              });
              throw 'DONATION_ERROR';
            }

            const errorCode = firstError.extensions?.code;
            if (errorCode === 'INTERNAL_SERVER_ERROR') {
              const { data: cartCheck } = await api.post('', {
                query: 'GET_ACTIVE_CART',
                variables: { cartInfo: { cartID: userCartId } },
              });
              const cartMissing =
                (cartCheck as { data?: { isc2GetCart?: unknown } })?.data?.isc2GetCart == null;

              if (cartMissing) {
                shouldRetryWithNewCart = true;
              } else {
                throw errorCode || firstError.message;
              }
            } else {
              throw firstError.extensions?.code || firstError.message;
            }
          }
        } else {
          return data.data.isc2CartUpdate;
        }
      } catch (apiError: unknown) {
        if (isCartInvalidError(apiError)) {
          shouldRetryWithNewCart = true;
        } else {
          throw apiError;
        }
      }

      if (shouldRetryWithNewCart) {
        console.log('Cart expired or not found. Creating new cart and retrying...');

        const newCartId = await createCartAsync();
        if (!newCartId) {
          console.log(createCartError);
          throw 'CANNOT_CREATE_CART';
        }

        setCartId(newCartId);

        const { data: retryData } = await api.post<UpdateCartResponse>('', {
          query: 'UPDATE_CART',
          variables: {
            cartId: newCartId,
            country: userCountry,
            actions: getActions(payload, currencyCode),
          },
        });

        if ((retryData.errors || []).length) {
          const isDonation = payload.items.some(
            (item) => 'title' in item && isDonationItem(item.title as string)
          );

          console.log(retryData.errors[0]);

          if (isDonation) {
            console.log({
              ...retryData.errors[0],
            });
            throw 'DONATION_ERROR';
          }

          throw retryData.errors[0].extensions?.code || retryData.errors[0].message;
        }

        return retryData.data.isc2CartUpdate;
      }
      throw 'UNEXPECTED_ERROR';
    },
    onSuccess: (updatedCart, variables) => {
      if (callbacks?.onSuccess) {
        callbacks.onSuccess();
      }

      if (updatedCart.id !== cartId) {
        setCartId(updatedCart.id);
      }

      queryClient.setQueryData([QUERY_KEYS.ACTIVE_CART, updatedCart.id], updatedCart);

      variables.items.forEach((addedItem) => {
        const computedCart = addComputedFieldsToLineItems(updatedCart);

        const lineItem = computedCart.lineItems.find(
          (lineItem) => lineItem.variant.sku === addedItem.sku
        );

        if (!lineItem) {
          return;
        }

        const attributes = getVariantAttributes(lineItem.variant);
        const discount = calculateDiscount(
          lineItem.price.value,
          lineItem.price.discounted?.value,
          lineItem.nonMemberPrice
        );

        track({ ecommerce: null });
        track({
          event: ANALYTICS_EVENTS.ADD_TO_CART,
          ecommerce: {
            currency: currencyCode,
            value: parsePriceFromMoney(
              lineItem.price.discounted?.value || lineItem.price.value,
              lineItem.quantity
            ),
            items: [
              {
                item_id: lineItem.productKey,
                item_name: lineItem.name,
                item_variant: lineItem.variant.sku,
                item_category: lineItem.productType?.name,
                ...(attributes['division'] !== undefined && {
                  item_category2: attributes['division'],
                }),
                ...(attributes['modality'] !== undefined && {
                  item_category3: attributes['modality'],
                }),
                item_brand: attributes['training_provider_'] || DEFAULT_BRAND,
                price: parsePriceFromMoney(
                  lineItem.price.discounted?.value || lineItem.price.value,
                  1
                ),
                ...(discount !== undefined && { discount }),
                quantity: lineItem.quantity,
              },
            ],
          },
        });
      });

      const computedCart = addComputedFieldsToLineItems(updatedCart);
      const addedLineItems = variables.items
        .map((addedItem) =>
          computedCart.lineItems.find((lineItem) => lineItem.variant.sku === addedItem.sku)
        )
        .filter((lineItem): lineItem is CartLineItem => lineItem !== undefined);

      if (addedLineItems.length > 0) {
        sendEngageAddToCartEvents(addedLineItems, currencyCode, engage || null, {
          source: 'useAddToCart',
        });
      }

      track({
        ecommerce: null,
      });
    },
    onError: callbacks?.onError,
  });

  return {
    addToCart: mutate,
    addToCartAsync: mutateAsync,
    isAddingToCart: isPending,
    addToCartError: error,
    addToCartSuccess: isSuccess,
  };
}
