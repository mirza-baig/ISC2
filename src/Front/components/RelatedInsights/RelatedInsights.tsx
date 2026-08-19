import {
  ComponentRendering,
  Field,
  ImageField,
  LinkField,
  RouteData,
} from '@sitecore-jss/sitecore-jss-nextjs';
import clsx from 'clsx';
import { useCallback } from 'react';
import { ComponentProps } from 'lib/component-props';

import { useAnalyticsTracking } from 'hooks/index';
import { DropLinkFieldType } from 'types/index';
import { SectionTitle } from 'ui/index';
import { getContrastTextColor, formatBackgroundColorCssClassName } from 'utils/index';
import { RelatedInsightsCard, RelatedInsightCardType } from 'ui/RelatedInsightsCard';
import { ANALYTICS_EVENTS } from 'constants/index';

export type RelatedInsightsProps = ComponentProps & {
  rendering: ComponentRendering | RouteData;
  fields?: {
    title: Field<string>;
    linkCta: LinkField;
    defaultThumbnailImage: ImageField;
    backgroundGradient?: DropLinkFieldType;
    insightCards?: RelatedInsightCardType[];
  };
};

export default function RelatedInsights({ fields }: RelatedInsightsProps) {
  const { track } = useAnalyticsTracking();

  const backgroundColor = formatBackgroundColorCssClassName(fields?.backgroundGradient);
  const textColor = getContrastTextColor(fields?.backgroundGradient);

  const trackCardClick = useCallback(
    (card: RelatedInsightCardType) => {
      if (card.fields) {
        track({
          event: ANALYTICS_EVENTS.GA_EVENT,
          type: 'engagement',
          subtype: 'insights_related_item_click',
          click_text: card.fields.articleHeading?.value,
          click_url: card.url,
          bo1: true, // business objective 1, Awareness
        });
      }
    },
    [track]
  );

  if (!fields) {
    return null;
  }

  return (
    <section
      className={clsx(
        'px-5 md:px-16 py-14 md:py-20 space-y-8 md:space-y-10 mb-14 md:mb-20',
        backgroundColor,
        textColor
      )}
    >
      <SectionTitle
        title={fields.title}
        link={fields.linkCta}
        className="md:flex md:flex-row md:justify-between md:items-end"
      />
      {fields.insightCards && (
        <RelatedInsightsCard
          insightCards={fields.insightCards}
          defaultImage={fields.defaultThumbnailImage}
          trackCardClick={trackCardClick}
        />
      )}
    </section>
  );
}
