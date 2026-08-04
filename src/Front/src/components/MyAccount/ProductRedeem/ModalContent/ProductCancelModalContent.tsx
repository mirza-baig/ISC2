import { ProductRedeemLabels } from '../ProductRedeemModal';
import MyAccountModal from '../../MyAccountModal';
import { PRODUCT_REDEEM_MODAL_STATUS } from 'constants/index';

export namespace ProductCancelModalContent {
  export type Props = {
    labels: ProductRedeemLabels;
    setModalStatus: (modalStatus: PRODUCT_REDEEM_MODAL_STATUS) => void;
    closeModalAction: () => void;
  };
}

export default function ProductCancelModalContent(
  { labels, setModalStatus, closeModalAction } = ProductCancelModalContent.Props
) {
  return (
    <MyAccountModal
      heading={labels.cancelHeading}
      description={labels.cancelDescription}
      confirmActionLabel={labels.cancelGoBackCtaLabel.value?.toString() || ''}
      confirmAction={() => setModalStatus(PRODUCT_REDEEM_MODAL_STATUS.Schedule)}
      cancelActionLabel={labels.cancelConfirmCtaLabel.value?.toString() || ''}
      cancelAction={closeModalAction}
    />
  );
}
