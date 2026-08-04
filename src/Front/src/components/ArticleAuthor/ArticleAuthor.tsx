import clsx from 'clsx';
import { ImageField, TextField, Text, NextImage } from '@sitecore-jss/sitecore-jss-nextjs';

export interface ArticleAuthorProps {
  className?: string;
  fields: {
    authorImage?: ImageField;
    authorName?: TextField;
    authorDescription?: TextField;
  };
}

const ArticleAuthor = ({ className, fields }: ArticleAuthorProps) => {
  if (!fields) {
    return null;
  }

  return (
    <div className={clsx('flex flex-row md:flex-col', className)}>
      {Boolean(fields.authorImage?.value?.src) && (
        <div className="flex-shrink-0 mb-0 md:mb-4 mr-5 md:mr-0">
          <div className="relative overflow-hidden w-12 h-12 md:w-20 md:h-20">
            <NextImage fill className="rounded-full object-cover" field={fields.authorImage} />
          </div>
        </div>
      )}
      <div className="flex flex-col">
        {Boolean(fields.authorName?.value) && (
          <Text tag="h3" className="body-m text-xsm tracking-tightest" field={fields.authorName} />
        )}
        {Boolean(fields.authorDescription?.value) && (
          <Text
            tag="p"
            className="body-m text-xsm tracking-tightest text-gray-70"
            field={fields.authorDescription}
          />
        )}
      </div>
    </div>
  );
};
export default ArticleAuthor;
