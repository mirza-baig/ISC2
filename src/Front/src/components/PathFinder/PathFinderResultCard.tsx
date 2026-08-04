import { forwardRef } from 'react';
import { Link, NextImage, Text } from '@sitecore-jss/sitecore-jss-nextjs';
import clsx from 'clsx';

import { PathFinderResult } from 'types/index';
import { RichTextUI } from 'ui/index';

interface PathFinderResultCardProps {
  className?: string;
  fields: PathFinderResult;
}

const PathFinderResultCard = forwardRef<HTMLAnchorElement, PathFinderResultCardProps>(
  ({ className, fields }, ref) => {
    if (!fields) {
      return null;
    }

    const hasLink = Boolean(fields.link?.value?.href) && Boolean(fields.link?.value?.text);

    return (
      <a
        ref={ref}
        href={!hasLink ? fields.cardUrl?.value || 'javascript:void(0)' : undefined}
        className={clsx(
          'path-finder-result flex flex-col items-center md:justify-center md:flex-row-reverse mb-10 md:m-0 w-247 md:w-full p-4 bg-white-00 shadow-md rounded-md hover:shadow-card-hover transition-all duration-300',
          className
        )}
      >
        <div className="w-214 md:max-w-178 rounded-md overflow-hidden">
          <NextImage
            className="object-contain w-full transition-all duration-300"
            field={fields?.image}
          />
        </div>
        <div className="mt-9 md:mt-0 w-214 md:w-188">
          {Boolean(fields.eyebrow?.value) && (
            <Text
              className="eyebrow text-xs text-gray-70 tracking-wide mb-1"
              tag="div"
              field={fields?.eyebrow}
            />
          )}
          <Text
            tag="h2"
            className="body-l line-clamp-3 mb-4 md:max-w-188 md:mr-6"
            field={fields?.title}
          />
          {Boolean(fields?.abstract?.value) && (
            <RichTextUI
              className={clsx('body-m', hasLink && 'mb-6')}
              value={fields?.abstract?.value}
            />
          )}
          {hasLink && (
            <Link
              className="cta mt-4 md:mt-0 focus-underline-dark-green with-chevron"
              field={fields.link!}
            />
          )}
        </div>
      </a>
    );
  }
);

PathFinderResultCard.displayName = 'PathFinderResultCard';

export default PathFinderResultCard;
