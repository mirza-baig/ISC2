import { Cart } from 'types/index';

export type ActiveCartInfo = {
  cartID?: string;
  currency?: string;
  userExternalId?: string;
  [key: string]: unknown;
};

export type ActiveCartResponse = {
  data?: { isc2GetCart?: Cart } | null;
  errors?: unknown[];
};

export type PostActiveCart = (cartInfo: ActiveCartInfo) => Promise<ActiveCartResponse>;

export const shouldLookUpSavedCart = (cartInfo: ActiveCartInfo) =>
  !cartInfo.cartID && Boolean(cartInfo.userExternalId) && Boolean(cartInfo.currency);

export const fetchActiveCart = async (
  post: PostActiveCart,
  cartInfo: ActiveCartInfo
): Promise<Cart> => {
  if (shouldLookUpSavedCart(cartInfo)) {
    const saved = await post({ ...cartInfo, currency: undefined });
    const savedCart = saved.data?.isc2GetCart;

    if (!(saved.errors || []).length && savedCart) {
      return savedCart;
    }
  }

  const response = await post(cartInfo);

  if ((response.errors || []).length) {
    throw response.errors?.[0];
  }

  return response.data?.isc2GetCart as Cart;
};
