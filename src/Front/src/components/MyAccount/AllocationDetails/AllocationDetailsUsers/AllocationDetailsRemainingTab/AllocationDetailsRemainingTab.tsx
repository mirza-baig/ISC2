import { useCallback, useState } from 'react';

import { RoundedSection } from 'ui/index';
import { AllocationDetailsMode } from 'types/index';
import { useAllocationDetails } from 'providers/index';

import AllocationDetailsRemainingList from './AllocationDetailsRemainingList';
import AllocationDetailsImportList from './AllocationDetailsImportList';

export default function AllocationDetailsRemainingTab() {
  const { labels, setSearchTerm, setSelectedEmails, isAllocationExpired } = useAllocationDetails();

  const [mode, setMode] = useState<AllocationDetailsMode>('existing');

  const onChangeMode = useCallback(
    (newMode: AllocationDetailsMode) => {
      setSelectedEmails(new Map());
      setSearchTerm('');
      setMode(newMode);
    },
    [setSearchTerm, setSelectedEmails]
  );

  if (isAllocationExpired) {
    return (
      <div className="space-y-5">
        <AllocationDetailsRemainingList />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <RoundedSection
        id="existing_users"
        label={labels?.existingUsersOptionLabel}
        isChecked={mode === 'existing'}
        onCheck={() => onChangeMode('existing')}
      >
        <AllocationDetailsRemainingList />
      </RoundedSection>

      <RoundedSection
        id="users_from_file"
        label={labels?.usersFromFileOptionLabel}
        isChecked={mode === 'file'}
        onCheck={() => onChangeMode('file')}
      >
        <AllocationDetailsImportList onCancel={() => onChangeMode('existing')} />
      </RoundedSection>
    </div>
  );
}
