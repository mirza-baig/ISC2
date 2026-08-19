import clsx from 'clsx';
import { Link, NextImage, Text } from '@sitecore-jss/sitecore-jss-nextjs';

import { ThumbnailBlockCardFields } from 'types/index';

export interface ThumbnailBlockCardProps {
  id: string;
  className?: string;
  fields: ThumbnailBlockCardFields;
}

const ThumbnailBlockCard = ({ className, fields }: ThumbnailBlockCardProps) => {
  if (!fields) {
    return null;
  }

  const hasLink = Boolean(fields.link?.value?.href) && Boolean(fields.link?.value?.text);

  return (
    <section
      className={clsx(
        'flex flex-col items-center md:justify-center md:flex-row-reverse p-4 bg-white-00 shadow-md rounded-md hover:shadow-card-hover transition-all duration-300 text-black-100',
        className
      )}
    >
      {Boolean(fields?.thumbnailImage?.value?.src) && (
        <div className="w-214 md:max-w-178 rounded-md overflow-hidden">
          <NextImage
            className="object-contain w-full transition-all duration-300"
            field={fields?.thumbnailImage}
          />
        </div>
      )}
      <div className="flex-1 flex-col w-full">
        <Text tag="h2" className="body-l mt-4 mb-1 line-clamp-2" field={fields?.headline} />
        {hasLink && (
          <Link
            className="cta mt-4 md:mt-0 focus-underline-dark-green with-chevron"
            field={fields.link!}
          />
        )}
      </div>
    </section>
  );
};

export default ThumbnailBlockCard;
