import { FREE_PRICE } from 'constants/cart';
import { baseProductPrice } from 'providers/index';
import { ProductPrice, StandalonePrice, TypedMoney } from 'types/index';

export interface Price {
  customerGroup: string;
  sku: string;
  centAmount: number;
  fractionDigits: number;
  currencyCode: string;
  isForFree: boolean;
}

export const isProductFreeForUser = (price?: StandalonePrice, userRole?: boolean) =>
  userRole && (price?.value.centAmount === 0 || price?.discounted?.value.centAmount === 0);

export const calculateDiscount = (
  regularPrice?: TypedMoney | null,
  discountedPrice?: TypedMoney | null,
  nonMemberPrice?: TypedMoney | null
): number | undefined => {
  const regularCentAmount = regularPrice?.centAmount;
  const discountedCentAmount = discountedPrice?.centAmount;
  const nonMemberCentAmount = nonMemberPrice?.centAmount;

  if (regularCentAmount && discountedCentAmount && regularCentAmount > discountedCentAmount) {
    return Number(
      parsePrice(regularCentAmount - discountedCentAmount, regularPrice.fractionDigits, true)
    );
  }

  if (regularCentAmount && nonMemberCentAmount && regularCentAmount < nonMemberCentAmount) {
    return Number(
      parsePrice(nonMemberCentAmount - regularCentAmount, regularPrice.fractionDigits, true)
    );
  }

  return undefined;
};

export const parsePrice = (amount: string | number = 0, fractionDigits = 0, simplify = false) => {
  const value = typeof amount === 'string' ? amount : amount?.toString();
  const valueNumber = parseFloat(value);
  const absoluteValue = Math.abs(valueNumber) / Math.pow(10, fractionDigits);

  if (absoluteValue === 0) {
    return simplify ? '0' : FREE_PRICE;
  }
  const isNumberInt = Number.isInteger(absoluteValue);

  return simplify && isNumberInt
    ? `${Math.trunc(absoluteValue)}`
    : `${absoluteValue.toFixed(fractionDigits)}`;
};

export const formatMoneyWithCurrencyCode = (currencyCode: string, money?: TypedMoney) =>
  `${currencyCode} ${parsePrice(money?.centAmount, money?.fractionDigits)}`;

export const parsePriceFromMoney = (
  value: TypedMoney | undefined,
  quantity = 1,
  asNumber = true
) => {
  if (!value) {
    return 0;
  }

  const { centAmount, fractionDigits } = value;
  const parsed = parsePrice(centAmount * quantity, fractionDigits);

  if (!asNumber) {
    return parsed;
  }

  return Number(parsed);
};

export const correctDigits = ({ centAmount, fractionDigits, currencyCode }: TypedMoney) => {
  if (fractionDigits === undefined || centAmount === undefined) {
    return;
  }
  const digitsDiff = baseProductPrice.fractionDigits - fractionDigits;
  const priceVal = centAmount || 0;

  return {
    currencyCode,
    fractionDigits: digitsDiff !== 0 ? baseProductPrice.fractionDigits : fractionDigits,
    centAmount:
      digitsDiff === 0
        ? priceVal
        : digitsDiff > 0
        ? priceVal * Math.pow(10, digitsDiff)
        : priceVal / Math.pow(10, Math.abs(digitsDiff)),
  };
};

export const extractPrice = (a: number | undefined, b: number | undefined): number => {
  const dataA = a || 0;
  const dataB = b || 0;
  return dataA + dataB;
};

export const getAccumulatedPrice = (values: ProductPrice[], currencyCode: string): ProductPrice => {
  return values?.reduce((a: ProductPrice, b: ProductPrice) => {
    return {
      currencyCode,
      centAmount: extractPrice(a?.centAmount, b?.centAmount),
      fractionDigits: a?.fractionDigits || b?.fractionDigits,
    };
  });
};

export const areEqualPrices = (priceArray: (StandalonePrice | undefined)[]): boolean => {
  const ethalon = priceArray[0];
  const arr = priceArray.slice(1);
  return arr.reduce((acc, item) => {
    const matchDiscounts =
      ethalon?.discounted?.value?.centAmount === item?.discounted?.value?.centAmount &&
      ethalon?.discounted?.value?.fractionDigits === item?.discounted?.value?.fractionDigits;

    const matchPrices =
      ethalon?.value?.centAmount === item?.value?.centAmount &&
      ethalon?.value?.fractionDigits === item?.value?.fractionDigits;

    return acc && matchDiscounts && matchPrices;
  }, true);
};
