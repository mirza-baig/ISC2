export const CT_DEFAULT_TIER = 'tier10-ch';
export const CT_BANNED_TIERS = ['tier40-ch'];
export const CUSTOMER_PRICING_GROUP_MAP = {
  NON_MEMBERS: 'cg-non-members',
  CANDIDATES: 'cg-candidates',
  MEMBERS: 'cg-members',
  ASSOCIATES: 'cg-associates',
};

export interface Channel {
  id: string | undefined;
  key: string | undefined;
  custom?: {
    customFieldsRaw: {
      name: string;
      value: string[];
    }[];
  };
  channels?: {
    id: string | undefined;
    key: string | undefined;
    custom: {
      customFieldsRaw: {
        name: string;
        value: string[];
      }[];
    };
  }[];
}

export type ProductPrice = {
  currencyCode?: string;
  centAmount?: number;
  fractionDigits?: number;
};

export type StandalonePrice = {
  sku: string;
  channel: {
    id: string;
    key: string;
  };
  customerGroup: {
    key: string;
    name: string;
  };
  discounted: null | { value: TypedMoney };
  value: TypedMoney;
  custom?: {
    customFieldsRaw: {
      name: string;
      value: string;
    }[];
  };
};

export type StandalonePriceMapping = {
  [key: string]: {
    [key: string]: StandalonePrice;
  };
};

/**
 *	Base polymorphic read-only money type that stores currency in cent precision or high precision, that is in sub-cents. *
 *  Code below was borrowed from CommerceTools SDK
 */
export type TypedMoney = CentPrecisionMoney | HighPrecisionMoney;
/**
 *	Object that stores money in cent amounts of a specific currency.
 */
export interface CentPrecisionMoney {
  readonly type: 'centPrecision';
  /**
   *	Amount in the smallest indivisible unit of a currency, such as:
   *
   *	* Cents for EUR and USD, pence for GBP, or centime for CHF (5 CHF is specified as `500`).
   *	* The value in the major unit for currencies without minor units, like JPY (5 JPY is specified as `5`).
   *
   *
   */
  readonly centAmount: number;
  /**
   *	Currency code compliant to [ISO 4217](https://en.wikipedia.org/wiki/ISO_4217).
   *
   *
   */
  readonly currencyCode: string;
  /**
   *	The number of default fraction digits for the given currency, like `2` for EUR or `0` for JPY.
   *
   *
   */
  readonly fractionDigits: number;
}
/**
 *	Object that stores money as a fraction of the smallest indivisible unit of a specific currency.
 */
export interface HighPrecisionMoney {
  readonly type: 'highPrecision';
  /**
   *	Amount in the smallest indivisible unit of a currency, such as:
   *
   *	* Cents for EUR and USD, pence for GBP, or centime for CHF (5 CHF is specified as `500`).
   *	* The value in the major unit for currencies without minor units, like JPY (5 JPY is specified as `5`).
   *
   *
   */
  readonly centAmount: number;
  /**
   *	Currency code compliant to [ISO 4217](https://en.wikipedia.org/wiki/ISO_4217).
   *
   *
   */
  readonly currencyCode: string;
  /**
   *	Number of digits after the decimal separator, greater than the default number of fraction digits for a currency.
   *
   *
   */
  readonly fractionDigits: number;
  /**
   *	Amount in 1 / (10 ^ `fractionDigits`) of a currency.
   *
   *
   */
  readonly preciseAmount: number;
}

/**
 *	Draft object to store money in cent amounts for a specific currency.
 */
export interface Money {
  /**
   *	Amount in the smallest indivisible unit of a currency, such as:
   *
   *	* Cents for EUR and USD, pence for GBP, or centime for CHF (5 CHF is specified as `500`).
   *	* The value in the major unit for currencies without minor units, like JPY (5 JPY is specified as `5`).
   *
   *
   */
  readonly centAmount: number;
  /**
   *	Currency code compliant to [ISO 4217](https://en.wikipedia.org/wiki/ISO_4217).
   *
   *
   */
  readonly currencyCode: string;
}
