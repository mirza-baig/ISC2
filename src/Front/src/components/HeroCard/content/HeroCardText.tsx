import { Link, LinkField } from '@sitecore-jss/sitecore-jss-nextjs';
import clsx from 'clsx';

import { useAnalyticsTracking } from 'hooks/index';
import { RichTextUI } from 'ui/index';

import { HeroCardBaseProps } from '../types';
import { ANALYTICS_EVENTS } from 'constants/index';

interface HeroCardTextProps extends HeroCardBaseProps {
  slidesCount: number;
  padding?: string;
  color?: string;
  ctaColor?: string;
  isLoading?: boolean;
}

const LoadingSkeleton = ({ className }: { className?: string }) => (
  <div className={clsx('z-1 overflow-hidden animate-pulse flex-1', className)}>
    <div className="h-3 w-3/12 bg-gray-300 mb-1" />
    <section className="space-y-5 xl:space-y-8 w-full">
      <div className="h-10 sm:h-12 w-6/12 bg-gray-300" />
      <div className="h-4 w-10/12 bg-gray-300" />
      <footer className="flex space-x-6 items-start">
        <div className="h-11 w-4/12 bg-gray-300" />
        <div className="h-11 w-4/12 bg-gray-300" />
      </footer>
    </section>
  </div>
);

const HeroCardText = ({
  id,
  color,
  padding,
  ctaColor,
  fields,
  isLoading,
  slidesCount,
}: HeroCardTextProps) => {
  const { track } = useAnalyticsTracking();

  const trackCtaClick = (cta: LinkField) => {
    track({
      event: ANALYTICS_EVENTS.GA_EVENT,
      type: 'engagement',
      subtype: 'hero_slide_cta_click',
      bo1: true,
      bo2: true,
      click_text: cta.value.text?.toLowerCase() || '',
      click_url: cta.value.href?.toLowerCase() || '',
      element_id: id,
    });
  };

  if (!fields) {
    return null;
  }

  if (isLoading) {
    return <LoadingSkeleton className={padding} />;
  }

  return (
    <div className={clsx('z-1 overflow-hidden', padding, color)}>
      {Boolean(fields.eyebrow.value) && <h6 className="eyebrow mb-1">{fields.eyebrow.value}</h6>}
      <section className="space-y-5 xl:space-y-8 w-full">
        <h1 className="headline-l sm:headline-xl xl:headline-xxl xl:leading-80 line-clamp-2">
          {fields.headline.value}
        </h1>

        {Boolean(fields.description.value) && (
          <RichTextUI
            className={clsx({ 'line-clamp-4': slidesCount > 1 })}
            value={fields.description.value}
          />
        )}

        <footer className="flex space-x-6 items-start">
          {Boolean(fields.primaryCTA?.value.href) && (
            <Link
              field={fields.primaryCTA!}
              className={clsx('primary-cta truncate', ctaColor)}
              onClick={() => trackCtaClick(fields.primaryCTA!)}
            />
          )}
          {Boolean(fields.secondaryCTA?.value.href) && (
            <Link
              field={fields.secondaryCTA!}
              className={clsx('secondary-cta truncate', ctaColor)}
              onClick={() => trackCtaClick(fields.secondaryCTA!)}
            />
          )}
        </footer>
      </section>
    </div>
  );
};

export default HeroCardText;
