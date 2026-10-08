import { useMemo } from 'react';
import Head from 'next/head';
import {
  ComponentRendering,
  HtmlElementRendering,
  PlaceholdersData,
  useSitecoreContext,
} from '@sitecore-jss/sitecore-jss-nextjs';

import { ProductCardFields } from './ProductCard/ProductCard.types';
import { ProductTabContentProps } from './ProductTabContent';

const PRODUCT_TABS_CONTAINER = 'ProductTabsContainer';
const PRODUCT_TABS_PLACEHOLDER = 'product-tabs';

interface CourseListItem {
  '@type': 'ListItem';
  position: number;
  item: {
    '@type': 'Course';
    url: string;
    name: string;
    description: string;
    provider: {
      '@type': 'Organization';
      name: string;
      sameAs: string;
    };
  };
}

const collectProductCards = (placeholders?: PlaceholdersData): ProductCardFields[] => {
  if (!placeholders) {
    return [];
  }

  return Object.values(placeholders).flatMap((renderings) =>
    (renderings as (ComponentRendering | HtmlElementRendering)[]).flatMap((rendering) => {
      if (!('componentName' in rendering)) {
        return [];
      }

      if (rendering.componentName !== PRODUCT_TABS_CONTAINER) {
        return collectProductCards(rendering.placeholders);
      }

      const tabs = (rendering.placeholders?.[PRODUCT_TABS_PLACEHOLDER] ??
        []) as unknown as ProductTabContentProps[];

      return tabs.flatMap(({ fields }) => [
        ...(fields?.featuredCard?.fields ? [fields.featuredCard] : []),
        ...(fields?.secondaryCards ?? []),
      ]);
    })
  );
};

const toAbsoluteUrl = (path: string, baseUrl?: string): string | null => {
  try {
    return new URL(path, baseUrl).href;
  } catch {
    return null;
  }
};

const CourseListSchema = (): JSX.Element | null => {
  const { sitecoreContext } = useSitecoreContext();
  const route = sitecoreContext?.route;
  const canonicalUrl = sitecoreContext?.canonicalUrl as string | undefined;

  const schema = useMemo(() => {
    const seenUrls = new Set<string>();
    const itemListElement: CourseListItem[] = [];

    collectProductCards(route?.placeholders).forEach((card) => {
      const fields = card?.fields;
      if (!fields || fields.noIndex?.value) {
        return;
      }

      const name = String(fields.headline?.value ?? '').trim();
      const description = String(
        fields.pageDescription?.value || fields.description?.value || ''
      ).trim();
      const url = toAbsoluteUrl(fields.productExternalUrl?.value?.href || card.url, canonicalUrl);

      if (!name || !description || !url || seenUrls.has(url)) {
        return;
      }

      seenUrls.add(url);
      itemListElement.push({
        '@type': 'ListItem',
        position: itemListElement.length + 1,
        item: {
          '@type': 'Course',
          url,
          name,
          description,
          provider: {
            '@type': 'Organization',
            name: 'ISC2',
            sameAs: 'https://www.isc2.org',
          },
        },
      });
    });

    if (!itemListElement.length) {
      return null;
    }

    return JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement,
    }).replace(/</g, '\\u003c');
  }, [route?.placeholders, canonicalUrl]);

  if (!schema) {
    return null;
  }

  return (
    <Head>
      <script
        key="course-list-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: schema }}
      />
    </Head>
  );
};

export default CourseListSchema;
