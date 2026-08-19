import { Link, Text } from '@sitecore-jss/sitecore-jss-nextjs';
import clsx from 'clsx';

import { PathFinderStep } from 'types/index';

import RichTextUI from 'ui/RichTextUI';

type PathFinderInsightContentProps = Pick<
  PathFinderStep,
  'eyebrow' | 'title' | 'abstract' | 'link'
>;

const PathFinderInsightContent = ({
  eyebrow,
  title,
  abstract,
  link,
}: PathFinderInsightContentProps) => {
  const hasTitle = Boolean(title?.value);
  const hasAbstract = Boolean(abstract?.value);
  const hasLink = Boolean(link?.value?.href) && Boolean(link?.value?.text);

  return (
    <>
      {Boolean(eyebrow?.value) && (
        <Text
          tag="div"
          className={clsx('eyebrow text-xs text-gray-70 tracking-wide', {
            'mb-1': hasTitle || hasAbstract || hasLink,
          })}
          field={eyebrow}
        />
      )}
      {hasTitle && (
        <Text
          tag="h2"
          className={clsx('headline-m md:headline-l', { 'mb-4': hasAbstract || hasLink })}
          field={title}
        />
      )}
      {hasAbstract && (
        <RichTextUI className={clsx('body-m', hasLink && 'mb-8')} value={abstract?.value} />
      )}
      {hasLink && <Link className="secondary-cta mb-8" field={link!} />}
    </>
  );
};

export default PathFinderInsightContent;
