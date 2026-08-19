import { Field, ImageField, TextField } from '@sitecore-jss/sitecore-jss-nextjs';
import { useMemo, useEffect, useRef, useCallback } from 'react';
import { StandalonePriceMapping } from 'types/pricing';
import ProductCard, { ProductCardProps } from './ProductCard/ProductCard';
import { ProductCardFields } from './ProductCard/ProductCard.types';
import useAnalyticsTracking from 'hooks/useAnalyticsTracking';
import { formatAnalyticsPrice, getListIdAndNameFromURL } from 'utils/analytics';
import { ANALYTICS_EVENTS, DEFAULT_BRAND } from 'constants/analytics';
import { useStandalonePrices, useUserSession } from 'providers/index';
import { useGetAlgoliaSearchData } from 'hooks/index';
import { TrackingItem } from 'types/index';

export interface ProductTabContentProps {
  uid: string;
  fields: {
    tabHeading: Field<string>;
    backgroundImage: ImageField;
    featuredCard: ProductCardFields;
    secondaryCards: ProductCardFields[];
    prices?: StandalonePriceMapping;
  };
}

const ProductTabContent = ({ fields }: ProductTabContentProps) => {
  const { track } = useAnalyticsTracking();
  const { currencyCode } = useUserSession();
  const eventTrackedRef = useRef<number>(0);
  const { item_list_id, item_list_name } = getListIdAndNameFromURL();
  const { showPriceForRole, isGettingPricesForRole } = useStandalonePrices();

  const getProductPrices = useCallback((sku: TextField, prices?: StandalonePriceMapping) => {
    if (!sku?.value || !prices) {
      return undefined;
    }
    return prices[String(sku.value).trim()];
  }, []);

  const data = useMemo(() => {
    const items: ProductCardProps[] = [];

    if (fields?.featuredCard?.fields) {
      items.push({
        id: fields.featuredCard.id || fields.featuredCard.fields.sku?.value,
        isFeatured: true,
        product: fields.featuredCard,
        backgroundImage: fields.backgroundImage,
        prices: getProductPrices(fields.featuredCard.fields.sku, fields.prices),
      });
    }

    fields?.secondaryCards?.forEach((card) => {
      if (card.id !== fields?.featuredCard?.id) {
        items.push({
          id: card.id,
          product: card,
          prices: getProductPrices(card.fields.sku, fields.prices),
        });
      }
    });

    return items;
  }, [fields, getProductPrices]);

  const { algoliaData } = useGetAlgoliaSearchData({
    productKeys: data.map((item) => item.product?.fields?.productKey?.value) as string[],
  });

  const itemsWithPrices = useMemo(
    () => data.filter((item) => item.prices && Object.keys(item.prices).length > 0),
    [data]
  );

  const trackingItems = useMemo(() => {
    // Only send products with prices visible to user (lazy-loaded)
    if (!isGettingPricesForRole && itemsWithPrices.length > 0 && algoliaData?.length > 0) {
      return itemsWithPrices
        .map((item, index) => {
          const attributes = algoliaData
            ?.filter((product) => product.isMasterVariant)
            .find((product) => product.productKey === item.product.fields.productKey?.value);

          if (!attributes) {
            return;
          }

          const { price, discount } = formatAnalyticsPrice({
            prices: item.prices,
            showPriceForRole,
          });

          return {
            item_id: attributes.productKey,
            item_name: attributes.parentTitle,
            ...(attributes.productTypeLabel !== undefined && {
              item_category: attributes.productTypeLabel,
            }),
            ...(attributes.division?.label !== undefined && {
              item_category2: attributes.division?.label,
            }),
            ...(attributes.modality?.label !== undefined && {
              item_category3: attributes.modality.label,
            }),
            index,
            item_brand: DEFAULT_BRAND,
            price: Number(price),
            ...(discount !== undefined && { discount }),
          };
        })
        .filter((trackingItem) => trackingItem !== undefined);
    }

    return [];
  }, [algoliaData, isGettingPricesForRole, itemsWithPrices, showPriceForRole]) as TrackingItem[];

  useEffect(() => {
    if (trackingItems.length > 0 && itemsWithPrices.length > eventTrackedRef.current) {
      track({ ecommerce: null });
      track({
        event: ANALYTICS_EVENTS.VIEW_ITEM_LIST,
        ecommerce: {
          currency: currencyCode,
          item_list_id: item_list_id,
          item_list_name: item_list_name,
          items: trackingItems,
        },
      });
      eventTrackedRef.current = trackingItems.length;
    }
  }, [currencyCode, item_list_id, item_list_name, itemsWithPrices, track, trackingItems]);

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
      {data.map((card) => (
        <ProductCard
          key={card.id}
          isFeatured={card.isFeatured}
          product={card.product}
          backgroundImage={card.backgroundImage}
          prices={card.prices}
          item_list_id={item_list_id}
          item_list_name={item_list_name}
          trackingItems={trackingItems}
        />
      ))}
    </section>
  );
};

export default ProductTabContent;
