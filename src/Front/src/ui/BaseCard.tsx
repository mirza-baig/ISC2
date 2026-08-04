import {
  Field,
  ImageField,
  NextImage,
  RichText,
  RichTextField,
  Text,
  TextField,
} from '@sitecore-jss/sitecore-jss-nextjs';
import clsx from 'clsx';

export interface BaseCardFields {
  heading: TextField;
  description: RichTextField;
  image?: ImageField;
  headingSize?: Field<'medium' | 'large'>;
  imageSize?: Field<'small' | 'medium'>;
}

interface BaseCardProps {
  fields: BaseCardFields;
  textClassName?: string;
}

const BaseCard: React.FC<BaseCardProps> = ({ fields, textClassName }: BaseCardProps) => {
  return (
    <div className="base-card flex gap-4">
      {Boolean(fields?.image?.value?.src) && (
        <div>
          <div
            className={clsx(
              'bg-gray-10 rounded-full flex justify-center items-center',
              fields?.imageSize?.value === 'small' ? 'w-10 h-10' : 'w-15 h-15'
            )}
          >
            <NextImage
              field={fields.image}
              width={fields?.imageSize?.value === 'small' ? 18 : 36}
              height={fields?.imageSize?.value === 'small' ? 17 : 34}
            />
          </div>
        </div>
      )}
      <div className="flex flex-col gap-2">
        {Boolean(fields?.heading) && (
          <Text
            tag="h5"
            className={clsx(
              'text-dark-green',
              textClassName,
              fields?.headingSize?.value === 'medium' ? 'body-m' : 'body-l'
            )}
            field={fields.heading}
          />
        )}
        {Boolean(fields?.description) && (
          <div className={clsx('text-dark-green body-s', textClassName)}>
            <RichText field={fields?.description} />
          </div>
        )}
      </div>
    </div>
  );
};

export default BaseCard;
