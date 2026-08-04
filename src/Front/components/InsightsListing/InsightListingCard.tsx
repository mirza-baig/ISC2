import {
  Field,
  Text,
  NextImage,
  ImageField,
  Link,
  LinkField,
} from '@sitecore-jss/sitecore-jss-nextjs';
import { formatDate } from 'utils/date';
import clsx from 'clsx';
import { useAnalyticsTracking } from 'hooks/index';
import { ChevronDownIcon } from 'icons/index';
import { ANALYTICS_EVENTS } from 'constants/index';

export interface InsightListingCardFields {
  image?: ImageField;
  eyebrow?: Field<string>;
  heading: Field<string>;
  link?: LinkField;
  date?: Field<string>;
  isImage?: boolean;
}

export default function InsightListingCard({
  image,
  heading,
  link,
  date,
  eyebrow,
  isImage,
}: InsightListingCardFields) {
  const { track } = useAnalyticsTracking();
  const formatedDate = { value: formatDate(date) };

  return (
    <div
      className={clsx('bg-white-00 flex flex-col rounded-lg shrink-0 shadow-md', {
        'w-full sm:w-6/12 lg:max-w-416 sm:max-w-416': isImage,
        'w-60 sm:w-auto': !isImage,
      })}
    >
      {isImage && <NextImage className="rounded-t-lg w-full flex-1 object-cover" field={image} />}

      <div className="p-6">
        <span className="text-gray-70 eyebrow flex flex-row items-center">
          {eyebrow?.value && <Text tag="span" field={eyebrow} />}
          {formatedDate?.value && eyebrow?.value && <span className="mx-2 text-xl">•</span>}
          {formatedDate?.value && <Text tag="span" field={formatedDate} />}
        </span>
        <Text tag="h5" className="text-2xl line-clamp-2" field={heading} />
        {Boolean(link?.value?.href) && (
          <Link
            onClick={() => {
              track({
                event: ANALYTICS_EVENTS.GA_EVENT,
                type: 'engagement',
                subtype: 'insights_item_click',
                click_text: link?.value?.text,
                click_url: link?.value?.href,
                bo1: true,
              });
            }}
            field={link!}
            className="flex items-center whitespace-nowrap text-sm mt-4 text-dark-green font-semibold"
          >
            {link?.value?.text}
            <ChevronDownIcon size={15} className="-rotate-90" />
          </Link>
        )}
      </div>
    </div>
  );
}
