import clsx from 'clsx';

import { AllocationDetailsTab } from 'types/index';

type AllocationDetailsTabsProps = {
  remainingUserLabel: string;
  allocatedUsersLabel: string;
  activeTab: AllocationDetailsTab;
  setActiveTab: (activeTab: AllocationDetailsTab) => void;
};

export default function AllocationDetailsTabs({
  remainingUserLabel,
  allocatedUsersLabel,
  activeTab,
  setActiveTab,
}: AllocationDetailsTabsProps) {
  return (
    <div className="flex items-center space-x-7.5 py-6 sm:py-4 sm:mb-5">
      <button
        className={clsx(
          'cta rounded-tag focus-dark-green border-2 border-transparent text-xsm py-2.5 px-4 focus:border-gray-50 whitespace-nowrap',
          activeTab === 'remaining' && '!border-isc2-green'
        )}
        aria-label={remainingUserLabel}
        onClick={() => setActiveTab('remaining')}
      >
        {remainingUserLabel}
      </button>
      <button
        className={clsx(
          'cta rounded-tag focus-dark-green border-2 border-transparent text-xsm py-2.5 px-4 focus:border-gray-50 whitespace-nowrap',
          activeTab === 'allocated' && '!border-isc2-green'
        )}
        aria-label={allocatedUsersLabel}
        onClick={() => setActiveTab('allocated')}
      >
        {allocatedUsersLabel}
      </button>
    </div>
  );
}
