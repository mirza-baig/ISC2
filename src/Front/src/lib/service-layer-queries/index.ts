import { ACCEPT_OIL_ALLOCATION } from './allocation';
import { SERVICE_LAYER_AUTH } from './auth';
import { CREATE_CART, GET_ACTIVE_CART, UPDATE_CART, UPDATE_CART_TAX } from './cart';
import { GET_CHANNELS } from './channels';
import { CREATE_PAYMENT_INTENT, PLACE_ORDER } from './checkout';
import { GET_CURRENCIES } from './currencies';
import { GET_INVENTORY } from './inventory';
import { GET_ALL_ORDERS, GET_ORDER } from './order';
import { GET_STANDALONE_PRICES } from './prices';
import { GET_USER_ACCOUNT } from './user';

export const SERVICE_LAYER_QUERIES = {
  ACCEPT_OIL_ALLOCATION,
  CREATE_CART,
  CREATE_PAYMENT_INTENT,
  GET_ACTIVE_CART,
  GET_ALL_ORDERS,
  GET_CHANNELS,
  GET_CURRENCIES,
  GET_INVENTORY,
  GET_ORDER,
  GET_STANDALONE_PRICES,
  GET_PARTIAL_USER_ACCOUNT: GET_USER_ACCOUNT({ includeProduct: false }),
  GET_USER_ACCOUNT: GET_USER_ACCOUNT({ includeProduct: true }),
  PLACE_ORDER,
  SERVICE_LAYER_AUTH,
  UPDATE_CART,
  UPDATE_CART_TAX,
} as const;
