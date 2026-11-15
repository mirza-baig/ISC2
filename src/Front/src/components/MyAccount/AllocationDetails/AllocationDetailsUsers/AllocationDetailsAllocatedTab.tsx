import { ViewportList } from 'react-viewport-list';
import { useRef } from 'react';

import { useAllocationDetails } from 'providers/index';

import AllocationDetailsListItem from './AllocationDetailsItem';

export default function AllocationDetailsAllocatedTab() {
  const { allocatedList, messages } = useAllocationDetails();

  const allocationsContainerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="max-h-[75vh] overflow-y-auto" ref={allocationsContainerRef}>
      {!allocatedList?.length && <p className="body-m px-4 py-5">{messages?.emptyListMessage}</p>}
      <ViewportList viewportRef={allocationsContainerRef} items={allocatedList}>
        {(item, index) => (
          <AllocationDetailsListItem
            key={item.allocationID ?? `${item.email}-${index}`}
            allocation={item}
          />
        )}
      </ViewportList>
    </div>
  );
}
