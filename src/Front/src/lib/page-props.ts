import { Redirect } from 'next';
import { Session } from 'next-auth';
import {
  DictionaryPhrases,
  ComponentPropsCollection,
  LayoutServiceData,
  SiteInfo,
  HTMLLink,
} from '@sitecore-jss/sitecore-jss-nextjs';

export type AlgoliaInsightHit = {
  objectID: string;
  articleTitle: string;
  url: string;
  createdDate: string;
  thumbnailImage: string;
  genericType: string;
  _highlightResult?: {
    title?: {
      value: string;
    };
  };
};

/**
 * Sitecore page props
 */
export type SitecorePageProps = {
  site: SiteInfo;
  locale: string;
  dictionary: DictionaryPhrases;
  componentProps: ComponentPropsCollection;
  notFound: boolean;
  layoutData: LayoutServiceData;
  headLinks: HTMLLink[];
  redirect?: Redirect;
  session?: Session;
  featureFlags?: Record<string, boolean>;
};
