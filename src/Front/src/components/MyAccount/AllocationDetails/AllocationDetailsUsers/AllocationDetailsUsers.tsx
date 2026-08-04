import { useState } from 'react';

import { useAllocationDetails } from 'providers/index';
import { AllocationDetailsTab } from 'types/index';

import AllocationDetailsTabs from './AllocationDetailsTabs';
import AllocationDetailsAllocatedTab from './AllocationDetailsAllocatedTab';
import AllocationDetailsRemainingTab from './AllocationDetailsRemainingTab/AllocationDetailsRemainingTab';

export default function AllocationDetailsUsers() {
  const { dynamicLabels } = useAllocationDetails();

  const [activeTab, setActiveTab] = useState<AllocationDetailsTab>('remaining');

  return (
    <div className="ml-1 pt-10">
      <AllocationDetailsTabs
        remainingUserLabel={dynamicLabels.remainingUserLabel}
        allocatedUsersLabel={dynamicLabels.allocatedUsersLabel}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {activeTab === 'remaining' && <AllocationDetailsRemainingTab />}
      {activeTab === 'allocated' && <AllocationDetailsAllocatedTab />}
    </div>
  );
}
