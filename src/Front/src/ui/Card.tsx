import { useCallback, useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import {
  Field,
  ImageField,
  LinkField,
  NextImage,
  RichTextField,
  Text,
  TextField,
} from '@sitecore-jss/sitecore-jss-nextjs';

import { ColorSelector, DropLinkFieldType } from 'types/index';
import { mapHexColorToTailwindClass } from 'utils/colors';
import { useAnalyticsTracking, useIntersectionObserver } from 'hooks/index';
import RichTextUI from './RichTextUI';
import { ANALYTICS_EVENTS } from 'constants/index';

export interface CardProps {
  fields: {
    backgroundHexColor?: ColorSelector;
    className?: string;
    description?: RichTextField;
    eyebrow?: TextField;
    heading: TextField;
    headingHexColor?: DropLinkFieldType;
    image?: ImageField;
    showAsFullWidth?: Field<boolean>;
    linkCTA?: LinkField;
  };
}

const Card = ({
  fields: {
    backgroundHexColor,
    className,
    description,
    eyebrow,
    heading,
    headingHexColor,
    image,
    showAsFullWidth,
    linkCTA,
  },
}: CardProps) => {
  const [hasBeenTracked, setHasBeenTracked] = useState(false);
  const [descriptionValue, setRichTextValue] = useState('');

  const isFullWidth = Boolean(showAsFullWidth?.value) || false;
  const hasLinkCta = Boolean(linkCTA?.value?.href);
  const ctaTarget = linkCTA?.value?.target || '';

  const { track } = useAnalyticsTracking();
  const { isIntersecting, ref } = useIntersectionObserver();

  const trackCardClick = useCallback(() => {
    track({
      event: ANALYTICS_EVENTS.GA_EVENT,
      type: 'engagement',
      subtype: 'slider_slide_cta_click',
      bo1: true, // business objective 1, Awareness
      element_id: heading?.value || '',
      click_text: linkCTA?.value.text,
      click_url: linkCTA?.value.href,
    });
  }, [track, heading, linkCTA]);

  const trackCardImpression = useCallback(() => {
    track({
      event: ANALYTICS_EVENTS.GA_EVENT,
      type: 'engagement',
      subtype: 'slider_slide_impression',
      bo1: true, // business objective 1, Awareness
      element_id: heading?.value || '',
    });

    setHasBeenTracked(true);
  }, [track, heading]);

  useEffect(() => {
    if (isIntersecting && !hasBeenTracked) {
      trackCardImpression();
    }
  }, [isIntersecting, hasBeenTracked, trackCardImpression]);

  const hasImage = Boolean(image?.value?.src);

  const bgColorClass = useMemo(() => {
    const bgColor = backgroundHexColor?.fields?.backgroundColorHexCode?.value || '';
    const bgClass = mapHexColorToTailwindClass(bgColor);

    const bgColorClass = bgColor ? `bg-${bgClass}` : '';

    return bgColorClass;
  }, [backgroundHexColor]);

  const headColorClass = useMemo(() => {
    const headColor = (headingHexColor?.fields?.Value?.value as string) || '';
    const headClass = mapHexColorToTailwindClass(headColor);
    return headColor ? `text-${headClass}` : '';
  }, [headingHexColor]);

  const cardClass = useMemo(() => {
    return clsx(
      `flex flex-col shadow-card rounded-md overflow-hidden ${bgColorClass} transform transition-all ease-in-out duration-300 hover:scale-105 hover:shadow-card-hover`,
      className,
      {
        'cursor-default': !hasLinkCta,
        'min-w-247 md:min-w-304 md:w-304': !isFullWidth,
        'relative min-w-336 md:min-w-416 md:w-416': isFullWidth,
        'justify-center': !hasImage,
      }
    );
  }, [bgColorClass, className, hasLinkCta, isFullWidth, hasImage]);

  const imageClass = useMemo(() => {
    return clsx({ 'absolute object-cover': isFullWidth, 'object-contain': !isFullWidth });
  }, [isFullWidth]);

  const containerClass = useMemo(() => {
    return clsx('p-6', headColorClass, {
      'p-6 md:p-8 absolute bottom-0 left-0 text-white-00': hasImage && isFullWidth,
    });
  }, [hasImage, headColorClass, isFullWidth]);

  useEffect(() => {
    setRichTextValue(description?.value ?? '');
  }, [hasImage, description]);

  return (
    <a
      onClick={trackCardClick}
      href={linkCTA?.value.href || 'javascript:void(0)'}
      target={ctaTarget}
      className={cardClass}
      tabIndex={linkCTA?.value.href ? 0 : -1}
      ref={ref}
    >
      <div
        className={clsx({
          'min-h-289 md:min-h-416': hasImage && isFullWidth,
          'w-247 h-247 md:w-304 md:h-304': hasImage && !isFullWidth,
        })}
      >
        {hasImage && <NextImage field={image} className={imageClass} fill={isFullWidth} />}
        {hasImage && isFullWidth && (
          <span className="absolute top-0 right-0 bottom-0 left-0 bg-gradient-to-t from-black-100" />
        )}
      </div>
      <div className={containerClass}>
        {Boolean(eyebrow?.value) && <Text className="eyebrow mb-4" tag="p" field={eyebrow} />}
        <Text tag="h2" className="body-l md:headline-s mb-4 line-clamp-2" field={heading} />
        {Boolean(description?.value) && (
          <RichTextUI
            className={clsx('body-m', hasImage && 'line-clamp-2')}
            value={descriptionValue}
          />
        )}
        {Boolean(linkCTA?.value.text) && (
          <span className="cta with-chevron mt-6 border-b-2 border-transparent hover:border-darker-green pb-1">
            {linkCTA?.value.text}
          </span>
        )}
      </div>
    </a>
  );
};

export default Card;
