import { useMemo } from 'react';
import {
  TextField,
  ImageField,
  LinkField,
  Image,
  Text,
  Link,
  Field,
} from '@sitecore-jss/sitecore-jss-nextjs';
import clsx from 'clsx';

export interface TestimonialCardProps {
  displayName: string;
  id: string;
  fields: {
    image: ImageField;
    contentOnLeft?: Field<boolean>;
    imageFullWidth?: Field<boolean>;
    personFullName?: TextField;
    personTitle?: TextField;
    testimonialQuote: TextField;
    primaryCTA?: LinkField;
  };
}

const TestimonialCard = ({ fields }: TestimonialCardProps) => {
  const cardQuote = useMemo(() => {
    if (Boolean(fields.personTitle?.value)) {
      return `${fields.personFullName?.value}, ${fields.personTitle?.value}`;
    }

    return fields.personFullName?.value;
  }, [fields.personFullName?.value, fields.personTitle?.value]);

  return (
    <div className="flex w-full flex-col lg:flex-row">
      <section
        className={clsx(
          'testimonial-section w-full relative aspect-video lg:w-[566px] lg:aspect-square',
          Boolean(fields.contentOnLeft?.value) && 'lg:order-1'
        )}
      >
        <Image field={fields.image} className="absolute w-full h-full object-cover" />
      </section>
      <section
        className={clsx(
          'flex flex-col flex-1 items-start justify-end bg-gray-10 px-6 py-12 pb-27 sm:pb-12 lg:py-32 space-y-8',
          Boolean(fields.contentOnLeft?.value) ? 'lg:pr-16 lg:pl-28' : 'lg:pl-16 lg:pr-28'
        )}
      >
        <Text field={fields.testimonialQuote} className="headline-s lg:headline-m" tag="h3" />
        <Text
          field={{ value: cardQuote }}
          className="before:content-['–'] before:mr-2 body-l"
          tag="h5"
        />
        {Boolean(fields.primaryCTA?.value.href) && (
          <Link field={fields.primaryCTA!} className="primary-cta truncate" />
        )}
      </section>
    </div>
  );
};

export default TestimonialCard;
