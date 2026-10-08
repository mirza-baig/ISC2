import React from 'react';
import { NextImage, Text } from '@sitecore-jss/sitecore-jss-nextjs';

import { useAnalyticsTracking } from 'hooks/index';
import { PrefetchLink as Link } from 'utils/index';

import { PromoCard } from 'types/index';
import { ANALYTICS_EVENTS } from 'constants/index';

interface PromoBannerProps {
  promoCard: PromoCard | null;
}

const PromoBanner: React.FC<PromoBannerProps> = ({ promoCard }) => {
  const { track } = useAnalyticsTracking();

  if (!promoCard) {
    return null;
  }

  const handlePromoClick = (evt: React.MouseEvent): void => {
    const anchorElement = evt.currentTarget as HTMLAnchorElement;

    const anchorText = anchorElement.innerText.toLowerCase().replace(/[^a-zA-Z ]/g, '');
    const anchorHref = anchorElement.href.toLowerCase();

    track({
      event: ANALYTICS_EVENTS.GA_EVENT,
      type: 'engagement',
      bo1: true,
      bo2: true,
      bo3: true,
      subtype: 'navigation_promo_click',
      click_text: anchorText,
      click_url: anchorHref,
    });
  };

  const ctaText = promoCard.promoLinkCTA?.value?.text;
  const hasCta = Boolean(ctaText && promoCard.promoLinkCTA?.value?.href);

  return (
    <Link
      className="group flex relative bg-dark-blue rounded-lg aspect-square w-full max-w-246 max-h-246 overflow-hidden"
      field={promoCard.promoLinkCTA}
      onClick={handlePromoClick}
    >
      {promoCard.promoImage?.value?.src && (
        <>
          <span className="absolute inset-0 bg-gradient-to-t from-black-100 z-1" />
          <NextImage
            field={promoCard.promoImage}
            className="w-full h-full object-cover"
            fill
            priority
          />
        </>
      )}
      <div className="absolute left-4 right-4 bottom-4 z-1 overflow-hidden text-white-00">
        {Boolean(promoCard.promoHeading?.value) && (
          <Text
            tag="h2"
            className="mb-4 body-l tracking-promo-banner-heading font-normal w-214 line-clamp-2"
            field={promoCard.promoHeading}
          />
        )}
        {hasCta && (
          <div className="flex justify-between flex-col sm:flex-row">
            <span className="cta tracking-promo-banner-link mt-4 sm:mt-0 focus-underline-dark-green with-chevron group-focus-visible:underline">
              {ctaText}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
};

export default PromoBanner;
