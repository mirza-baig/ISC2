import clsx from 'clsx';
import { useMemo } from 'react';

export namespace LineItemPrice {
  type OptionalProps =
    | { type?: 'regular' | 'discount'; userPriceLabel?: never }
    | { type: 'user-specific'; userPriceLabel: string };

  export type Props = OptionalProps & {
    title?: string;
    value?: string | number;
    strikeThrough?: boolean;
    textClassName?: string;
    valueClassName?: string;
    currency: string;
    taxTbdLabel?: string;
  };
}

export const LineItemPrice = ({
  title = '',
  value,
  strikeThrough,
  textClassName,
  valueClassName = textClassName,
  currency,
  taxTbdLabel,
  userPriceLabel,
  type = 'regular',
}: LineItemPrice.Props) => {
  const valueLabel = useMemo(() => {
    if (value === null || value === undefined) {
      return taxTbdLabel;
    }

    const price = [currency, value].join(' ').trim();

    if (type !== 'user-specific' || !userPriceLabel) {
      return price;
    }

    return userPriceLabel.replace('${price}', price);
  }, [currency, taxTbdLabel, type, userPriceLabel, value]);

  return (
    <div className="flex items-center justify-between w-full">
      <label className={clsx('body-m text-sm-base', textClassName)}>{title}</label>
      {value !== '' && (
        <label
          className={clsx(
            'body-m text-sm-base font-bold text-gray-90 whitespace-nowrap',
            type === 'user-specific' && '!text-isc2-green',
            type === 'discount' && '!text-discount before:content-["-"] before:mr-1',
            strikeThrough && 'line-through',
            valueClassName
          )}
        >
          {valueLabel}
        </label>
      )}
    </div>
  );
};
