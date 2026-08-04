import { useMemo } from 'react';
import clsx from 'clsx';

import { CartLineItem } from 'types/index';
import { getVariantAttributes, isBundleLineItem } from 'utils/index';
import { LineItemDate } from './LineItemDate';
import { BundleLineItemProducts } from './BundleLineItemProducts';

export namespace LineItemAttributes {
  export type Props = {
    lineItem: CartLineItem;
    isOrderSummary?: boolean;
    isOutOfStock?: boolean;
  };
}

export const LineItemAttributes = ({ lineItem, isOutOfStock }: LineItemAttributes.Props) => {
  const lineItemAttributes = useMemo(() => {
    if (isBundleLineItem(lineItem)) {
      return {};
    }

    return getVariantAttributes(lineItem.variant);
  }, [lineItem]);

  const isExtendedAttributes = useMemo(
    () => Boolean(lineItemAttributes.training_provider_ && lineItemAttributes.modality),
    [lineItemAttributes]
  );

  if (isBundleLineItem(lineItem)) {
    return (
      <>
        <label className={clsx('body-m mb-2', isOutOfStock && 'text-gray-70')}>
          {lineItem.name}
        </label>
        <BundleLineItemProducts lineItem={lineItem} />
      </>
    );
  }

  return (
    <>
      <label
        className={clsx('body-m', isExtendedAttributes && 'mb-2', isOutOfStock && 'text-gray-70')}
      >
        {lineItemAttributes.copy_name || lineItemAttributes.name || lineItem.name}
      </label>
      <div className="flex body-s gap-x-2 text-gray-70">
        {Boolean(lineItemAttributes.training_provider_) && (
          <label>{lineItemAttributes.training_provider_}</label>
        )}
        {Boolean(lineItemAttributes.training_provider_ && lineItemAttributes.modality) && (
          <label>|</label>
        )}
        {Boolean(lineItemAttributes.modality) && <label>{lineItemAttributes.modality}</label>}
      </div>
      <LineItemDate attributes={lineItemAttributes} />
    </>
  );
};
