import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Link, LinkField, RichTextField, Text, TextField } from '@sitecore-jss/sitecore-jss-nextjs';
import clsx from 'clsx';

import ProductCard, { ProductCardProps } from 'components/ProductTabs/ProductCard/ProductCard';
import { useBreakpoint, useAnalyticsTracking, useGetAlgoliaSearchData } from 'hooks/index';
import { getAbsolutePath } from 'utils/location';
import { StandalonePriceMapping, TrackingItem } from 'types/index';
import { useStandalonePrices, useUserSession } from 'providers/index';

import Card, { CardProps } from './Card';
import RichTextUI from './RichTextUI';
import { ANALYTICS_EVENTS, DEFAULT_BRAND } from 'constants/index';
import { formatAnalyticsPrice, getListIdAndNameFromURL } from 'utils/analytics';

const isProductCardsSlider = (cards: CardConditionalProps['cards']): cards is ProductCardProps[] =>
  cards.length > 0 && 'product' in cards[0];

type CardConditionalProps =
  | { cards: CardProps[]; prices?: never; isGettingPrices?: never }
  | { cards: ProductCardProps[]; prices?: StandalonePriceMapping };

type SliderProps = CardConditionalProps & {
  description?: RichTextField;
  heading?: TextField;
  linkCta?: LinkField;
  wrapperClassNames?: string;
  cardsClassNames?: string;
};

const SCROLL_THRESHOLD = 120;

const Slider = ({
  cards,
  description,
  heading,
  linkCta,
  wrapperClassNames = '',
  cardsClassNames = '',
}: SliderProps) => {
  const { track } = useAnalyticsTracking();
  const { currencyCode } = useUserSession();
  const { productPrices, showPriceForRole, isGettingPricesForRole } = useStandalonePrices();
  const { item_list_id, item_list_name } = getListIdAndNameFromURL();
  const eventTrackedRef = useRef<number>(0);

  const hasInfo =
    Boolean(heading?.value) ||
    Boolean(description?.value) ||
    (Boolean(linkCta?.value?.text) && Boolean(linkCta?.value?.href));

  const firstCardRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const breakpoint = useBreakpoint();

  const isExpandable = useMemo(() => !['sm', 'max-sm'].includes(breakpoint), [breakpoint]);

  const onSliderScrolled = useCallback(() => {
    const scroll = firstCardRef.current?.scrollLeft;

    if (scroll === undefined || scroll > SCROLL_THRESHOLD || !isExpandable) {
      return;
    }

    const percentage = (scroll * 100) / SCROLL_THRESHOLD;

    if (titleRef.current && listRef.current) {
      listRef.current.style.transform = `translateX(-${1.6 * scroll}px)`;
      listRef.current.style.marginRight = `-${scroll}px`;

      titleRef.current.style.opacity = `${100 - percentage}%`;
    }
  }, [isExpandable]);

  const productKeys = useMemo(() => {
    return isProductCardsSlider(cards)
      ? cards?.reduce<string[]>((acc, item: ProductCardProps) => {
          if (!Array.isArray(acc)) {
            acc = [];
          }
          const key = item?.product?.fields?.productKey?.value;
          if (key) acc.push(key as string);
          return acc;
        }, [])
      : [];
  }, [cards]);

  const { algoliaData } = useGetAlgoliaSearchData({
    productKeys,
  });

  const trackingItems = useMemo(() => {
    // Only send products with prices visible to user (lazy-loaded)
    if (
      isProductCardsSlider(cards) &&
      !isGettingPricesForRole &&
      Object.keys(productPrices).length > 0 &&
      algoliaData?.length > 0
    ) {
      return cards.reduce((acc: TrackingItem[], item, index) => {
        if (!Array.isArray(acc)) {
          acc = [];
        }

        const attributes = algoliaData
          ?.filter((product) => product.isMasterVariant)
          .find((product) => product.productKey === item?.product?.fields?.productKey?.value);

        if (!attributes) {
          return;
        }

        const sku = item?.product?.fields?.sku?.value;

        if (sku && productPrices[sku]) {
          const { price, discount } = formatAnalyticsPrice({
            prices: productPrices[sku],
            showPriceForRole,
          });

          if (Array.isArray(acc)) {
            acc.push({
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
            });
          }
        }

        return acc;
      }, []);
    }

    return [];
  }, [algoliaData, cards, isGettingPricesForRole, productPrices, showPriceForRole]);

  useEffect(() => {
    if (
      trackingItems &&
      trackingItems.length > 0 &&
      trackingItems.length > eventTrackedRef.current
    ) {
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
      eventTrackedRef.current = Object.keys(trackingItems).length;
    }
  }, [currencyCode, item_list_id, item_list_name, productPrices, track, trackingItems]);

  useEffect(() => {
    if (!isExpandable && titleRef.current) {
      titleRef.current.style.opacity = '100%';
    }

    if (!isExpandable && listRef.current) {
      listRef.current.style.transform = 'translateX(0px)';
      listRef.current.style.marginRight = '0px';
    }
  }, [isExpandable]);

  useEffect(() => {
    const firstCard = firstCardRef.current;

    if (firstCard) {
      firstCard.addEventListener('scroll', onSliderScrolled);
    }

    return () => {
      if (firstCard) {
        firstCard.removeEventListener('scroll', onSliderScrolled);
      }
    };
  }, [onSliderScrolled]);

  useEffect(() => {
    const container = firstCardRef.current;
    const isOverflowing = container != null && container.scrollWidth > container.clientWidth;

    if (isOverflowing) {
      container?.classList?.add('slider-scrollbar');
    } else {
      container?.classList?.remove('slider-scrollbar');
    }
  }, [isExpandable]);

  const trackCardClick = () => {
    track({
      event: ANALYTICS_EVENTS.GA_EVENT,
      type: 'engagement',
      subtype: 'slider_slide_cta_click',
      bo1: true,
      element_id: heading?.value || '',
      click_text: linkCta?.value?.text,
      click_url: getAbsolutePath(linkCta?.value?.href),
    });
  };

  return (
    <div className={clsx('pb-14 md:pb-20 pl-5 md:pl-16', wrapperClassNames)} tabIndex={0}>
      <div
        ref={firstCardRef}
        className="flex flex-col md:flex-row md:pb-6 overflow-x-hidden md:overflow-x-auto slider-scrollbar slider-container"
      >
        {hasInfo && (
          <div
            ref={titleRef}
            className="flex-none text-black-100 transition-all duration-300 overflow-hidden pr-8 w-full md:w-304 cursor-default info-card"
          >
            {heading?.value && <Text className="headline-l mb-4" tag="h2" field={heading} />}
            {Boolean(description?.value) && (
              <RichTextUI className="body-m mb-6" value={description?.value} />
            )}
            {linkCta?.value?.text && linkCta?.value?.href && (
              <Link
                className="cta mt-4 sm:mt-0 focus-underline-lime key-focus with-chevron border-b-2 border-transparent hover:border-darker-green pb-1"
                field={linkCta}
                onClick={trackCardClick}
              />
            )}
          </div>
        )}
        <div
          ref={listRef}
          className={clsx(
            'flex cards-container sm:bg-white flex-row py-6 md:py-4 space-x-8 cursor-default overflow-x-auto md:overflow-x-visible transition-all slider-scrollbar duration-300',
            !hasInfo && 'px-0 md:px-5',
            cardsClassNames
          )}
        >
          {!isProductCardsSlider(cards) &&
            cards?.map((card, index) => <Card key={index} fields={card.fields} />)}

          {isProductCardsSlider(cards) &&
            cards?.map((card) => (
              <ProductCard
                key={card.product.id}
                product={card.product}
                isFeatured={card.isFeatured}
                prices={productPrices ? productPrices[card.product.fields.sku.value!] : undefined}
                backgroundImage={card.backgroundImage}
                classNames={card.classNames}
                trackingItems={trackingItems}
                item_list_id={item_list_id}
                item_list_name={item_list_name}
              />
            ))}
          <div className="w-5 md:hidden">&nbsp;</div>
        </div>
      </div>
    </div>
  );
};

export default Slider;
