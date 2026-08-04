import { ProductRedeemLabels, RedeemProductInformation } from '../ProductRedeemModal';
import MyAccountModal from '../../MyAccountModal';
import ProductRedeemModalSkuDetails from '../ProductRedeemModalSkuDetails';

export namespace ProductErrorModalContent {
  export type Props = {
    labels: ProductRedeemLabels;
    errorMessage?: string;
    productInformations?: RedeemProductInformation;
    closeModalAction: () => void;
  };
}

export default function ProductErrorModalContent(
  { labels, errorMessage, productInformations, closeModalAction } = ProductErrorModalContent.Props
) {
  return (
    <MyAccountModal
      hasWarningIcon={true}
      heading={labels.unsuccessHeading}
      description={errorMessage ? { value: errorMessage } : labels.unsuccessDescription}
      confirmActionLabel={labels.unsuccessCtaLabel.value?.toString() || ''}
      confirmAction={closeModalAction}
    >
      {productInformations && (
        <ProductRedeemModalSkuDetails productInformations={productInformations} />
      )}
    </MyAccountModal>
  );
}
