import { useMemo } from 'react';
import Select from 'react-select';
import clsx from 'clsx';
import { ChevronDownIcon } from 'icons/index';
import { FormElementTypes, FormFields, FormOption, ProductOptions } from 'types/forms';
import ProductFormLabel from './ProductFormLabel';
import { useProductForm } from 'providers/productForm';

interface ProductFormSelectFields {
  fields: {
    label: string;
    name: string;
    isRequired?: boolean;
    isConditionallyRequired?: boolean;
    tooltip?: string;
    values?: FormOption[];
    additionalClasses?: string;
    notificationMessage?: string;
    isConfigurationOption?: boolean;
    isValid: boolean;
    isValidationMode: boolean;
  };
}

type DropdownIndicatorProps = {
  hasValue: boolean;
  isFocused: boolean;
};

const DropdownIndicator = ({ hasValue, isFocused }: DropdownIndicatorProps) => (
  <ChevronDownIcon
    size={24}
    className={clsx(hasValue || isFocused ? 'text-black' : 'text-gray-50')}
  />
);

const ProductFormSelect = ({ fields }: ProductFormSelectFields) => {
  const {
    label,
    name,
    isRequired,
    isConditionallyRequired,
    additionalClasses,
    notificationMessage,
    isConfigurationOption = false,
    isValid,
    isValidationMode,
  } = fields;
  const {
    selectedProduct = {},
    productVariants,
    facetList,
    isThirdPartyProvider,
    conditionalFieldsMandatoryState,
    isProductConfigured,
    isBannedTier,
    toggleSelectedProduct,
  } = useProductForm();
  const requiredState = Boolean(
    isConditionallyRequired ? conditionalFieldsMandatoryState[name] : isRequired
  );

  // filter out the facet nodes which has undefined value
  const availableOptions = facetList?.[name]?.filter((item) => item.value);
  const selectOptions = useMemo(() => {
    return (
      availableOptions?.map((item) => ({
        ...item,
      })) || []
    );
  }, [availableOptions]);
  const selectedValue = selectedProduct[name as keyof ProductOptions]?.data;

  const selectedOption = useMemo(() => {
    return (selectedValue && selectOptions?.find((e) => e.value === selectedValue?.value)) || null;
  }, [selectOptions, selectedValue]);

  const handleChange = (data: FormOption | null): void => {
    if (!data) {
      return;
    }

    const { value } = data;

    if (name && value) {
      toggleSelectedProduct({
        [name]: { value },
      });
    }
  };

  const fieldMatch =
    (!isProductConfigured && isConfigurationOption) ||
    (isProductConfigured && !isConfigurationOption);

  const isError = isValidationMode && !isValid && requiredState && !selectedOption && fieldMatch;
  const isThirdPartyNotification =
    !isValid &&
    isValidationMode &&
    isThirdPartyProvider &&
    Boolean(productVariants?.length && productVariants.length > 1);
  const isNotification =
    isThirdPartyNotification && name === FormFields.TrainingProvider.key && selectedValue;

  if (requiredState === null || !selectOptions?.length) {
    return null;
  }

  return (
    <div className={clsx('w-full', additionalClasses)}>
      <ProductFormLabel
        fields={{
          ...fields,
          isRequired: requiredState,
          type: FormElementTypes.select,
          isError: isError || (isThirdPartyNotification && !selectedValue),
        }}
      />
      <div>
        <Select
          aria-label="Use arrow and enter keys to select"
          id={`${label}-${FormElementTypes.select}`}
          name={name}
          components={{
            IndicatorSeparator: null,
            DropdownIndicator,
          }}
          classNames={{
            control: () =>
              clsx(
                'h-17.5 px-4 !rounded-lg !shadow-none !border !border-gray-70 !cursor-pointer hover:!border-black',
                selectedOption && '!border-isc2-green',
                (isError || (isThirdPartyNotification && !selectedValue)) && '!border-red-error',
                isBannedTier && '!bg-white-00'
              ),
            valueContainer: () => '!pl-0',
            placeholder: () => 'body-m',
            singleValue: () => 'body-m',
            menu: () => '!overflow-hidden',
            menuList: () => '!py-0',
            option: ({ isSelected, isFocused }) =>
              clsx(
                'body-m !text-sm !py-4',
                isSelected && '!bg-isc2-green',
                isFocused && !isSelected && '!bg-black-05 !cursor-pointer'
              ),
          }}
          options={selectOptions}
          isSearchable={false}
          onChange={handleChange}
          value={selectedOption}
          isDisabled={isBannedTier}
          required={isConditionallyRequired ? requiredState : isRequired}
        />
        {isNotification && notificationMessage && (
          <div className="mt-1 text-red-error body-s">{notificationMessage}</div>
        )}
      </div>
    </div>
  );
};

export default ProductFormSelect;
