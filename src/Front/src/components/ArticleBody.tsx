import { ComponentRendering, Field, RouteData } from '@sitecore-jss/sitecore-jss-nextjs';
import { ComponentProps } from 'lib/component-props';
import { useCallback, useEffect, useMemo } from 'react';

import { ArticleAuthorProps } from './ArticleAuthor/ArticleAuthor';
import ArticleAuthorList from './ArticleAuthor/ArticleAuthorList';

import { useAnalyticsTracking } from 'hooks/index';
import { RichTextUI } from 'ui/index';
import clsx from 'clsx';
import { ImageField, Item, LinkField, useSitecoreContext } from '@sitecore-jss/sitecore-jss-nextjs';
import DynamicRelatedInsights from './DynamicRelatedInsights/DynamicRelatedInsights';
import { AlgoliaInsightHit } from 'lib/page-props';

interface RouteFields {
  articleHeading?: {
    value: string;
  };
  articleDate?: {
    value: string;
  };
  thumbnailImage?: ImageField;
  ogImage?: ImageField;
}

interface ArticleSchema {
  '@context': string;
  '@type': string;
  headline?: string;
  image?: string[];
  datePublished?: string;
  dateModified?: string;
  author?: Array<{
    '@type': string;
    name: string;
    jobTitle?: string;
  }>;
  publisher: {
    '@type': string;
    name: string;
  };
}

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

type ArticleBodyProps = ComponentProps & {
  rendering: ComponentRendering | RouteData;
  fields: {
    articleBody: Field<string>;
    primaryTagForRelatedInsights?: ArticleTag;
    articleTags?: ArticleTag[];
    RelatedInsightsTitle?: Field<string>;
    RelatedInsightsCTA?: LinkField;
    defaultThumbnailImage?: ImageField;
    articleAuthors?: ArticleAuthorProps[];
  };
  relatedInsights?: AlgoliaInsightHit[];
};

const ArticleBody = ({ rendering, fields, params, relatedInsights }: ArticleBodyProps) => {
  const { track } = useAnalyticsTracking();
  const { sitecoreContext } = useSitecoreContext();

  const hasPrimaryTag = !!fields?.primaryTagForRelatedInsights?.fields?.name?.value;
  const hasAuthors = fields?.articleAuthors && fields.articleAuthors.length > 0;

  const primaryTag = hasPrimaryTag
    ? fields?.primaryTagForRelatedInsights?.fields?.name?.value || ''
    : fields?.articleTags?.[0]?.fields?.name?.value || '';

  const relatedInsightsTitle = fields?.RelatedInsightsTitle?.value
    ? fields.RelatedInsightsTitle.value
    : `${primaryTag} Insights`;

  const dynamicInsightsTitle = relatedInsightsTitle;

  const relatedInsightsCTA: LinkField =
    typeof fields?.RelatedInsightsCTA === 'object' &&
    'value' in fields.RelatedInsightsCTA &&
    fields.RelatedInsightsCTA?.value?.href
      ? (fields.RelatedInsightsCTA as LinkField)
      : {
          value: {
            href:
              (hasPrimaryTag
                ? fields?.primaryTagForRelatedInsights?.fields?.hubPageUrl?.value
                : fields?.articleTags?.[0]?.fields?.hubPageUrl?.value) || '',
            text:
              'Read all ' +
                (hasPrimaryTag
                  ? fields?.primaryTagForRelatedInsights?.fields?.name?.value
                  : fields?.articleTags?.[0]?.fields?.name?.value) +
                ' Articles' || 'Read more',
          },
        };

  const trackArticleView = useCallback(() => {
    if (!sitecoreContext.route) {
      return;
    }

    track({
      event: 'article_view',
      article_title: (sitecoreContext.route.fields as RouteFields)?.articleHeading?.value || '',
      article_date: (sitecoreContext.route.fields as RouteFields)?.articleDate?.value || '',
      primary_tag: primaryTag || '',
      has_authors: hasAuthors,
    });
  }, [sitecoreContext, primaryTag, hasAuthors, track]);

  const generateJsonLd = useMemo(() => {
    if (!fields || !sitecoreContext?.route) return null;

    const route = sitecoreContext.route;
    const routeFields = route.fields as RouteFields;

    const schema: ArticleSchema = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      publisher: { '@type': 'Organization', name: 'ISC2' },
    };

    if (routeFields?.articleHeading?.value) {
      schema.headline = routeFields.articleHeading.value;
    } else if (route.displayName) {
      schema.headline = route.displayName;
    }

    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const toFullUrl = (src: string) => (src.startsWith('http') ? src : `${origin}${src}`);

    const bodyImageSrcs = fields.articleBody?.value
      ? [...fields.articleBody.value.matchAll(/<img[^>]+src="([^"]+)"/g)].map((m) =>
          m[1].replace(/&amp;/g, '&')
        )
      : [];

    const imageSrcs = [
      fields.defaultThumbnailImage?.value?.src,
      routeFields?.thumbnailImage?.value?.src,
      routeFields?.ogImage?.value?.src,
      ...bodyImageSrcs,
    ]
      .filter((src): src is string => Boolean(src))
      .map(toFullUrl);

    const seenBases = new Set<string>();
    const uniqueImages = imageSrcs.filter((url) => {
      const base = url.split('?')[0];
      if (seenBases.has(base)) return false;
      seenBases.add(base);
      return true;
    });

    if (uniqueImages.length > 0) {
      schema.image = uniqueImages;
    }

    if (routeFields?.articleDate?.value) {
      schema.datePublished = routeFields.articleDate.value;
      schema.dateModified = routeFields.articleDate.value;
    }

    if (fields.articleAuthors && fields.articleAuthors.length > 0) {
      schema.author = fields.articleAuthors
        .filter((author) => author.fields?.authorName?.value)
        .map((author) => ({
          '@type': 'Person',
          name: String(author.fields?.authorName?.value || ''),
          ...(author.fields?.authorDescription?.value && {
            jobTitle: String(author.fields.authorDescription.value),
          }),
        }));
    }

    return JSON.stringify(schema, null, 2);
  }, [fields, sitecoreContext]);

  useEffect(() => {
    trackArticleView();
  }, [trackArticleView]);

  const dynamicInsightsProps = {
    title: { value: dynamicInsightsTitle },
    linkCta: relatedInsightsCTA,
    primaryTagForRelatedInsights: { value: primaryTag || '' },
    defaultThumbnailImage: fields.defaultThumbnailImage,
  };

  return (
    <div className="flex flex-wrap gap-8 px-5 py-14 md:px-16 md:py-20">
      {generateJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: generateJsonLd }} />
      )}
      {hasAuthors && <ArticleAuthorList authors={fields?.articleAuthors || []} />}
      <div className={clsx('flex-1', hasAuthors && 'md:px-20 lg:px-28')}>
        <RichTextUI className="article-body" value={fields.articleBody.value} />
        <DynamicRelatedInsights
          fields={dynamicInsightsProps}
          rendering={rendering}
          params={params}
          relatedInsights={relatedInsights}
        />
      </div>
    </div>
  );
};

export default ArticleBody;
