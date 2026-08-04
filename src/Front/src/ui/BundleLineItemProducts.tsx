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
    <ul className="body-s flex flex-col text-gray-90 list-disc list-inside ml-2 gap-y-1">
      {bundleProductNames.map((name) => (
        <li key={name} className="body-s">
          {name}
        </li>
      ))}
    </ul>
  );
}
