import { useMemo } from 'react';
import { BundleLineItem } from 'types/miniCart';

import { getVariantAttributes, isBundleLineItem } from 'utils/cart';

export namespace BundleLineItemProducts {
  export type Props = {
    lineItem: BundleLineItem;
    /** Authorized-buyer checkout summary: show the seat count even at a single seat. */
    alwaysShowQuantity?: boolean;
  };
}

export function BundleLineItemProducts({
  lineItem,
  alwaysShowQuantity,
}: BundleLineItemProducts.Props) {
  const bundleProductNames = useMemo(() => {
    if (isBundleLineItem(lineItem)) {
      return lineItem.products.map(
        (product) =>
          getVariantAttributes(product.variant).copy_name ||
          getVariantAttributes(product.variant).name // the name field as a backup, as we can not leave this empty
      );
    }

    return [];
  }, [lineItem]);

  return (
    <>
      <ul className="body-s flex flex-col text-gray-90 list-disc list-inside ml-2 gap-y-1">
        {bundleProductNames.map((name) => (
          <li key={name} className="body-s">
            {name}
          </li>
        ))}
      </ul>
      {/* Seats. A bundle bought the ordinary way is always a single seat (commercetools carries no
          quantity through a bundle add unless a caller opts in) and looks exactly as it did, unless
          the caller asks to always show it — the authorized-buyer checkout summary does, since a
          buyer purchasing for themselves still wants their seat count confirmed on the order. */}
      {(alwaysShowQuantity || lineItem.quantity > 1) && (
        <span className="body-s ml-2 text-gray-90">Quantity: {lineItem.quantity}</span>
      )}
    </>
  );
}
