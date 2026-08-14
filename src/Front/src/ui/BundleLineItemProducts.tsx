import { useMemo } from 'react';
import { BundleLineItem } from 'types/miniCart';

import { getVariantAttributes, isBundleLineItem } from 'utils/cart';

export namespace BundleLineItemProducts {
  export type Props = {
    lineItem: BundleLineItem;
  };
}

export function BundleLineItemProducts({ lineItem }: BundleLineItemProducts.Props) {
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
      {/* Seats. Rendered only above one, so a bundle bought the ordinary way (always a single seat
          — commercetools carries no quantity through a bundle add unless a caller opts in) looks
          exactly as it did. A B2B buyer purchasing for a group otherwise sees only a multiplied
          total with nothing on the row explaining it. */}
      {lineItem.quantity > 1 && (
        <span className="body-s ml-2 text-gray-90">Quantity: {lineItem.quantity}</span>
      )}
    </>
  );
}
