import clsx from 'clsx';

import { FEW_SEATS_THRESHOLD } from 'constants/index';
import { CartLineItem } from 'types/index';

export namespace LineItemSeats {
  export type Props = {
    lineItem: CartLineItem;
    fewSeatsLabel: string;
    notAvailableLabel: string;
    className?: string;
  };
}

export function LineItemSeats({
  lineItem,
  fewSeatsLabel,
  notAvailableLabel,
  className,
}: LineItemSeats.Props) {
  if (lineItem.availableQuantity === 0) {
    return (
      <span className={clsx('warning-pill self-start whitespace-nowrap', className)}>
        {notAvailableLabel}
      </span>
    );
  }

  if (lineItem.availableQuantity <= FEW_SEATS_THRESHOLD) {
    return (
      <span className={clsx('black-pill self-start whitespace-nowrap', className)}>
        {fewSeatsLabel}
      </span>
    );
  }

  return <span />;
}
