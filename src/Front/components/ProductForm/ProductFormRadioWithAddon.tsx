import { ProductPrice } from 'types/pricing';
import ProductFormRadio from './ProductFormRadio';
import { FormElementTypes, FormOption, ProductTypes } from 'types/forms';
import { useCallback, useMemo } from 'react';
import clsx from 'clsx';
import { useProductForm } from 'providers/productForm';

interface ProductFormRadioFields {
  fields: {
    name: string;
    label: string;
    value: string;
    selected: boolean;
    price?: ProductPrice;
    isRequired?: boolean;
    addOn?: FormOption[];
    noAlgoliaConnection?: boolean;
    disabled?: boolean;
    isError: boolean;
  };
}

const ProductFormRadioWithAddon = ({ fields }: ProductFormRadioFields) => {
  const {
    name,
    label,
    value,
    selected,
    price,
    isRequired,
    disabled,
    addOn = [],
    noAlgoliaConnection,
    isError,
  } = {
    ...fields,
  };
  const { selectedProduct, bundlePdpData } = useProductForm();

  const addOnSelected = useCallback(
    (addOnItem: FormOption) => {
      return selectedProduct?.[name]?.options?.[addOnItem.value]?.value === addOnItem.value;
    },
    [name, selectedProduct]
  );

  const isBundleType = useMemo(
    () => Boolean(bundlePdpData?.productType === ProductTypes.bundle),
    [bundlePdpData?.productType]
  );

  return (
    <div
      className={clsx(
        'w-full flex flex-col border border-gray-70 rounded-lg has-[:checked]:border-isc2-green',
        isError && !disabled && '!border-red-error'
      )}
    >
      <ProductFormRadio
        fields={{
          name,
          label,
          value,
          selected,
          price,
          isRequired,
          disabled,
          noAlgoliaConnection,
          isError,
        }}
      />
      <div
        className={clsx(
          isBundleType && 'grid transition-all duration-500ms ease-in-out',
          selected ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        )}
      >
        <div className="overflow-hidden">
          <hr className="mx-4" />
          {addOn?.map((addOnItem) => (
            <div className="flex flex-col" key={addOnItem.value}>
              <ProductFormRadio
                fields={{
                  name: addOnItem.value,
                  label: addOnItem.label,
                  value: addOnItem.value,
                  selected: addOnSelected(addOnItem),
                  price: addOnItem.price,
                  isRequired,
                  parentKey: name,
                  isExtraPrice: true,
                  disabled: !selected,
                  type: FormElementTypes.checkbox,
                  noAlgoliaConnection,
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductFormRadioWithAddon;
