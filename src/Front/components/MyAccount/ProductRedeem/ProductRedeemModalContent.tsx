import { useCallback, useEffect, useState } from 'react';
import ProductErrorModalContent from './ModalContent/ProductErrorModalContent';
import ProductScheduleModalContent from './ModalContent/ProductScheduleModalContent';
import ProductRedeemedModalContent from './ModalContent/ProductRedeemedModalContent';
import ProductCancelModalContent from './ModalContent/ProductCancelModalContent';
import { ProductRedeemLabels, RedeemProductInformation } from './ProductRedeemModal';
import ProductConsentModalContent from './ModalContent/ProductConsentModalContent';
import { useLineItems } from 'providers/index';
import { useAcceptAllocation, useGetAlgoliaSitecoreData, useGetAllocationById } from 'hooks/index';
import { ALLOCATION_ID, PRODUCT_REDEEM_MODAL_STATUS } from 'constants/index';
import LoadingIndicator from 'ui/LoadingIndicator';
import { getAllocationErrorMessage, removeUrlParameter } from 'utils/index';

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
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const defaultErrorMessage = labels.unsuccessDescription.value?.toString();

  const [productInformations, setProductInformations] = useState<
    RedeemProductInformation | undefined
  >(undefined);

  const closeModalAction = useCallback(() => {
    removeUrlParameter(ALLOCATION_ID);
    setModalStatus(PRODUCT_REDEEM_MODAL_STATUS.Closed);
  }, [setModalStatus]);

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
      const response = await acceptAllocationAsync({ allocationId, consent });

      if (!response.success || !consent) {
        setErrorMessage(getAllocationErrorMessage(labels, response.message));

        return;
      }

      setModalStatus(PRODUCT_REDEEM_MODAL_STATUS.Redeemed);
    },
    [acceptAllocationAsync, allocationId, labels, setModalStatus]
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

      setProductInformations({
        productName: allocation.productInfo?.name || '',
        url: `${process.env.REAL_PUBLIC_URL}${algoliaData?.path}`,
        labels: [],
      });
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

  if (isGettingAllocation || isAcceptingAllocation || algoliaDataIsLoading) {
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
