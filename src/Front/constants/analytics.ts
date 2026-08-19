export enum ANALYTICS_EVENTS {
  ADD_TO_CART = 'add_to_cart',
  ADD_TO_CART_CDP = 'ADD',
  ADD_SHIPPING_INFO = 'add_shipping_info',
  ADD_PAYMENT_INFO = 'add_payment_info',
  BEGIN_CHECKOUT = 'begin_checkout',
  BEGIN_CHECKOUT_CDP = 'CONFIRM',
  CURRENCY_SELECTOR = 'currency_selector',
  FILTER_SEARCH = 'filter_search',
  GA_EVENT = 'ga_event',
  PAGE_VIEW = 'page_view',
  PURCHASE = 'purchase',
  PURCHASE_CDP = 'CHECKOUT',
  SEARCH = 'search',
  SELECT_ITEM = 'select_item',
  USER_INFO = 'user_info',
  VIEW_CART = 'view_cart',
  VIEW_ITEM = 'view_item',
  VIEW_ITEM_LIST = 'view_item_list',
  VT_INTERRUPTION = 'vt_interruption',
  '404_ERROR' = '404_error',
  '500_ERROR' = '500_error',
}

export enum LOGIN_STATUS {
  LOGGED_IN = 'logged_in',
  LOGGED_OUT = 'logged_out',
}

export enum ACCOUNT_TYPE {
  B2B = 'b2b',
  B2C = 'b2c',
}

export const DEFAULT_BRAND = 'ISC2';
