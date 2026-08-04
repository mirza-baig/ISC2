import { Field, Link, LinkField, Text } from '@sitecore-jss/sitecore-jss-nextjs';
import clsx from 'clsx';

import { RichTextUI } from 'ui/index';

interface SectionTitleProps {
  title?: Field<string>;
  subtitle?: Field<string>;
  link?: LinkField;
  className?: string;
  isLoading?: boolean;
}

const LoadingSkeleton = ({ className }: { className?: string }) => (
  <section className={clsx('mb-8 sm:mb-10 space-y-6 sm:space-y-4 animate-pulse', className)}>
    <div className="h-12 w-4/12 bg-gray-300" />
    <div className="flex justify-between flex-col space-y-4 sm:space-y-0 sm:flex-row sm:space-x-8">
      <div className="h-6 w-8/12 bg-gray-300" />
      <div className="h-5 sm:h-6 w-2/12 bg-gray-300" />
    </div>
  </section>
);

const SectionTitle = ({ title, subtitle, link, className, isLoading }: SectionTitleProps) => {
  if (!title?.value && !subtitle?.value && !link?.value.href) {
    return null;
  }

  if (isLoading) {
    return <LoadingSkeleton className={className} />;
  }

  return (
    <section
      className={clsx('section-title mb-8 sm:mb-10 space-y-6 sm:space-y-4 w-full', className)}
    >
      {Boolean(title?.value) && <Text tag="h2" className="headline-l" field={title} />}
      {(subtitle?.value || link?.value?.href) && (
        <div className="flex justify-between flex-col items-start space-y-4">
          {Boolean(subtitle?.value) && <RichTextUI value={subtitle?.value} />}
          {Boolean(link?.value?.href) && (
            <Link
              field={link!}
              className="cta focus-underline-dark-green key-focus whitespace-nowrap with-chevron border-b-2 border-transparent hover:border-darker-green pb-1"
            />
          )}
        </div>
      )}
    </section>
  );
};

export default SectionTitle;
