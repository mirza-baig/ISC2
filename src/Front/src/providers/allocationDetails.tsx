/* eslint-disable @typescript-eslint/no-empty-function */
import {
  createContext,
  Dispatch,
  SetStateAction,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

import {
  Allocation,
  AllocationDetailsLabels,
  AllocationDetailsMessages,
  AllocationUser,
} from 'types/profile';
import { getNumberOfAllocatedSeats, isAllocated, parseFieldsFromURLString } from 'utils/index';
import { Allocation as AllocationType } from 'types/profile';
import { ACTION_NEED_ERRORS, ACTION_NOT_NEED_ERRORS, NO_ACTIONS_ALLOWED } from 'constants/account';
import {
  AllocationDetailsFields,
  AllocationRemoveUserModalFields,
  SelectedEmails,
} from 'types/index';

type AllocationDetailsProps = {
  labels: AllocationDetailsLabels;
  messages: AllocationDetailsMessages;
  selectedEmails: SelectedEmails;
  setSelectedEmails: Dispatch<SetStateAction<SelectedEmails>>;
  dynamicLabels: {
    remainingUserLabel: string;
    allocatedUsersLabel: string;
    selectedUsersLabel: string;
  };
  allocationCapacityReached: boolean;
  isAllocationExpired: boolean;
  allocation: AllocationType | undefined;
  allocatedList: AllocationUser[];
  remainingList: AllocationUser[];
  statusMessageMap: { [key: string]: string };
  removeUserModalFields: AllocationRemoveUserModalFields;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  sortAllocationsList: (data: AllocationUser[]) => AllocationUser[];
  onUserAllocationSelected: (email: string) => void;
};

const AllocationDetailsContext = createContext<AllocationDetailsProps>({
  labels: {} as AllocationDetailsLabels,
  messages: {} as AllocationDetailsMessages,
  selectedEmails: new Map(),
  setSelectedEmails: () => {},
  dynamicLabels: {
    remainingUserLabel: '',
    allocatedUsersLabel: '',
    selectedUsersLabel: '',
  },
  searchTerm: '',
  allocationCapacityReached: false,
  isAllocationExpired: false,
  allocation: undefined,
  allocatedList: [],
  remainingList: [],
  statusMessageMap: {},
  setSearchTerm: () => {},
  removeUserModalFields: {} as AllocationRemoveUserModalFields,
  sortAllocationsList: () => [],
  onUserAllocationSelected: () => [],
});

type AllocationDetailsProviderProps = {
  fields?: AllocationDetailsFields;
  allocation?: Allocation;
  children: React.ReactNode;
};

const AllocationDetailsProvider: React.FC<AllocationDetailsProviderProps> = ({
  fields,
  children,
  allocation,
}) => {
  const [selectedEmails, setSelectedEmails] = useState<SelectedEmails>(new Map());
  const [searchTerm, setSearchTerm] = useState('');

  const labels = useMemo(
    () => parseFieldsFromURLString<AllocationDetailsLabels>(fields?.labelsTitlesAndMore),
    [fields?.labelsTitlesAndMore]
  );
  const messages = useMemo(
    () => parseFieldsFromURLString<AllocationDetailsMessages>(fields?.messagesAndNotices),
    [fields?.messagesAndNotices]
  );

  const dynamicLabels = useMemo(() => {
    if (!allocation?.allocationSummary) {
      return { remainingUserLabel: '', allocatedUsersLabel: '', selectedUsersLabel: '' };
    }

    return {
      remainingUserLabel: labels.remainingFilterLabel.replace(
        '{remainingNumber}',
        `${allocation?.allocationSummary.available}`
      ),
      allocatedUsersLabel: labels.allocatedFilterLabel.replace(
        '{allocatedNumber}',
        `${getNumberOfAllocatedSeats(allocation.allocationSummary)}`
      ),
      selectedUsersLabel: labels.confirmSelectedCtaLabel.replace(
        '{selectedNumber}',
        `${selectedEmails.size}`
      ),
    };
  }, [
    allocation?.allocationSummary,
    labels.allocatedFilterLabel,
    labels.confirmSelectedCtaLabel,
    labels.remainingFilterLabel,
    selectedEmails.size,
  ]);

  const removeUserModalFields = useMemo(
    () => fields?.removeUserFromAllocationModalNotice?.fields || {},
    [fields?.removeUserFromAllocationModalNotice?.fields]
  );

  const sortAction = useCallback(
    (actionSet: string[], item: AllocationUser, isUp: boolean, exclude?: boolean): number => {
      const direction = isUp ? -1 : 1;
      const operation = exclude
        ? actionSet.every((key) => !item[key as keyof typeof item])
        : actionSet.some((key) => item[key as keyof typeof item]);
      return (operation && direction) || 0;
    },
    []
  );

  const sortAllocationsList = useCallback(
    (data: AllocationUser[]): AllocationUser[] => {
      return data.sort((a: AllocationUser, b: AllocationUser) => {
        const valueAWithAction = sortAction(ACTION_NOT_NEED_ERRORS, a, true);
        const valueBWithAction = sortAction(ACTION_NOT_NEED_ERRORS, b, true);
        const valueAWithoutAction = sortAction(ACTION_NEED_ERRORS, a, false);
        const valueBWithoutAction = sortAction(ACTION_NEED_ERRORS, b, false);
        const valueANonActionAvailabel = sortAction(NO_ACTIONS_ALLOWED, a, true, true);
        const valueBNonActionAvailabel = sortAction(NO_ACTIONS_ALLOWED, b, true, true);
        const comparisonByActionRequired = valueBWithAction - valueAWithAction;
        const comparisonByACtionNotRequired = valueBWithoutAction - valueAWithoutAction;
        const comparisonByNonAllowedAction = valueBNonActionAvailabel - valueANonActionAvailabel;
        const comparisonByAlphabetOrder =
          a.email.toLowerCase() < b.email.toLowerCase()
            ? -1
            : a.email.toLowerCase() > b.email.toLowerCase()
            ? 1
            : 0;

        return (
          comparisonByActionRequired ||
          comparisonByACtionNotRequired ||
          comparisonByNonAllowedAction ||
          comparisonByAlphabetOrder
        );
      });
    },
    [sortAction]
  );

  const remainingList = useMemo(
    () => sortAllocationsList((allocation?.users || []).filter((item) => !isAllocated(item))),
    [allocation?.users, sortAllocationsList]
  );

  const allocatedList = useMemo(
    () => sortAllocationsList((allocation?.users || []).filter(isAllocated)),
    [allocation?.users, sortAllocationsList]
  );

  const isAllocationExpired = useMemo(() => allocation?.expired ?? false, [allocation?.expired]);

  const onUserAllocationSelected = useCallback(
    (email: string) => {
      if (isAllocationExpired) {
        return;
      }

      setSelectedEmails((prevSelectedItems) => {
        const clonedItems = new Map(prevSelectedItems);

        if (prevSelectedItems.has(email)) {
          clonedItems.delete(email);
        } else {
          clonedItems.set(email, true);
        }

        return clonedItems;
      });
    },
    [isAllocationExpired]
  );

  const allocationCapacityReached = useMemo(() => {
    if (!allocation?.allocationSummary) {
      return true;
    }

    return selectedEmails.size === allocation.allocationSummary.available;
  }, [allocation, selectedEmails.size]);

  const statusMessageMap = useMemo(
    () => ({
      isAllocated: labels.invitationSentStatusLabel,
      isAccepted: labels.userAcceptedInvitationLabel,
      isAvailableToAllocate: '', // no label here by design (for now)
      isCancelled: messages.userNotAssociatedMessage,
      isExpired: messages.expiredWindowMessage,
      isFailedToAllocate: messages.userNotEligibleMessage, // This one shows is it able to be removed from allocation and is in the top of the list -> TODO confirm
      isRedeemed: labels.redeemedByUserStatusLabel,
      emailAlreadyAllocated: messages.singleUserAlreadyExistsMessage,
    }),
    [labels, messages]
  );

  return (
    <AllocationDetailsContext.Provider
      value={{
        labels,
        messages,
        selectedEmails,
        setSelectedEmails,
        dynamicLabels,
        allocationCapacityReached,
        isAllocationExpired,
        allocation,
        allocatedList,
        remainingList,
        statusMessageMap,
        removeUserModalFields,
        searchTerm,
        setSearchTerm,
        sortAllocationsList,
        onUserAllocationSelected,
      }}
    >
      {children}
    </AllocationDetailsContext.Provider>
  );
};

const useAllocationDetails = () => useContext(AllocationDetailsContext);

export { AllocationDetailsProvider, useAllocationDetails };
