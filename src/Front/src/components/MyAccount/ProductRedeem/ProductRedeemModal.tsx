import {
  ComponentRendering,
  GetStaticComponentProps,
  TextField,
  useComponentProps,
  withDatasourceCheck,
} from '@sitecore-jss/sitecore-jss-nextjs';
import { LineItemsProvider, useModal } from 'providers/index';
import { getGraphQLResult } from 'utils/index';
import { AlgoliaSettings } from 'types/index';
import { SEARCH_SETTINGS_QUERY_FOR_ALGOLIA } from 'queries/searchSettings';
import ProductRedeemModalContent from './ProductRedeemModalContent';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ALLOCATION_ID, PRODUCT_REDEEM_MODAL_STATUS } from 'constants/index';

export interface ProductRedeemLabels {
  scheduleCancelCtaLabel: TextField;
  scheduleDescription: TextField;
  scheduleConfirmCtaLabel: TextField;
  scheduleHeading: TextField;
  unsuccessCtaLabel: TextField;
  unsuccessDescription: TextField;
  unsuccessHeading: TextField;
  cancelGoBackCtaLabel: TextField;
  cancelConfirmCtaLabel: TextField;
  cancelDescription: TextField;
  cancelHeading: TextField;
  successHeading: TextField;
  successCtaLabel: TextField;
  consentAgreementCtaLabel: TextField;
  consentBodyText: TextField;
  consentDisagreementCtaLabel: TextField;
  consentHeading: TextField;
  disagreementWarningBody: TextField;
  disagreementWarningGoBackCtaLabel: TextField;
  disagreementWarningConfirmCtaLabel: TextField;
  isAllocatedLabel: TextField;
  isCancelledLabel: TextField;
  isExpiredLabel: TextField;
}

export interface RedeemProductInformation {
  productName?: string;
  url?: string;
  labels?: string[];
}

interface ProductRedeemModalProps {
  fields: ProductRedeemLabels;
  rendering: ComponentRendering;
}

const ProductRedeemModal = ({ fields, rendering }: ProductRedeemModalProps) => {
  const algoliaSettings = useComponentProps<AlgoliaSettings>(rendering.uid);
  const { setModalContent, closeModal } = useModal();
  const searchParams = useSearchParams();

  const [modalStatus, setModalStatus] = useState<PRODUCT_REDEEM_MODAL_STATUS>(
    PRODUCT_REDEEM_MODAL_STATUS.Default
  );

  useEffect(() => {
    const allocationId = searchParams?.get(ALLOCATION_ID);

    if (!allocationId) {
      return;
    }

    if (!algoliaSettings || modalStatus === PRODUCT_REDEEM_MODAL_STATUS.Closed) {
      closeModal();
      return;
    }

    setModalContent(
      <LineItemsProvider algoliaSettings={algoliaSettings}>
        <ProductRedeemModalContent
          labels={fields}
          allocationId={allocationId}
          modalStatus={modalStatus}
          setModalStatus={setModalStatus}
        />
      </LineItemsProvider>,
      {
        dismissOnClickOutside: false,
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, modalStatus]);

  return null;
};

export default withDatasourceCheck()<ProductRedeemModalProps>(ProductRedeemModal);

export const getStaticProps: GetStaticComponentProps = async (): Promise<AlgoliaSettings> => {
  return await getGraphQLResult<AlgoliaSettings>(SEARCH_SETTINGS_QUERY_FOR_ALGOLIA);
};
