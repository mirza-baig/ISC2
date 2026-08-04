import { ImageField, NextImage } from '@sitecore-jss/sitecore-jss-nextjs';

import { StandalonePriceMapping, TrackingItem } from 'types/index';

import { ProductCardContent } from './ProductCardContent/ProductCardContent';
import { ProductCardFields } from './ProductCard.types';

export type ProductCardProps = {
  id?: string | number;
  product: ProductCardFields;
  isFeatured?: boolean;
  backgroundImage?: ImageField;
  prices?: StandalonePriceMapping['key'];
  classNames?: string;
  item_list_id?: string;
  item_list_name?: string;
  trackingItems?: TrackingItem[];
};

const ProductCard = ({
  isFeatured,
  product,
  backgroundImage,
  prices = {},
  classNames,
  item_list_id,
  item_list_name,
  trackingItems,
}: ProductCardProps) => {
  if (isFeatured) {
    return (
      <div className="grid sm:grid-cols-2 md:grid-cols-3 col-start-1 col-end-1 sm:col-end-3 md:col-end-4 gap-6 sm:gap-10 sm:p-4 relative">
        <NextImage
          field={backgroundImage}
          fill
          className="hidden sm:flex rounded-lg object-cover"
        />

        <ProductCardContent
          isFeatured
          product={product}
          classNames={classNames}
          backgroundImage={backgroundImage}
          prices={prices}
          item_list_id={item_list_id}
          item_list_name={item_list_name}
          trackingItems={trackingItems}
        />
      </div>
    );
  }

  return (
    <ProductCardContent
      product={product}
      classNames={classNames}
      prices={prices}
      item_list_id={item_list_id}
      item_list_name={item_list_name}
      trackingItems={trackingItems}
    />
  );
};

export default ProductCard;
