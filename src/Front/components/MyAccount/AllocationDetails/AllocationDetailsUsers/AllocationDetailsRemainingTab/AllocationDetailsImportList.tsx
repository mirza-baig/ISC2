import { ChangeEventHandler, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ViewportList } from 'react-viewport-list';
import Papa from 'papaparse';
import clsx from 'clsx';

import { DangerIcon, SheetIcon, UploadIcon } from 'icons/index';
import { Button, LoadingIndicator } from 'ui/index';
import { ALLOCATION_SEARCH_LENGTH } from 'constants/index';
import { useAddAllocations, useCreateAllocationMembers, useDebounce } from 'hooks/index';
import { useLayout, useAllocationDetails } from 'providers/index';
import { AllocationUser, CSVRecords, CSVRecordsSchema } from 'types/index';

import AllocationDetailsListItem from '../AllocationDetailsItem';
import AllocationDetailsSearch from './AllocationDetailsSearch';

type CSVFile = {
  fileName: string;
  records: CSVRecords;
};

export namespace AllocationDetailsImportList {
  export type Props = {
    onCancel: () => void;
  };
}

export default function AllocationDetailsImportList({
  onCancel,
}: AllocationDetailsImportList.Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const refImported = useRef<HTMLDivElement>(null);

  const [csvFileInfo, setCSVFileInfo] = useState<CSVFile>();
  const [isUsersImported, setIsUsersImported] = useState<boolean>(false);

  const {
    labels,
    messages,
    allocation,
    sortAllocationsList,
    searchTerm,
    selectedEmails,
    setSelectedEmails,
    allocationCapacityReached,
    dynamicLabels,
  } = useAllocationDetails();

  const { addFlashAlert } = useLayout();

  const { debouncedValue } = useDebounce(searchTerm, 600);

  const allocationStatus = allocation?.allocationSummary;

  useEffect(() => {
    if (fileInputRef.current) {
      fileInputRef.current.scrollIntoView(true);
    }
  }, []);

  const filteredList = useMemo(() => {
    const allocations =
      debouncedValue?.length >= ALLOCATION_SEARCH_LENGTH
        ? csvFileInfo?.records.filter((item) => item.email.includes(debouncedValue))
        : csvFileInfo?.records;
    return sortAllocationsList(allocations || []);
  }, [csvFileInfo?.records, debouncedValue, sortAllocationsList]);

  // if search is performed and selected emails do not exist in the filtered list - we delete them
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

  const onAllocationsMembersCreated = useCallback(
    (amount: number) => {
      setIsUsersImported(true);
      addFlashAlert({
        type: 'success',
        label:
          amount > 1
            ? messages?.multipleUsersSuccessfulyCreatedMessage
            : messages?.singleUserSuccessfulyCreatedMessage,
        closable: true,
      });
    },
    [addFlashAlert, messages]
  );

  const onAllocationsMembersError = useCallback(() => {
    addFlashAlert({
      type: 'error',
      label:
        csvFileInfo?.records && csvFileInfo?.records?.length > 1
          ? messages?.failedToCreateMultipleUsersMessage
          : messages?.failedToCreateSingleUserMessage,
      closable: true,
    });
  }, [addFlashAlert, messages, csvFileInfo?.records]);

  const sanitizeEmail = (email: string): string | null => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const sanitized = email.trim();
    return emailPattern.test(sanitized) ? sanitized : null;
  };

  const sanitizeName = (name: string): string => {
    return name.replace(/<[^>]*>?/gm, '').trim();
  };

  const { createAllocationMembers, isCreatingAllocationMember } = useCreateAllocationMembers({
    onSuccess: onAllocationsMembersCreated,
    onError: onAllocationsMembersError,
  });

  const onFileHasInvalidFormat = useCallback(() => {
    addFlashAlert({
      type: 'error',
      label: messages?.invalidImportFileFormatMessage,
      closable: true,
    });
  }, [addFlashAlert, messages?.invalidImportFileFormatMessage]);

  const parseCSVFile = useCallback(
    async (csvFile: File): Promise<void> => {
      const csvContent = await csvFile.text();

      try {
        const result = Papa.parse<string[]>(csvContent, {
          delimiter: ',',
          skipEmptyLines: true,
          header: false,
        });

        if (result.errors.length > 0) {
          console.error('CSV Parsing errors:', result.errors);
          return onFileHasInvalidFormat();
        }

        const rawRecords = result.data;
        const sanitizedRecords: CSVRecords = rawRecords
          .map((row) => {
            const [emailRaw, firstNameRaw, lastNameRaw] = row;

            const email = sanitizeEmail(emailRaw);
            const firstName = sanitizeName(firstNameRaw);
            const lastName = sanitizeName(lastNameRaw);

            if (!email) return null;

            return {
              email,
              firstName,
              lastName,
            };
          })
          .filter(Boolean) as CSVRecords;

        const validationResult = CSVRecordsSchema.safeParse(sanitizedRecords);
        if (!validationResult.success) {
          console.error('Schema validation errors:', validationResult.error.format());
          return onFileHasInvalidFormat();
        }

        setCSVFileInfo({ fileName: csvFile.name, records: validationResult.data });

        const membersToAllocate: AllocationUser[] = validationResult.data.reduce((acc, item) => {
          const emailAlreadyExists = allocation?.users?.some((user) => user.email === item.email);
          const field = emailAlreadyExists ? 'emailAlreadyAllocated' : 'isAvailableToAllocate';

          const newItem = { ...item, [field]: true };

          if (!emailAlreadyExists) {
            return [...acc, newItem];
          }

          return acc;
        }, [] as AllocationUser[]);

        if (membersToAllocate.length > 0) {
          createAllocationMembers({
            orderNumber: allocation?.orderNumber || '',
            productSku: allocation?.sku || '',
            members: membersToAllocate,
          });
        } else {
          setIsUsersImported(true);
        }
      } catch (error) {
        console.error('Error parsing CSV:', error);
        onFileHasInvalidFormat();
      }
    },
    [
      allocation?.users,
      allocation?.sku,
      allocation?.orderNumber,
      createAllocationMembers,
      onFileHasInvalidFormat,
    ]
  );

  const onFileUpload: ChangeEventHandler<HTMLInputElement> = useCallback(
    (ev) => {
      const [csvFile] = ev.target.files || [];
      if (csvFile && csvFile.name.endsWith('.csv')) {
        return parseCSVFile(csvFile);
      }

      onFileHasInvalidFormat();
    },
    [parseCSVFile, onFileHasInvalidFormat]
  );

  const areAllRowsSelected = useMemo(
    () => filteredList.length === selectedEmails.size,
    [filteredList, selectedEmails]
  );

  const onSelectAllRows = useCallback(() => {
    if (!allocationStatus?.total) {
      return;
    }

    if (areAllRowsSelected) {
      setSelectedEmails(new Map()); // as it is toggle checkbox, in case if all rows were selected, toggle it off makes all lines to be not selected
      return;
    }

    const selectedItems = new Map();
    filteredList.slice(0, allocation?.allocationSummary.available).forEach((item) => {
      if (!item.emailAlreadyAllocated) {
        selectedItems.set(item.email, true);
      }
    });
    setSelectedEmails(selectedItems);
  }, [
    areAllRowsSelected,
    allocationStatus?.total,
    filteredList,
    allocation?.allocationSummary.available,
    setSelectedEmails,
  ]);

  const isAllocationDisabled = useMemo(
    () =>
      !filteredList.filter((item) => !item.emailAlreadyAllocated)?.length ||
      allocationCapacityReached,
    [filteredList, allocationCapacityReached]
  );

  const removeAllocatedUsersFromCSVFile = useCallback(() => {
    setCSVFileInfo((prevFileInfo) => {
      if (!prevFileInfo) {
        return;
      }

      const filteredRecords = prevFileInfo!.records.filter(
        (item) => !selectedEmails.has(item.email)
      );

      return {
        ...prevFileInfo,
        records: filteredRecords,
      };
    });

    setSelectedEmails(new Map());
  }, [selectedEmails, setSelectedEmails]);

  const onUsersAllocated = useCallback(
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

      const remainingItems = csvFileInfo?.records.filter((item) => !selectedEmails.has(item.email));

      removeAllocatedUsersFromCSVFile();

      if (!remainingItems?.length) {
        onCancel();
      }
    },
    [
      removeAllocatedUsersFromCSVFile,
      addFlashAlert,
      messages,
      onCancel,
      csvFileInfo?.records,
      selectedEmails,
    ]
  );

  const onUsersAllocatedError = useCallback(() => {
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
    onSuccess: onUsersAllocated,
    onError: onUsersAllocatedError,
  });

  const allocateSelectedUsers = useCallback(() => {
    if (!csvFileInfo?.records) {
      return;
    }

    // this is extra security layer to prevent select option via DOM injection
    const selectedItems = csvFileInfo.records.filter(
      ({ email, emailAlreadyAllocated }) => selectedEmails.has(email) && !emailAlreadyAllocated
    );

    addAllocation(selectedItems);
  }, [csvFileInfo?.records, addAllocation, selectedEmails]);

  return (
    <>
      <Button
        variant="secondary"
        label={labels.uploadCsvFileCtaLabel}
        className={clsx('mx-5 mb-7.5', csvFileInfo && 'hidden')}
        Icon={<UploadIcon size={16} />}
        onClick={() => {
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
            fileInputRef.current.click();
          }
        }}
      />
      <input
        id="file-input"
        ref={fileInputRef}
        className="hidden"
        type="file"
        accept=".csv"
        onChange={onFileUpload}
      />
      <section className="sm:px-5 w-full">
        {isCreatingAllocationMember && (
          <div className="flex mb-5 items-center">
            <LoadingIndicator className="!py-0 mr-4 w-8" />
            <span className="body-m font-semibold text-start mr-8">
              {labels.uploadProcessingStatusLabel} {csvFileInfo?.fileName}
            </span>
          </div>
        )}

        {isUsersImported && csvFileInfo?.records && (
          <>
            <div className="flex max-sm:w-full sm:max-w-312 items-center gap-3 p-4 mb-5 bg-gray-info rounded-md">
              <SheetIcon size={20} />
              <span className="max-sm:flex-1 body-m font-semibold text-start">
                {csvFileInfo?.fileName}
              </span>
            </div>
            <div className="w-full flex flex-col items-start sm:items-center sm:flex-row sm:justify-between pt-5 sm:pb-5 border-y border-gray-50">
              <div className="flex w-full gap-3 order-2 sm:order-1">
                <div className="relative w-full ml-1 mr-3">
                  <input
                    type="checkbox"
                    id="selectAll"
                    checked={areAllRowsSelected}
                    onChange={onSelectAllRows}
                    disabled={isAllocationDisabled}
                    className={clsx(
                      'h-4 w-4 cursor-pointer border checked:border-isc2-green bg-white-00',
                      'checked:text-isc2-green pointer-events-none absolute top-6 left-0',
                      'disabled:border-gray-300 focus:ring-isc2-green focus:ring-1 hover:text-isc2-green'
                    )}
                  />
                  <div className="flex-1">
                    <label
                      className={clsx(
                        'text-black body-l flex flex-col space-y-2 pt-5 pl-6 pb-5',
                        isAllocationDisabled ? 'opacity-30' : 'cursor-pointer'
                      )}
                      htmlFor="selectAll"
                    >
                      {labels.selectAllOptionLabel}
                    </label>
                  </div>
                </div>
              </div>
              <div className="relative w-full flex items-center order-1">
                <AllocationDetailsSearch list={filteredList} />
              </div>
            </div>
            <div className="max-h-[75vh] overflow-y-auto" ref={refImported}>
              <ViewportList viewportRef={refImported} items={filteredList}>
                {(item) => (
                  <AllocationDetailsListItem
                    key={item.email}
                    allocation={item}
                    allocationCapacityReached={isAllocationDisabled}
                    isSelected={selectedEmails.get(item.email)}
                  />
                )}
              </ViewportList>
            </div>
            {allocationCapacityReached && allocation?.users && (
              <p className="body-s font-medium text-red-error flex items-center pt-5 px-5 ml-1 mr-3 sm:ml-3 sm:mr-4 sm:px-0">
                <DangerIcon size={20} className="mr-2" />
                {messages?.maximumNumberOfUsersMessage}
              </p>
            )}
            <div className="flex items-center space-y-5 mb-7.5 flex-col sm:flex-row justify-end">
              {Boolean(selectedEmails.size || isAddingAllocation) && (
                <Button
                  variant="primary"
                  className="mt-5 w-full sm:w-auto justify-center sm:order-1 sm:ml-6"
                  label={dynamicLabels.selectedUsersLabel}
                  onClick={allocateSelectedUsers}
                  isLoading={isAddingAllocation}
                />
              )}
              <Button
                variant="secondary"
                className="mt-5 w-full sm:w-auto justify-center sm:ml-6"
                label={labels.cancelCtaLabel}
                onClick={onCancel}
              />
            </div>
          </>
        )}
      </section>
    </>
  );
}
