import { Field, ImageField, NextImage } from '@sitecore-jss/sitecore-jss-nextjs';
import clsx from 'clsx';
import { formatDate, showDateField } from 'utils/date';

export interface RelatedInsightCardType {
  url: string;
  fields?: {
    articleHeading: Field<string>;
    thumbnailImage: ImageField;
    articleDate: Field<string>;
    eyebrow?: Field<string | undefined>;
  };
}

type RelatedInsightsCardProps = {
  trackCardClick?: (value: object) => void;
  insightCards: RelatedInsightCardType[];
  defaultImage?: ImageField;
};

export const RelatedInsightsCard = ({
  insightCards,
  trackCardClick,
  defaultImage,
}: RelatedInsightsCardProps) => {
  return (
    <section className="flex flex-col space-y-5 md:space-y-0 md:grid md:grid-cols-3 md:gap-8">
      {(insightCards || []).map((card, index) => {
        if (!card.fields) {
          return null;
        }

        return (
          <a
            key={index}
            onClick={() => trackCardClick && trackCardClick(card)}
            href={card.url}
            className={clsx(
              'flex flex-row md:flex-col space-x-2 md:space-x-0',
              index > 0 && 'pt-5 md:pt-0 border-t border-t-gray-20 md:border-none'
            )}
          >
            <div className="mb-0 md:mb-4 aspect-square w-20 md:w-auto relative">
              <NextImage
                field={
                  Boolean(card.fields.thumbnailImage.value && card.fields.thumbnailImage.value?.src)
                    ? card.fields.thumbnailImage.value
                    : defaultImage
                }
                className="object-cover"
                fill
              />
            </div>

            <div className="flex flex-col flex-1 overflow-hidden">
              <h6 className="flex items-center mb-0 md:mb-1 text-gray-70 eyebrow whitespace-nowrap">
                {formatDate(card.fields.articleDate)}
                {showDateField(card.fields.articleDate) && card.fields.eyebrow?.value && (
                  <span className="mx-1 text-xl leading-none">•</span>
                )}
                {card.fields.eyebrow?.value}
              </h6>
              <h4 className="body-l md:headline-s line-clamp-2">
                {card.fields.articleHeading?.value}
              </h4>
            </div>
          </a>
        );
      })}
    </section>
  );
};
