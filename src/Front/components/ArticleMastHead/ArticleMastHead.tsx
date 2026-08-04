import {
  ComponentRendering,
  Field,
  ImageField,
  RouteData,
  NextImage,
} from '@sitecore-jss/sitecore-jss-nextjs';
import { ComponentProps } from 'lib/component-props';
import { useCallback, useEffect, useMemo } from 'react';
import clsx from 'clsx';

import { formatDate, showDateField } from 'utils/index';
import { Share } from 'ui/index';
import { useToggle, useBreakpoint } from 'hooks/index';

import ArticleTags, { ArticleTag } from './ArticleTags';

interface Fields {
  image: ImageField;
  imageAlignmentRight: Field<boolean>;
  backgroundGradient: Field<string>;
  articleHeading: Field<string>;
  articleDate: Field<string>;
  articleTimestamp: Field<string | undefined>;
  articleTags: ArticleTag[];
  'Show in RSS Feed': ShowRssFeed;
  rssFeedLabel: Field<string>;
  shareButtonLabel: Field<string>;
  shareOnEmailLabel: Field<string>;
  shareOnFacebookLabel: Field<string>;
  shareOnLinkedinLabel: Field<string>;
  shareOnXLabel: Field<string>;
}

interface ShowRssFeed {
  value: boolean;
}

export type ArticleMastHeadProps = ComponentProps & {
  rendering: ComponentRendering | RouteData;
  fields?: Fields;
};

const ArticleMastHead = ({ fields }: ArticleMastHeadProps) => {
  const showDate = showDateField(fields?.articleDate);

  const breakpoint = useBreakpoint();

  const [isShareOpen, toggleShareOpen, setShareOpen] = useToggle(false);
  const [isTagsOpen, toggleTagsOpen, setTagsOpen] = useToggle(false);

  useEffect(() => {
    if (breakpoint === 'sm' && isShareOpen && isTagsOpen) {
      toggleTagsOpen();
    }
  }, [breakpoint, isShareOpen, isTagsOpen, toggleTagsOpen]);

  const onTagsVisibilityChange = useCallback(() => {
    if (isShareOpen && breakpoint === 'sm') {
      setShareOpen(false);
    }

    toggleTagsOpen();
  }, [breakpoint, isShareOpen, setShareOpen, toggleTagsOpen]);

  const onShareVisibilityChange = useCallback(() => {
    if (isTagsOpen && breakpoint === 'sm') {
      setTagsOpen(false);
    }

    toggleShareOpen();
  }, [breakpoint, isTagsOpen, setTagsOpen, toggleShareOpen]);

  const showTimestampSeparator = useMemo(
    () => showDate && fields?.articleTimestamp?.value,
    [showDate, fields?.articleTimestamp?.value]
  );

  const hasLargeHeadline = useMemo(
    () => fields?.articleHeading?.value && fields?.articleHeading?.value.length > 100,
    [fields?.articleHeading.value]
  );

  if (!fields) {
    return null;
  }

  return (
    <header className="flex flex-col md:flex-row w-full block-container overflow-visible">
      <section className="flex grow flex-col justify-end px-5 md:px-16 pb-14 md:pb-10 pt-36 md:pt-0 h-auto md:h-594 bg-gray-10">
        <label className="flex items-center mb-2 text-gray-70 body-m">
          {showDate && formatDate(fields.articleDate)}
          {showTimestampSeparator && <span className="mx-4 text-xl">•</span>}
          {fields.articleTimestamp?.value}
        </label>
        <h1
          className={clsx(
            'headline-l md:headline-xl break-words',
            hasLargeHeadline && 'md:headline-m lg:headline-l'
          )}
        >
          {fields.articleHeading?.value}
        </h1>

        <footer
          className={clsx(
            'flex justify-between items-center mt-6 md:mt-20',
            hasLargeHeadline && 'md:mt-6 lg:mt-10 xl:mt-20'
          )}
        >
          {Boolean(fields.articleTags?.length) && (
            <ArticleTags
              tags={fields.articleTags}
              isOpen={isTagsOpen}
              toggleVisibility={onTagsVisibilityChange}
            />
          )}
          <Share
            isOpen={isShareOpen}
            toggleVisibility={onShareVisibilityChange}
            showRssIcon={Boolean(fields?.['Show in RSS Feed']?.value)}
            title={fields?.articleHeading?.value}
            rssFeedLabel={fields?.rssFeedLabel?.value}
            shareButtonLabel={fields?.shareButtonLabel?.value}
            shareOnEmailLabel={fields?.shareOnEmailLabel?.value}
            shareOnFacebookLabel={fields?.shareOnFacebookLabel?.value}
            shareOnLinkedinLabel={fields?.shareOnLinkedinLabel?.value}
            shareOnXLabel={fields?.shareOnXLabel?.value}
          />
        </footer>
      </section>

      {fields.image.value?.src && (
        <NextImage
          field={fields.image}
          className="h-auto w-full md:h-594 md:w-auto aspect-4/3 sm:aspect-video md:aspect-square object-cover"
          width={539}
          height={539}
          priority
        />
      )}
    </header>
  );
};

export default ArticleMastHead;
