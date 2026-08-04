import { ViewportList } from 'react-viewport-list';
import { useCallback, useEffect, useMemo, useRef } from 'react';

import { Button } from 'ui/index';
import { DangerIcon } from 'icons/index';
import { useAddAllocations, useDebounce } from 'hooks/index';
import { ALLOCATION_SEARCH_LENGTH } from 'constants/account';
import { useLayout, useAllocationDetails } from 'providers/index';

import AllocationDetailsSearch from './AllocationDetailsSearch';
import AllocationDetailsListItem from '../AllocationDetailsItem';
import AddUserToCompanyCTA from './AddUserToCompanyCTA';

export default function AllocationDetailsRemainingList() {
  const {
    messages,
    allocation,
    dynamicLabels,
    allocationCapacityReached,
    isAllocationExpired,
    selectedEmails,
    remainingList,
    setSelectedEmails,
    searchTerm,
  } = useAllocationDetails();

  const { debouncedValue } = useDebounce(searchTerm, 600);
  const { addFlashAlert } = useLayout();
  const allocationsContainerRef = useRef<HTMLDivElement>(null);

  const filteredList = useMemo(() => {
    if (debouncedValue.length >= ALLOCATION_SEARCH_LENGTH) {
      return remainingList.filter((item) => item.email.includes(debouncedValue));
    }

    return remainingList;
  }, [remainingList, debouncedValue]);

  useEffect(() => {
    setSelectedEmails((prevSelectedItems) => {
      const clonedItems = new Map(prevSelectedItems);
      const emails = Array.from(prevSelectedItems.keys());
      emails.forEach((email) => {
        const emailMismatch = !filteredList.find((item) => item.email === email);
        if (emailMismatch) {
          clonedItems.delete(email);
        }
      });
      return clonedItems;
    });
  }, [debouncedValue, filteredList, setSelectedEmails]);

  const onSuccessCallback = useCallback(
    (amount: number) => {
      addFlashAlert({
        type: 'success',
        label:
          amount > 1
            ? messages?.multipleUsersSuccessfulyAllocatedMessage?.replace(
                '{numberOfUsers}',
                `${amount}`
              )
            : messages?.singleUserSuccessfulyAllocatedMessage,
        closable: true,
      });

      setSelectedEmails(new Map());
    },
    [
      addFlashAlert,
      messages?.multipleUsersSuccessfulyAllocatedMessage,
      messages?.singleUserSuccessfulyAllocatedMessage,
      setSelectedEmails,
    ]
  );

  const onErrorCallback = useCallback(() => {
    addFlashAlert({
      type: 'error',
      label:
        selectedEmails.size > 1
          ? messages?.failedToAllocateMultipleUsersMessage
          : messages?.failedToAllocateSingleUserMessage,
      closable: true,
    });
  }, [addFlashAlert, messages, selectedEmails]);

  const { addAllocation, isAddingAllocation } = useAddAllocations({
    onSuccess: onSuccessCallback,
    onError: onErrorCallback,
  });

  const onAddItems = useCallback(() => {
    if (!allocation) {
      return;
    }

    const selectedItems = filteredList.filter((item) => selectedEmails.has(item.email));
    const { available } = allocation.allocationSummary;

    // extra security layer on amount of users to prevent user's dom manipulation with checkbox-inputs
    if (selectedItems.length && selectedItems.length <= available) {
      addAllocation(selectedItems);
    }
  }, [addAllocation, allocation, filteredList, selectedEmails]);

  return (
    <div className="mb-7.5">
      <div className="flex w-full flex-col-reverse gap-6 sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-gray-30">
        {!isAllocationExpired && <AddUserToCompanyCTA />}
        <AllocationDetailsSearch list={filteredList} />
      </div>

      <div className="max-h-[60vh] overflow-y-auto" ref={allocationsContainerRef}>
        {!filteredList?.length && <p className="body-m px-4 py-5">{messages?.emptyListMessage}</p>}
        <ViewportList viewportRef={allocationsContainerRef} items={filteredList}>
          {(item) => (
            <AllocationDetailsListItem
              key={item.email}
              allocation={item}
              isSelected={!isAllocationExpired && selectedEmails.has(item.email)}
              allocationCapacityReached={isAllocationExpired || allocationCapacityReached}
            />
          )}
        </ViewportList>
      </div>
      {!isAllocationExpired && (allocationCapacityReached || Boolean(selectedEmails.size)) && (
        <div className="-mt-[1px] relative pt-5 px-5 border-t border-gray-50 space-y-5 ml-1 mr-3 sm:ml-3 sm:mr-4 sm:px-0">
          {allocationCapacityReached && allocation?.users && (
            <p className="body-s font-medium text-red-error flex items-center">
              <DangerIcon size={20} className="mr-2" />
              {messages?.maximumNumberOfUsersMessage}
            </p>
          )}
          {Boolean(selectedEmails.size) && (
            <div className="-ml-6 -mr-8 sm:mx-0 flex justify-end">
              <Button
                className="primary-cta text-xsm justify-center tracking-link py-3 w-full sm:w-auto"
                variant="primary"
                onClick={onAddItems}
                label={dynamicLabels.selectedUsersLabel}
                isLoading={isAddingAllocation}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
