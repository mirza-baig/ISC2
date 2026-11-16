import { useCallback, useEffect, useMemo, useState } from 'react';
import ProductErrorModalContent from './ModalContent/ProductErrorModalContent';
import ProductScheduleModalContent from './ModalContent/ProductScheduleModalContent';
import ProductRedeemedModalContent from './ModalContent/ProductRedeemedModalContent';
import ProductCancelModalContent from './ModalContent/ProductCancelModalContent';
import { ProductRedeemLabels, RedeemProductInformation } from './ProductRedeemModal';
import ProductConsentModalContent from './ModalContent/ProductConsentModalContent';
import { useLineItems, useModal } from 'providers/index';
import {
  useAcceptAllocation,
  useGetAlgoliaSitecoreData,
  useGetAllocationById,
  useLoggedUser,
} from 'hooks/index';
import {
  ALLOCATION_ID,
  PRODUCT_REDEEM_MODAL_ERRORS,
  PRODUCT_REDEEM_MODAL_STATUS,
} from 'constants/index';
import LoadingIndicator from 'ui/LoadingIndicator';
import { getAllocationErrorMessage, removeUrlParameter } from 'utils/index';

type AcceptAllocationResponse = {
  success?: boolean;
  message?: PRODUCT_REDEEM_MODAL_ERRORS;
};

/**
 * Accept requests that are in flight or have succeeded, keyed by allocation and consent.
 *
 * Kept outside the component on purpose. The modal slot is shared, so this content can be
 * unmounted and mounted again while a request is running, and component state does not
 * survive that. Accepting is not repeatable: Salesforce answers a second call with
 * ALREADY_REDEEMED, which would replace the success screen with an error for an
 * allocation that was in fact redeemed. A remount reuses the first call's result instead.
 */
const acceptRequests = new Map<string, Promise<AcceptAllocationResponse>>();

const ACCEPTED_ALLOCATION_STORAGE_PREFIX = 'isc2-allocation-accepted';

/**
 * Remembers a successful accept for the rest of the browser tab's session, so a full page
 * reload does not send the request again either. Keyed by user as well as allocation, so
 * one user's result is never shown to another who signs in on the same tab.
 */
const acceptedAllocationStorageKey = (userId: string, allocationId: string) =>
  `${ACCEPTED_ALLOCATION_STORAGE_PREFIX}:${userId}:${allocationId}`;

const wasAllocationAccepted = (userId: string | undefined, allocationId: string) => {
  if (!userId) {
    return false;
  }

  try {
    return sessionStorage.getItem(acceptedAllocationStorageKey(userId, allocationId)) === 'true';
  } catch {
    return false;
  }
};

const rememberAllocationAccepted = (userId: string | undefined, allocationId: string) => {
  if (!userId) {
    return;
  }

  try {
    sessionStorage.setItem(acceptedAllocationStorageKey(userId, allocationId), 'true');
  } catch {
    // Storage can be unavailable (private mode, blocked site data); the in-memory map still applies.
  }
};

export namespace ProductRedeemModalContent {
  export type Props = {
    labels: ProductRedeemLabels;
    allocationId: string;
    modalStatus: PRODUCT_REDEEM_MODAL_STATUS;
    setModalStatus: (modalStatus: PRODUCT_REDEEM_MODAL_STATUS) => void;
  };
}

export default function ProductRedeemModalContent(
  { labels, allocationId, modalStatus, setModalStatus } = ProductRedeemModalContent.Props
) {
  const { algoliaIndex } = useLineItems();
  const { allocation, allocationError, isGettingAllocation } = useGetAllocationById({
    allocationId,
  });
  const productKey = allocation?.productInfo?.key;
  const { algoliaData, algoliaDataIsLoading } = useGetAlgoliaSitecoreData({
    productKeysList: productKey ? [productKey] : [],
    algoliaIndex,
  });
  const { acceptAllocationAsync, isAcceptingAllocation } = useAcceptAllocation();
  const { externalID } = useLoggedUser();
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const defaultErrorMessage = labels.unsuccessDescription.value?.toString();

  const [isWaitingForAccept, setIsWaitingForAccept] = useState(false);
  // Confirming an organization can navigate to another page. The modal that owns the
  // status is then gone while this content is still on screen, so the outcome and the
  // close action are also handled here and do not depend on it.
  const [isRedeemed, setIsRedeemed] = useState(false);
  const { closeModal } = useModal();

  // Derived instead of stored, so it is still there when this content is mounted again
  // after the allocation has been accepted.
  const productName = allocation?.productInfo?.name || '';
  const productPath = algoliaData?.path;
  const productInformations = useMemo<RedeemProductInformation | undefined>(() => {
    if (!productKey || algoliaDataIsLoading) {
      return undefined;
    }

    return {
      productName,
      url: `${process.env.REAL_PUBLIC_URL}${productPath}`,
      labels: [],
    };
  }, [algoliaDataIsLoading, productKey, productName, productPath]);

  const closeModalAction = useCallback(() => {
    removeUrlParameter(ALLOCATION_ID);
    setModalStatus(PRODUCT_REDEEM_MODAL_STATUS.Closed);
    closeModal();
  }, [closeModal, setModalStatus]);

  const triggerErrorMessage = useCallback(
    (message?: string) => {
      setErrorMessage(message || defaultErrorMessage);
      console.error(message || defaultErrorMessage);
      return;
    },
    [defaultErrorMessage]
  );

  const acceptAllocation = useCallback(
    async ({ consent }: { consent: boolean }) => {
      // The first successful accept is kept; a later attempt for the same allocation is
      // not sent and shows that first result.
      if (consent && wasAllocationAccepted(externalID, allocationId)) {
        setIsRedeemed(true);
        setModalStatus(PRODUCT_REDEEM_MODAL_STATUS.Redeemed);

        return;
      }

      const requestKey = `${allocationId}:${consent}`;
      let request = acceptRequests.get(requestKey);

      if (!request) {
        request = acceptAllocationAsync({ allocationId, consent });
        acceptRequests.set(requestKey, request);
      }

      setIsWaitingForAccept(true);

      try {
        const response = await request;

        if (!response.success || !consent) {
          // Only a successful accept is final; anything else may be tried again.
          acceptRequests.delete(requestKey);
          setErrorMessage(getAllocationErrorMessage(labels, response.message));

          return;
        }

        rememberAllocationAccepted(externalID, allocationId);
        setIsRedeemed(true);
        setModalStatus(PRODUCT_REDEEM_MODAL_STATUS.Redeemed);
      } catch (error) {
        acceptRequests.delete(requestKey);
        setErrorMessage(getAllocationErrorMessage(labels, PRODUCT_REDEEM_MODAL_ERRORS.DEFAULT));
      } finally {
        setIsWaitingForAccept(false);
      }
    },
    [acceptAllocationAsync, allocationId, externalID, labels, setModalStatus]
  );

  useEffect(() => {
    const getData = async () => {
      if (!allocation || algoliaDataIsLoading) {
        return;
      }

      const flowType = allocation.productInfo?.flowType?.toLowerCase();
      const allocationErrorMessage = getAllocationErrorMessage(labels, allocation.message);

      if (!productKey || !flowType || allocationErrorMessage) {
        triggerErrorMessage(
          !productKey
            ? `Allocation error: No product key provided for allocation ${allocationId}. ${defaultErrorMessage}`
            : !flowType
            ? `Allocation error: No flow type specified for allocation ${allocationId}. ${defaultErrorMessage}`
            : allocationErrorMessage
        );

        return;
      }

      if (flowType === PRODUCT_REDEEM_MODAL_STATUS.Consent) {
        setModalStatus(PRODUCT_REDEEM_MODAL_STATUS.Consent);
      } else if (flowType === PRODUCT_REDEEM_MODAL_STATUS.Schedule) {
        if (!algoliaData?.path) {
          triggerErrorMessage(
            `Allocation error: No redirect URL for product key ${productKey}. ${defaultErrorMessage}`
          );

          return;
        }

        setModalStatus(PRODUCT_REDEEM_MODAL_STATUS.Schedule);
      } else {
        acceptAllocation({ consent: true });
      }
    };

    if (modalStatus !== PRODUCT_REDEEM_MODAL_STATUS.Default || !allocation) {
      return;
    }

    getData();
  }, [
    acceptAllocation,
    algoliaData,
    algoliaDataIsLoading,
    allocation,
    allocationId,
    defaultErrorMessage,
    labels,
    modalStatus,
    productKey,
    setModalStatus,
    triggerErrorMessage,
  ]);

  if (isGettingAllocation || isAcceptingAllocation || isWaitingForAccept || algoliaDataIsLoading) {
    return <LoadingIndicator className="justify-self-center" />;
  }

  if (errorMessage || allocationError) {
    return (
      <ProductErrorModalContent
        labels={labels}
        errorMessage={errorMessage}
        productInformations={productInformations}
        closeModalAction={closeModalAction}
      />
    );
  }

  if (!productInformations) {
    return null;
  }

  if (modalStatus === PRODUCT_REDEEM_MODAL_STATUS.Default && !isRedeemed) {
    // Nothing has been decided yet, so the success screen must not show.
    return <LoadingIndicator className="justify-self-center" />;
  }

  switch (modalStatus) {
    case PRODUCT_REDEEM_MODAL_STATUS.Closed:
      return null;
    case PRODUCT_REDEEM_MODAL_STATUS.Cancel:
      return (
        <ProductCancelModalContent
          labels={labels}
          setModalStatus={setModalStatus}
          closeModalAction={closeModalAction}
        />
      );
    case PRODUCT_REDEEM_MODAL_STATUS.Consent:
      return (
        <ProductConsentModalContent
          labels={labels}
          acceptAllocation={acceptAllocation}
          isAcceptingAllocation={isAcceptingAllocation}
        />
      );
    case PRODUCT_REDEEM_MODAL_STATUS.Schedule:
      return (
        <ProductScheduleModalContent
          labels={labels}
          productInformations={productInformations}
          allocationId={allocationId}
          setModalStatus={setModalStatus}
        />
      );
    case PRODUCT_REDEEM_MODAL_STATUS.Redeemed:
    default:
      return (
        <ProductRedeemedModalContent
          labels={labels}
          productInformations={productInformations}
          closeModalAction={closeModalAction}
        />
      );
  }
}
