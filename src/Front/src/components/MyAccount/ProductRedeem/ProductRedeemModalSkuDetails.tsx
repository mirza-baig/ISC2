import { RedeemProductInformation } from './ProductRedeemModal';

export namespace ProductRedeemModalSkuDetails {
  export type Props = {
    productInformations: RedeemProductInformation;
  };
}

export default function ProductRedeemModalSkuDetails(
  { productInformations } = ProductRedeemModalSkuDetails.Props
) {
  const { productName, labels } = productInformations;

  if (!productName) {
    return null;
  }

  return (
    <div className="mb-5">
      <hr className="mb-5" />
      <h4 className="sm:text-lg">{productName}</h4>
      {labels?.length > 0 && (
        <div className="text-sm-base text-gray-90 space-y-1">
          {labels.map((label: string) => (
            <div key={label}>{label}</div>
          ))}
        </div>
      )}
    </div>
  );
}
