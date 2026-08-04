import clsx from 'clsx';
import { useMemo } from 'react';

import InsightListingCard, { InsightListingCardFields } from './InsightListingCard';

interface ListingProps {
  fields: HorizontalTabContent[];
  className?: string;
  activeTabId: string;
}

export interface HorizontalTabContent {
  fields: InsightListingCardFields;
  id: string;
  tabName: string;
  tabContent: [];
  name: string;
  children: [];
}

const Listing = ({ fields, className, activeTabId }: ListingProps): JSX.Element => {
  const featuredCard = useMemo(
    () => fields?.find((card) => card?.fields?.image?.value?.src),
    [fields]
  );
  const otherCards = useMemo(
    () => fields?.filter((card) => featuredCard?.id !== card.id),
    [fields, featuredCard?.id]
  );

  return (
    <div
      className={clsx(
        'flex flex-col text-black-100 space-y-6',
        'sm:flex-row sm:space-x-6 sm:space-y-0',
        className
      )}
      role="tabpanel"
      id={`horizontal-tab-${activeTabId}`}
      aria-labelledby={activeTabId}
    >
      {Boolean(featuredCard) && <InsightListingCard {...featuredCard!.fields} isImage />}
      <div className="flex overflow-auto sm:max-h-580 slider-scrollbar w-full">
        <div className="flex flex-row space-x-5 sm:flex-col pb-4 sm:pr-4 sm:grow sm:space-y-6 sm:space-x-0 cursor-default">
          {otherCards?.map((card) => (
            <InsightListingCard key={card.id} {...card.fields} isImage={false} />
          ))}
        </div>
      </div>
    </div>
  );
};
export default Listing;
