import ProductOptionsScheduledModalContent from 'components/MyAccount/ProductRedeem/ModalContent/ProductOptionsScheduledModalContent';
import { RedeemProductInformation } from 'components/MyAccount/ProductRedeem/ProductRedeemModal';
import { getAllocationErrorMessage, getFullDatetimeRange } from 'utils/index';
import { ProductScheduledModalLabels } from './ProductForm';
import { PRODUCT_REDEEM_MODAL_ERRORS } from 'constants/index';

export namespace ProductFormOptionsScheduledModal {
  export type Props = {
    isSuccess: boolean;
    redeemedModalFields: ProductScheduledModalLabels;
    errorCode?: PRODUCT_REDEEM_MODAL_ERRORS;
    productData?: RedeemProductInformation;
  };
}

export default function ProductFormOptionsScheduledModal(
  {
    isSuccess,
    errorCode,
    redeemedModalFields,
    productData,
  } = ProductFormOptionsScheduledModal.Props
) {
  const dateTimeRange = productData ? getFullDatetimeRange(productData) : undefined;

  return isSuccess ? (
    <ProductOptionsScheduledModalContent
      content={{
        heading: redeemedModalFields.heading,
        redirectLink: redeemedModalFields.redirectLink,
      }}
      productData={{
        productName: productData?.title,
        labels: [
          ...(productData?.duration?.label ? [`${productData?.duration.label}`] : []),
          ...(dateTimeRange ? [dateTimeRange] : []),
        ],
      }}
    />
  ) : (
    <ProductOptionsScheduledModalContent
      content={{
        heading: redeemedModalFields.errorHeading,
        redirectLink: redeemedModalFields.redirectLink,
      }}
      productData={{
        productName: getAllocationErrorMessage(redeemedModalFields, errorCode),
      }}
    />
  );
}
