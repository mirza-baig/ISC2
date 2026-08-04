import clsx from 'clsx';
import { FREE_PRICE } from 'constants/cart';
import { useUserSession } from 'providers/userSession';
import { StandalonePrice } from 'types/pricing';
import { parsePrice } from 'utils/price';

interface ProductFormPriceProps {
  price?: StandalonePrice;
  title?: string;
  freeText?: string;
  isLoadingPrices?: boolean;
  additionalClasses?: string;
  prefix?: string;
}

export default function ProductFormPrice({
  price,
  title,
  freeText,
  isLoadingPrices,
  additionalClasses,
  prefix,
}: ProductFormPriceProps) {
  const { currencySymbol } = useUserSession();
  const priceValue = parsePrice(price?.value?.centAmount, price?.value?.fractionDigits);
  const discountPrice = parsePrice(
    price?.discounted?.value?.centAmount,
    price?.discounted?.value?.fractionDigits
  );
  const isFreePrice =
    (price?.discounted
      ? priceValue === FREE_PRICE || (price.discounted?.value && discountPrice === FREE_PRICE)
      : priceValue === FREE_PRICE) && freeText;

  return (
    <>
      {isLoadingPrices && (
        <span
          className={clsx(
            'rounded-md block bg-gray-30 h-5 first:mt-0 animate-pulse',
            additionalClasses || 'w-full'
          )}
        />
      )}
      {!isLoadingPrices && (
        <>
          {isFreePrice && (
            <p className="text-isc2-green min-h-7 font-bold text-md text-right m-0">{freeText}</p>
          )}
          {!isFreePrice && (
            <div
              className={clsx(
                additionalClasses || 'text-md',
                'min-h-7 flex justify-between items-center'
              )}
            >
              {title && <span>{title}</span>}
              <span className="whitespace-nowrap flex items-center space-x-2">
                <span
                  className={clsx(
                    'font-bold space-x-1 text-lg',
                    Boolean(price?.discounted?.value) && 'line-through'
                  )}
                >
                  {prefix && <span>{prefix}</span>}
                  <span>{currencySymbol}</span>
                  <span>{priceValue}</span>
                </span>
                {Boolean(price?.discounted?.value) && (
                  <span className="font-bold space-x-1 text-discount text-lg">
                    {currencySymbol}
                    {discountPrice}
                  </span>
                )}
              </span>
            </div>
          )}
        </>
      )}
    </>
  );
}
