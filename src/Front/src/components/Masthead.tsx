import React from 'react';
import {
  Field,
  Image,
  ImageField,
  LinkField,
  Text,
  TextField,
} from '@sitecore-jss/sitecore-jss-nextjs';
import clsx from 'clsx';
import Media from 'ui/Media';
import { BackgroundGradient } from 'types/index';
import { useBackgroundGradient, useTextColor } from 'hooks/index';

interface Fields {
  backgroundGradient: BackgroundGradient;
  contentOnRight: Field<boolean>;
  eyebrow: TextField;
  image: ImageField;
  videoYouTubeId: TextField;
  headline: TextField;
  description: TextField;
  sectionDescription: TextField;
  sectionLink: LinkField;
  sectionTitle: TextField;
}

type MastheadProps = {
  fields: Fields;
};

const Masthead = ({ fields }: MastheadProps) => {
  const bgColorClass = useBackgroundGradient(fields?.backgroundGradient, 'bg-gray-10');
  const textColorClass = useTextColor(fields?.backgroundGradient);

  if (!fields) {
    return null;
  }

  const hasImage = Boolean(fields.image?.value?.src);
  const hasVideo = Boolean(fields.videoYouTubeId?.value);

  return (
    <section
      className={clsx(
        bgColorClass,
        'md:flex items-end max-w-screen-3xl mb-14 md:mb-20',
        fields.contentOnRight?.value && 'md:flex-row-reverse md:text-right'
      )}
    >
      <div
        className={clsx(
          'md:flex-1 px-4 pb-14 md:pb-20 md:pl-16 md:pr-24 pt-48 md:pt-0',
          hasImage || hasVideo ? 'md:pt-0' : 'md:pt-80',
          textColorClass
        )}
      >
        <Text field={fields.eyebrow} className="eyebrow" tag="label" />
        <Text
          field={fields.headline}
          className="headline-l md:headline-xl break-words mt-1"
          tag="h1"
        />
        <Text field={fields.description} className="text-xsm mt-9" />
      </div>

      {(hasImage || hasVideo) && (
        <div className="aspect-4/3 md:aspect-square md:w-594 relative">
          {hasVideo ? (
            <Media videoId={fields.videoYouTubeId} thumbnail={fields.image ?? ''} />
          ) : (
            <Image field={fields.image} className="absolute w-full h-full object-cover" />
          )}
        </div>
      )}
    </section>
  );
};

export default Masthead;
