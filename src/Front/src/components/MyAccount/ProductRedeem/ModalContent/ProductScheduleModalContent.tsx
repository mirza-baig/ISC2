import { ProductRedeemLabels, RedeemProductInformation } from '../ProductRedeemModal';
import MyAccountModal from '../../MyAccountModal';
import ProductRedeemModalSkuDetails from '../ProductRedeemModalSkuDetails';
import { ALLOCATION_ID, PRODUCT_REDEEM_MODAL_STATUS } from 'constants/index';

export namespace ProductScheduleModalContent {
  export type Props = {
    labels: ProductRedeemLabels;
    productInformations: RedeemProductInformation;
    allocationId: string;
    setModalStatus: (modalStatus: PRODUCT_REDEEM_MODAL_STATUS) => void;
  };
}

export default function ProductScheduleModalContent(
  { labels, productInformations, allocationId, setModalStatus } = ProductScheduleModalContent.Props
) {
  return (
    <MyAccountModal
      heading={labels.scheduleHeading}
      description={labels.scheduleDescription}
      confirmActionLabel={labels.scheduleConfirmCtaLabel.value?.toString() || ''}
      redirectLink={`${productInformations.url}?${ALLOCATION_ID}=${allocationId}`}
      cancelActionLabel={labels.scheduleCancelCtaLabel.value?.toString() || ''}
      cancelAction={() => setModalStatus(PRODUCT_REDEEM_MODAL_STATUS.Cancel)}
    >
      <ProductRedeemModalSkuDetails productInformations={productInformations} />
    </MyAccountModal>
  );
}
