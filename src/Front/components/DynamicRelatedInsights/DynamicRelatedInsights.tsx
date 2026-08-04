/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
  ComponentRendering,
  Field,
  ImageField,
  Item,
  LinkField,
  RouteData,
} from '@sitecore-jss/sitecore-jss-nextjs';
import clsx from 'clsx';
import { ComponentProps } from 'lib/component-props';
import { DropLinkFieldType } from 'types/index';
import { SectionTitle } from 'ui/index';
import { getContrastTextColor, formatBackgroundColorCssClassName } from 'utils/index';
import { RelatedInsightsCard } from 'ui/RelatedInsightsCard';
import { useMemo } from 'react';
import { AlgoliaInsightHit } from 'lib/page-props';

interface ArticleTag extends Item {
  fields: {
    name?: {
      value: string;
    };
    hubPageUrl?: {
      value: string;
    };
  };
}

export type CardDataType = {
  url: string;
  fields: {
    articleHeading: { value: string };
    articleDate: { value: string };
    thumbnailImage: {
      value: {
        src: string;
        width: string;
        height: string;
        alt: string;
      };
    };
    eyebrow: { value: string };
  };
};

export type DynamicRelatedInsightsProps = ComponentProps & {
  rendering: ComponentRendering | RouteData;
  fields?: {
    title: Field<string>;
    linkCta: LinkField;
    defaultThumbnailImage?: ImageField;
    backgroundGradient?: DropLinkFieldType;
    topics?: ArticleTag;
    primaryTagForRelatedInsights?: Field<string>;
  };
  relatedInsights?: AlgoliaInsightHit[];
};

export default function DynamicRelatedInsights({
  fields,
  relatedInsights = [],
}: DynamicRelatedInsightsProps) {
  const backgroundColor = formatBackgroundColorCssClassName(fields?.backgroundGradient);
  const textColor = getContrastTextColor(fields?.backgroundGradient);

  const topicName = fields?.topics?.fields?.name?.value;
  const primaryTagName = fields?.primaryTagForRelatedInsights?.value;
  const searchTag = primaryTagName || topicName;

  const isValidImageUrl = (url?: string): boolean => {
    return !!url && url.trim() !== '' && url !== 'undefined' && url !== 'null';
  };

  const cardData = useMemo(() => {
    if (!relatedInsights.length) {
      return [];
    }

    const currentPathname =
      typeof window !== 'undefined' ? new URL(window.location.href).pathname : '';

    const filteredHits = relatedInsights
      .filter((item: AlgoliaInsightHit) => {
        if (typeof window === 'undefined') return true;
        const itemPathname = new URL(item.url, window.location.origin).pathname;
        return itemPathname !== currentPathname;
      })
      .slice(0, 3);

    const defaultImages = [
      'https://edge.sitecorecloud.io/internation15d1-xmcfa72-dev541a-14de/media/Project/ISC2/Main/Components/Related-Insights/Thumbnal-FPO-No-Image.png?h=416&iar=0&w=416',
    ];

    const cardList = filteredHits.map((item: AlgoliaInsightHit, index) => {
      const title =
        item._highlightResult?.title?.value || item.articleTitle || `Article ${index + 1}`;

      const defaultImage = defaultImages[index % defaultImages.length];
      const imageSrc = isValidImageUrl(item.thumbnailImage) ? item.thumbnailImage : defaultImage;

      return {
        url: item.url,
        fields: {
          articleHeading: { value: title },
          articleDate: { value: item.createdDate },
          thumbnailImage: {
            value: {
              src: imageSrc,
              width: '416',
              height: '416',
              alt: '',
            },
          },
          eyebrow: { value: item.genericType },
        },
      };
    });

    return cardList;
  }, [relatedInsights, searchTag, isValidImageUrl]);

  if (!fields) {
    return null;
  }

  if (!cardData.length) {
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

      {cardData && (
        <RelatedInsightsCard insightCards={cardData} defaultImage={fields.defaultThumbnailImage} />
      )}
    </section>
  );
}
