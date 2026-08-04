import { Field, LinkField } from '@sitecore-jss/sitecore-jss-nextjs';
import clsx from 'clsx';
import { ComponentProps } from 'lib/component-props';
import { BackgroundGradient } from 'types/index';
import { useBackgroundGradient, useTextColor } from 'hooks/index';
import ThumbnailBlockCard, { ThumbnailBlockCardProps } from './ThumbnailBlockCard';
import SectionTitle from 'ui/SectionTitle';

type ThumbnailBlockProps = ComponentProps & {
  fields: {
    item: {
      backgroundGradient?: BackgroundGradient;
      sectionTitle: Field<string>;
      sectionDescription: Field<string>;
      sectionLink: LinkField;
    };
    children: ThumbnailBlockCardProps[];
  };
};

const ThumbnailBlock = ({ fields }: ThumbnailBlockProps) => {
  const bgColorClass = useBackgroundGradient(fields?.item?.backgroundGradient, 'bg-gray-10');
  const textColorClass = useTextColor(fields?.item?.backgroundGradient);

  if (!fields) {
    return null;
  }

  return (
    <section
      className={clsx(
        'thumbnail-block flex flex-col items-center justify-center py-14 md:pt-20 md:pb-15 px-5 md:px-8 overflow-hidden',
        bgColorClass,
        textColorClass
      )}
    >
      <SectionTitle
        title={fields?.item?.sectionTitle}
        subtitle={fields?.item?.sectionDescription}
        link={fields?.item?.sectionLink}
      />
      <div className="flex space-x-6 md:space-x-0 pb-5 pt-5 md:px-8 md:grid md:grid-cols-3 md:gap-6 w-full overflow-x-scroll md:overflow-x-auto">
        {(fields?.children || []).slice(0, 9).map((child) => (
          <ThumbnailBlockCard key={child.id} {...child} />
        ))}
      </div>
    </section>
  );
};

export default ThumbnailBlock;
