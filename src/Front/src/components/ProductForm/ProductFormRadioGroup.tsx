import {
  FormAdditionalData,
  FormElementTypes,
  FormFields,
  FormOption,
  ProductOptionData,
  ProductOptions,
  ProductTypes,
} from 'types/forms';
import ProductFormLabel from './ProductFormLabel';
import ProductFormRadio from './ProductFormRadio';
import ProductFormRadioWithAddon from './ProductFormRadioWithAddon';
import { ReactElement, useMemo, useEffect } from 'react';
import clsx from 'clsx';
import { useProductForm } from 'providers/productForm';
import { useStandalonePrices } from 'providers/standalonePrices';
import { ProductFormModalLabelsType } from 'utils/product-form';

interface ProductFormRadioGroupFields {
  fields: {
    label: string;
    name: string;
    isRequired?: boolean;
    isConditionallyRequired?: boolean;
    tooltip?: string;
    values?: FormOption[];
    additionalClasses?: string;
    noAlgoliaConnection?: boolean;
    isConfigurationOption?: boolean;
    isValid: boolean;
    isValidationMode: boolean;
    isTrainingOnlyMode?: boolean;
    formLabels: { [key: string]: string };
    peaceOfMindTermsModalContent?: ProductFormModalLabelsType;
    alwaysShowPrice?: boolean;
  };
}

const ProductFormRadioGroup = ({ fields }: ProductFormRadioGroupFields) => {
  const {
    name,
    isRequired,
    isConditionallyRequired,
    additionalClasses,
    noAlgoliaConnection,
    isConfigurationOption = false,
    isValid,
    isValidationMode,
    isTrainingOnlyMode,
    formLabels,
    peaceOfMindTermsModalContent,
    alwaysShowPrice,
  } = fields;
  const {
    selectedProduct = {},
    toggleSelectedProduct,
    facetListSnapshot,
    facetList,
    conditionalFieldsMandatoryState,
    isProductConfigured,
    productVariants,
    priceRoleKey,
    confirmedDate,
    bundleOptions,
    inventoryEntries,
    bundlePdpData,
    isProductSetMode,
    bundleProductKeyItemSkusMap,
  } = useProductForm();

  const { productPrices } = useStandalonePrices();
  const singleSearchSkuResult = useMemo(() => {
    return (
      confirmedDate?.sku ||
      (isTrainingOnlyMode && productVariants?.[0]?.sku) ||
      (productVariants?.length === 1 && productVariants?.[0]?.sku) ||
      null
    );
  }, [productVariants, confirmedDate, isTrainingOnlyMode]);

  // This could be restored in the next project iteration when we turn on filtering by training provider
  // const isFormWithTrainingProvider = useMemo(
  //   () => productFormFields?.some((item) => item.name === FormFields.TrainingProvider.key),
  //   [productFormFields]
  // );

  const availableOptions = facetList?.[name];
  const preservedOptions = facetListSnapshot?.[name];

  const bundleOptionList = useMemo(() => {
    if (name !== FormFields.PurchaseOptions.key) {
      return [];
    }

    return bundleOptions.map((item) => ({
      label: item.copyName || item.title,
      value: item.sku,
      productMessage: item.productMessage,
      disabled: item.disabled,
      price:
        productPrices?.[item.sku]?.[priceRoleKey]?.discounted?.value ||
        productPrices?.[item.sku]?.[priceRoleKey]?.value,
    }));
  }, [name, bundleOptions, productPrices, priceRoleKey]);

  const selectOptions = useMemo(() => {
    if (name === FormFields.PurchaseOptions.key) {
      return (
        isTrainingOnlyMode
          ? [
              ...bundleOptionList,
              {
                label: formLabels?.[FormAdditionalData.SingleProductSelection.key],
                value: singleSearchSkuResult,
                price:
                  (singleSearchSkuResult &&
                    (productPrices?.[singleSearchSkuResult]?.[priceRoleKey]?.discounted?.value ||
                      productPrices?.[singleSearchSkuResult]?.[priceRoleKey]?.value)) ||
                  undefined,
              },
            ]
          : [
              ...bundleOptionList,
              ...productVariants?.map((item) => {
                return {
                  label: item.copyName || item.title,
                  value: item.sku,
                  productMessage: item.productMessage,
                  price:
                    productPrices?.[item.sku]?.[priceRoleKey]?.discounted?.value ||
                    productPrices?.[item.sku]?.[priceRoleKey]?.value,
                };
              }),
            ]
      ) as FormOption[];
    }
    return (
      preservedOptions?.map((item) => ({
        ...item,
        disabled: !availableOptions?.find(
          (availableOption) => availableOption?.value === item.value
        ),
      })) || []
    );
  }, [
    availableOptions,
    preservedOptions,
    priceRoleKey,
    isTrainingOnlyMode,
    productVariants,
    productPrices,
    singleSearchSkuResult,
    name,
    formLabels,
    bundleOptionList,
  ]);
  const radioOptions: FormOption[] = useMemo(() => {
    if (name === FormFields.BundleOptions.key) {
      return fields?.values || [];
    }
    return selectOptions || [];
  }, [name, fields?.values, selectOptions]);

  useEffect(() => {
    const optionsWithLabel = radioOptions.filter(
      (option) => option.label !== null && option.value !== 'selectProducts'
    );
    if (optionsWithLabel.length === 1) {
      const onlyOption = optionsWithLabel[0];
      const alreadySelected = selectedProduct?.[name]?.data?.value === onlyOption.value;

      if (!alreadySelected) {
        toggleSelectedProduct(
          {
            [name]: {
              ...onlyOption,
              price: 'price' in onlyOption ? onlyOption.price : undefined,
              noAlgoliaConnection,
            },
          },
          undefined
        );
      }
    }
  }, [radioOptions, name, selectedProduct, toggleSelectedProduct, noAlgoliaConnection]);

  const extractNumber = (str: string) => {
    const match = str.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  };

  // perform radio group sorting for duration field only
  if (name === FormFields.TrainingDuration.key) {
    selectOptions?.sort((a, b) => {
      const numA = extractNumber(a.value || '');
      const numB = extractNumber(b.value || '');
      return numA - numB;
    });
  }

  const requiredState = Boolean(
    isConditionallyRequired ? conditionalFieldsMandatoryState[name] : isRequired
  );

  const fieldMatch =
    (!isProductConfigured && isConfigurationOption) ||
    (isProductConfigured && !isConfigurationOption);

  const errorOrdinaryFieldState = !isValid && !selectedProduct[name]?.data;

  const errorPriceFieldState =
    (name === FormFields.PurchaseOptions.key || name === FormFields.BundleOptions.key) &&
    (isTrainingOnlyMode
      ? !selectedProduct[name]?.data
      : Boolean(
          !selectedProduct[name]?.data?.price &&
            (!selectedProduct[name]?.options ||
              (selectedProduct[name]?.options &&
                Object.values(
                  selectedProduct[name]?.options as { [key: string]: ProductOptionData }
                )?.some((item) => !item?.price)))
        ));

  const isError =
    isValidationMode &&
    requiredState &&
    fieldMatch &&
    (errorOrdinaryFieldState || errorPriceFieldState);

  // check for output head selector of pdp bundle
  const bundlePdpDataCheck = useMemo(() => {
    const isNotBundleType = bundlePdpData?.productType !== ProductTypes.bundle;
    if (isNotBundleType) {
      return true;
    }

    // if search by product key - it means search of all latest search results(productVariants)
    const isProductKeyListSet = bundlePdpData.itemProductKeyList?.length;
    const isVariantSkuList = bundlePdpData?.itemVariantSkuList?.length;

    const productKeyItemsSkus =
      Object.values(bundleProductKeyItemSkusMap || {})?.flatMap((skus) => skus) || [];

    return isProductKeyListSet
      ? productKeyItemsSkus.every((sku) => Boolean(inventoryEntries?.[sku]))
      : Boolean(
          isVariantSkuList &&
            bundlePdpData?.itemVariantSkuList?.every((sku) => Boolean(inventoryEntries?.[sku]))
        );
  }, [bundlePdpData, inventoryEntries, bundleProductKeyItemSkusMap]);

  const getChildComponent = (
    option: FormOption,
    index: number,
    isExpanded?: boolean
  ): ReactElement => {
    const { label, value, price, disabled, productMessage, addOn = undefined } = { ...option };
    const selected = selectedProduct[name as keyof ProductOptions]?.data?.value === value;

    if (addOn) {
      if (!isExpanded) {
        return <></>;
      }
      return (
        <ProductFormRadioWithAddon
          key={`${option.label}-${index}`}
          fields={{
            name,
            label,
            value,
            selected,
            price,
            isRequired: requiredState,
            disabled,
            addOn,
            noAlgoliaConnection,
            isError,
          }}
        />
      );
    }

    if (!bundlePdpDataCheck) {
      return <></>;
    }

    return (
      <ProductFormRadio
        key={`${option.label}-${index}`}
        fields={{
          name,
          label,
          value,
          productMessage,
          selected,
          price,
          disabled,
          isRequired: requiredState,
          renderButtonStyles: true,
          noAlgoliaConnection,
          isError,
          peaceOfMindTermsModalContent,
          alwaysShowPrice,
        }}
      />
    );
  };

  const noOptions = useMemo(() => {
    if (bundlePdpData?.productType === ProductTypes.bundle) {
      const productKeyListSetLength = (
        Object.values(bundleProductKeyItemSkusMap || {})?.flatMap((skus) => skus) || []
      ).length;
      const variantSkuListSetLength = bundlePdpData?.itemVariantSkuList?.length;
      return (
        !bundlePdpDataCheck &&
        (bundlePdpData.expand ? !(productKeyListSetLength || variantSkuListSetLength) : true)
      );
    } else {
      return !fields?.values?.length && !selectOptions?.length;
    }
  }, [
    fields?.values?.length,
    selectOptions?.length,
    bundlePdpData,
    bundlePdpDataCheck,
    bundleProductKeyItemSkusMap,
  ]);
  const isBundlePriceField = name === FormFields.BundleOptions.key;
  if (
    (isBundlePriceField && !fields?.values?.length) ||
    (!isBundlePriceField && !selectOptions?.length)
  ) {
    return null;
  }

  return (
    <div className={clsx('w-full', additionalClasses)}>
      <ProductFormLabel
        fields={{
          ...fields,
          isRequired: isRequired || isConditionallyRequired,
          type: FormElementTypes.radio,
          isError,
        }}
      />
      <fieldset className="space-y-2">
        {!noOptions ? (
          name === FormFields.BundleOptions.key ? (
            fields.values?.map((option, index) =>
              getChildComponent(option, index, isProductSetMode || bundlePdpData?.expand)
            )
          ) : (
            selectOptions?.map((option, index) => getChildComponent(option, index, true))
          )
        ) : (
          <span className="text-xs">{formLabels?.[FormAdditionalData.NoOptions.key]}</span>
        )}
      </fieldset>
    </div>
  );
};

export default ProductFormRadioGroup;
