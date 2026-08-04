import clsx from 'clsx';
import { ImageField, NextImage } from '@sitecore-jss/sitecore-jss-nextjs';
import { useCallback, useEffect, useMemo, useRef } from 'react';

import { PromoPill } from 'ui/index';
import { PromoPills, StandalonePriceMapping, TrackingItem } from 'types/index';
import { parseFieldsFromURLString } from 'utils/index';
import { useAnalyticsTracking } from 'hooks/index';
import { useStandalonePrices, useUserSession } from 'providers/index';

import { ProductCardButtons } from './ProductCardButtons';
import { ProductCardAttributes } from './ProductCardAttributes';
import { ProductCardPricing } from './ProductCardPricing';
import { ProductCardFields } from '../ProductCard.types';
import { ANALYTICS_EVENTS } from 'constants/index';

export namespace ProductCardContent {
  export type Props = {
    product: ProductCardFields;
    classNames?: string;
    isFeatured?: boolean;
    backgroundImage?: ImageField;
    prices?: StandalonePriceMapping['key'];
    item_list_id?: string;
    item_list_name?: string;
    trackingItems?: TrackingItem[];
  };
}

export const ProductCardContent = ({
  product,
  prices,
  classNames,
  isFeatured,
  backgroundImage,
  item_list_id,
  item_list_name,
  trackingItems,
}: ProductCardContent.Props) => {
  const { fields } = product;
  const { track } = useAnalyticsTracking();
  const { currencyCode } = useUserSession();
  const blockRef = useRef<HTMLDivElement | null>(null);
  const { productPrices, pendingStandalonePriceSkus, addSkuToPricingQueue } = useStandalonePrices();

  const promoPills = parseFieldsFromURLString<PromoPills>(fields.promoPills);
  const redirectUrl = fields.productExternalUrl?.value?.href || product.url;
  const showTopRow = Boolean(fields.headlinePill?.value || promoPills.regularPill);

  const trackCardClick = useCallback(() => {
    if (fields) {
      const subtype = isFeatured ? 'product_tab_featured_click' : 'product_tab_click';
      const clickedSku = fields.productKey?.value;
      const clickedItem = trackingItems?.find((item) => item.item_id === clickedSku);

      track({
        event: ANALYTICS_EVENTS.GA_EVENT,
        type: 'lead',
        subtype,
        click_text: fields.headline?.value || '',
        bo1: true,
        bo2: true,
        click_url: redirectUrl,
      });

      track({ ecommerce: null });
      track({
        event: ANALYTICS_EVENTS.SELECT_ITEM,
        ecommerce: {
          currency: currencyCode,
          item_list_id: item_list_id,
          item_list_name: item_list_name,
          items: [clickedItem],
        },
      });
    }
  }, [
    fields,
    isFeatured,
    trackingItems,
    track,
    redirectUrl,
    currencyCode,
    item_list_id,
    item_list_name,
  ]);

  useEffect(() => {
    const block = blockRef?.current;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && product?.fields?.sku?.value) {
          addSkuToPricingQueue([`${product.fields.sku.value}`]);
        }
      },
      {
        threshold: 0,
      }
    );

    if (block) {
      observer.observe(block);
    }

    return () => {
      if (block) {
        observer.unobserve(block);
      }
    };
  }, [product.fields.sku, productPrices, addSkuToPricingQueue]);

  const isLoading = useMemo(() => {
    return Boolean(
      product?.fields?.sku?.value &&
        pendingStandalonePriceSkus.includes(`${product.fields.sku.value}`)
    );
  }, [pendingStandalonePriceSkus, product?.fields?.sku?.value]);

  return (
    <div
      className={clsx(
        'relative flex flex-col w-full bg-white-00 px-6 sm:px-6 shadow-xl rounded-lg hover:shadow-2xl pb-10',
        classNames
      )}
      ref={blockRef}
    >
      <a
        onClick={trackCardClick}
        className="flex pointer flex-col flex-1"
        href={redirectUrl}
        target={fields.productExternalUrl?.value?.target}
      >
        <div className="w-full flex flex-col flex-1">
          {isFeatured && (
            <NextImage
              field={backgroundImage}
              width={336}
              height={256}
              className="flex sm:hidden rounded-t-lg absolute top-0 left-0 w-full h-64 object-cover"
            />
          )}

          <NextImage
            field={fields.badgeLogoImage}
            width={272}
            height={272}
            className={clsx(
              'left-2/4 -translate-x-2/4 aspect-square absolute flex items-center justify-center',
              isFeatured && 'top-28 sm:top-1 w-60 sm:w-68',
              !isFeatured && 'top-5 sm:top-9 md:top-5 w-68'
            )}
          />

          {showTopRow && (
            <div className="absolute top-6 left-6 flex flex-row flex-wrap gap-2">
              <PromoPill
                className="body-s text-white-00 bg-isc2-green"
                field={fields.headlinePill}
              />

              <PromoPill
                field={{ value: promoPills.regularPill }}
                className="border border-gray-50"
              />
            </div>
          )}

          <section
            className={clsx('pt-60 flex flex-col grow justify-end', isFeatured && 'pt-80 sm:pt-60')}
          >
            <PromoPill
              field={{
                value: `${promoPills.discountPillNumber} ${promoPills.discountPillComplement}`,
              }}
              className="border border-discount mb-2"
            />

            <h4 className="body-l h-13 line-clamp-2">{fields.headline?.value}</h4>

            {fields.description?.value && (
              <p className="body-s mt-2 line-clamp-3">{fields.description.value}</p>
            )}
          </section>

          <ProductCardAttributes {...fields} />
          <ProductCardPricing
            prices={prices}
            isLoading={isLoading}
            isForFreeText={fields.isForFreeText}
            regularPriceText={fields.regularPriceText}
            candidatePriceText={fields.candidatePriceText}
            memberPriceText={fields.memberPriceText}
            associatePriceText={fields.associatePriceText}
          />
        </div>
      </a>
      <ProductCardButtons
        secondaryCta={fields.cta}
        loginBtnText={fields.loginBtnText}
        item_list_id={item_list_id}
        item_list_name={item_list_name}
        trackingItems={trackingItems}
        productKey={fields.productKey?.value}
      />
    </div>
  );
};
