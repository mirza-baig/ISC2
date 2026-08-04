import { ProductRedeemLabels, RedeemProductInformation } from '../ProductRedeemModal';
import MyAccountModal from '../../MyAccountModal';
import ProductRedeemModalSkuDetails from '../ProductRedeemModalSkuDetails';

export namespace ProductRedeemedModalContent {
  export type Props = {
    labels: ProductRedeemLabels;
    productInformations: RedeemProductInformation;
    closeModalAction: () => void;
  };
}

export default function ProductRedeemedModalContent(
  { labels, productInformations, closeModalAction } = ProductRedeemedModalContent.Props
) {
  return (
    <MyAccountModal
      heading={labels.successHeading}
      confirmActionLabel={labels.successCtaLabel.value?.toString() || ''}
      confirmAction={closeModalAction}
    >
      <ProductRedeemModalSkuDetails productInformations={productInformations} />
    </MyAccountModal>
  );
}
