import { FormElementTypes } from 'types/forms';
import ProductFormLabel from './ProductFormLabel';

interface ProductFormDisclaimerFields {
  fields: {
    label: string;
    name: string;
    value?: string;
  };
}

const ProductFormDisclaimer = ({ fields }: ProductFormDisclaimerFields) => {
  const labelNotice = fields?.value;
  return (
    <div className="w-full">
      <ProductFormLabel fields={{ ...fields, type: FormElementTypes.disclaimer }} />

      <div className="space-y-2">
        <h3 className="leading-23 tracking-tight text-black-100 p-4 rounded-lg border-cissp-green border-2 body-m">
          {labelNotice}
        </h3>
      </div>
    </div>
  );
};

export default ProductFormDisclaimer;
