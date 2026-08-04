import clsx from 'clsx';
import { useCallback, useMemo } from 'react';

import { CloseIcon, DangerIcon } from 'icons/index';
import { AllocationUser } from 'types/index';
import { useModal, useLayout, useAllocationDetails } from 'providers/index';
import { useDeleteAllocation } from 'hooks/index';
import { LineItemLoadingIndicator } from 'ui/index';
import { getAllocationStatus, isAllocated } from 'utils/index';
import { ALLOCATION_USER_STATUSES } from 'constants/index';

import AllocationRemoveModal from './AllocationRemoveModal';
import AllocationReAllocateModal from './AllocationReAllocateModal';

type AllocationDetailsItemProps = {
  allocation: AllocationUser;
  isSelected?: boolean;
  allocationCapacityReached?: boolean;
};

export default function AllocationDetailsListItem({
  allocation,
  isSelected,
  allocationCapacityReached,
}: AllocationDetailsItemProps) {
  const { setModalContent, closeModal } = useModal();
  const { addFlashAlert } = useLayout();

  const isAllocationAllocated = useMemo(() => isAllocated(allocation), [allocation]);

  const {
    removeUserModalFields,
    statusMessageMap,
    messages,
    labels,
    onUserAllocationSelected,
    isAllocationExpired,
    allocation: parentAllocation,
  } = useAllocationDetails();

  const isFailedExam = useMemo(
    () =>
      allocation.isRedeemed === true && allocation.progressStatus?.toLowerCase().includes('fail'),
    [allocation.isRedeemed, allocation.progressStatus]
  );

  const canReAllocate = useMemo(() => {
    if (parentAllocation?.expired) return false;
    return allocation.isAllocated && !allocation.isAccepted && !isFailedExam;
  }, [allocation.isAllocated, allocation.isAccepted, isFailedExam, parentAllocation?.expired]);

  const onSuccessCallback = useCallback(() => {
    addFlashAlert({
      type: 'success',
      label: messages?.singleUserSuccessfulyRemovedMessage,
      closable: true,
    });

    closeModal();
  }, [closeModal, addFlashAlert, messages?.singleUserSuccessfulyRemovedMessage]);

  const onReAllocateSuccessCallback = useCallback(() => {
    addFlashAlert({
      type: 'success',
      label: 'Allocation moved back to available.',
      closable: true,
    });

    closeModal();
  }, [closeModal, addFlashAlert]);

  const onErrorCallback = useCallback(() => {
    addFlashAlert({
      type: 'error',
      label: messages?.failedToRemoveSingleUserMessage,
      closable: true,
    });
  }, [addFlashAlert, messages?.failedToRemoveSingleUserMessage]);

  const onReAllocateErrorCallback = useCallback(() => {
    addFlashAlert({
      type: 'error',
      label: 'Failed to re-allocate. Please try again.',
      closable: true,
    });
  }, [addFlashAlert]);

  const { deleteAllocation, isDeletingAllocation } = useDeleteAllocation({
    onSuccess: onSuccessCallback,
    onError: onErrorCallback,
  });

  const { deleteAllocation: reAllocate, isDeletingAllocation: isReAllocating } =
    useDeleteAllocation({
      onSuccess: onReAllocateSuccessCallback,
      onError: onReAllocateErrorCallback,
    });

  const onRemove = useCallback(() => {
    setModalContent(
      <AllocationRemoveModal
        {...removeUserModalFields}
        onConfirm={() => deleteAllocation(allocation.email)}
      />
    );
  }, [deleteAllocation, allocation.email, removeUserModalFields, setModalContent]);

  const onReAllocate = useCallback(() => {
    setModalContent(
      <AllocationReAllocateModal
        userName={`${allocation.firstName} ${allocation.lastName}`}
        heading={labels?.reallocatePopupTitle}
        description={messages?.reallocatePopopDescription}
        primaryCtaLabel={labels?.reallocateCtaLabel || 'Re-Allocate'}
        secondaryCtaLabel={labels?.cancelCtaLabel}
        onConfirm={() => reAllocate(allocation.email)}
      />
    );
  }, [reAllocate, allocation, labels, messages, setModalContent]);

  const handleSelectedId = () => {
    if (!isAllocated(allocation)) {
      onUserAllocationSelected(allocation.email);
    }
  };

  const userState = useMemo(() => {
    for (const key of ALLOCATION_USER_STATUSES) {
      if (allocation[key]) {
        return {
          status: getAllocationStatus(key),
          text: statusMessageMap[key],
        };
      }
    }

    return { text: '' };
  }, [allocation, statusMessageMap]);

  const isDisabled = useMemo(() => {
    const safeIsSelected = isSelected ?? false;

    if (!isAllocationAllocated) {
      return allocationCapacityReached && !safeIsSelected;
    }

    return (
      allocation?.isCancelled || allocation?.isExpired || allocation?.isFailedToAllocate || false
    );
  }, [allocation, isSelected, allocationCapacityReached, isAllocationAllocated]);

  return (
    <div className="relative border-b border-gray-30 ml-1 mr-3">
      {(isDeletingAllocation || isReAllocating) && (
        <div className="absolute inset-0 pt-0">
          <LineItemLoadingIndicator className="!py-0 z-10" />
        </div>
      )}
      {!isAllocationAllocated && !isAllocationExpired && (
        <input
          type="checkbox"
          className={clsx(
            'h-4 w-4 cursor-pointer border checked:border-isc2-green bg-white-00 hover:text-isc2-green',
            'checked:text-isc2-green focus:ring-isc2-green focus:ring-1 pointer-events-none',
            'absolute top-6 left-0',
            isDisabled && 'disabled:border-gray-300'
          )}
          disabled={isDisabled}
          checked={isSelected}
          required
          id={allocation.email}
          onChange={handleSelectedId}
        />
      )}
      <div className="flex-1 sm:flex">
        <div className="flex-1">
          <label
            className={clsx(
              'text-black body-l flex flex-col space-y-2 pt-5',
              !isAllocationAllocated && !isAllocationExpired && 'pl-6',
              isAllocationAllocated && !isFailedExam && allocation.progressStatus && 'pb-0',
              userState?.text ? 'pb-2' : 'pb-5',
              !isAllocationAllocated && !isAllocationExpired && !isDisabled && 'cursor-pointer',
              isDisabled && 'opacity-30'
            )}
            htmlFor={allocation.email}
          >
            <span>
              {allocation.firstName} {allocation.lastName}
            </span>
            {allocation.email && (
              <span className="body-m text-gray-70 break-all">{allocation.email}</span>
            )}
          </label>
          {userState.text && (
            <div
              className={clsx(
                'flex items-center body-s font-medium text-gray-90',
                isAllocationAllocated && allocation.progressStatus ? 'pb-0 sm:pb-5' : 'pb-5',
                !isAllocationAllocated && !isAllocationExpired && 'pl-6',
                userState.status === 'error' && 'text-red-error',
                userState.status === 'success' && 'text-isc2-green'
              )}
            >
              {userState.status === 'error' && <DangerIcon size={20} className="mr-2" />}
              {userState.text}
            </div>
          )}
        </div>
        {isAllocationAllocated && !isFailedExam && allocation.progressStatus && (
          <div className="self-center sm:pl-1 pb-5 sm:pb-0 body-s font-medium text-gray-90">
            {allocation.progressStatus}
          </div>
        )}
        {isFailedExam && allocation.progressStatus && (
          <div className="self-center sm:pl-1 pb-5 sm:pb-0 body-s font-medium text-gray-90">
            Exam Status: {allocation.progressStatus}
          </div>
        )}
      </div>
      {isAllocationAllocated && allocation.isFailedToAllocate && !isAllocationExpired && (
        <button className="absolute right-0 top-0 pt-5" onClick={onRemove} aria-label="Close">
          <CloseIcon size={16} />
        </button>
      )}
      {canReAllocate && (
        <button
          className="absolute right-0 top-1/2 -translate-y-1/2 primary-cta text-xsm leading-20 tracking-link px-4 py-2"
          onClick={onReAllocate}
          disabled={isReAllocating}
          aria-label="Re-Allocate"
        >
          {labels?.reallocateCtaLabel || 'Re-Allocate'}
        </button>
      )}
    </div>
  );
}
