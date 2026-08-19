import { LinkField, TextField } from '@sitecore-jss/sitecore-jss-nextjs';
import MyAccountModal from '../../MyAccountModal';
import ProductRedeemModalSkuDetails from '../ProductRedeemModalSkuDetails';
import { RedeemProductInformation } from '../ProductRedeemModal';

export namespace ProductOptionsScheduledModalContent {
  export type Props = {
    content: {
      heading: TextField;
      redirectLink: LinkField;
    };
    productData: RedeemProductInformation;
  };
}

export default function ProductOptionsScheduledModalContent(
  { content, productData } = ProductOptionsScheduledModalContent.Props
) {
  return (
    <MyAccountModal
      heading={content.heading}
      confirmActionLabel={content.redirectLink.value?.text?.toString() || ''}
      redirectLink={content.redirectLink.value.href}
    >
      <ProductRedeemModalSkuDetails productInformations={productData} />
    </MyAccountModal>
  );
}
