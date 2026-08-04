import { Link } from '@sitecore-jss/sitecore-jss-nextjs';

import { Allocation, LoadingIndicator } from 'ui/index';
import { AllocationDetailsFields } from 'types/index';
import { useGetAlgoliaSitecoreData, useGetAllocationDetails } from 'hooks/index';
import { useLineItems, useAllocationDetails } from 'providers/index';

import AllocationDetailsUsers from './AllocationDetailsUsers/AllocationDetailsUsers';

export default function AllocationDetailsContent({ fields }: { fields?: AllocationDetailsFields }) {
  const { labels, allocation } = useAllocationDetails();
  const { isGettingAllocationDetails } = useGetAllocationDetails();
  const { algoliaIndex } = useLineItems();
  const { algoliaData, algoliaDataIsLoading } = useGetAlgoliaSitecoreData({
    productKeysList: allocation?.key ? [allocation.key] : [],
    algoliaIndex,
  });

  if (!fields) {
    return null;
  }

  return (
    <section className="mx-1">
      {fields.backToAllocationsLink.value && (
        <Link
          field={fields.backToAllocationsLink}
          className="cta with-chevron-left block mt-5 mb-3"
        />
      )}

      <h2 className="headline-l mb-8">{labels.title}</h2>

      {isGettingAllocationDetails && (
        <div className="flex w-full justify-center">
          <LoadingIndicator className="self-center" />
        </div>
      )}

      {!isGettingAllocationDetails && allocation && (
        <>
          <Allocation
            className="shadow-md flex-1 rounded-lg px-5 lg:px-6 !py-5 border-t border-gray-10"
            withAllocationBorders={false}
            allocation={allocation}
            icon={algoliaData?.thumbnailImage}
            labels={labels}
            imagesAreLoading={algoliaDataIsLoading}
          />

          <AllocationDetailsUsers />
        </>
      )}
    </section>
  );
}
