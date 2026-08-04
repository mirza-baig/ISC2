import clsx from 'clsx';
import { useMemo } from 'react';
import { CUSTOMER_PRICING_GROUP_MAP } from 'types/index';
import { useStandalonePrices, useProductForm } from 'providers/index';
import { FormElementTypes, FormFields } from 'types/forms';
import ProductFormPrice from './ProductFormPrice';
import useLoggedUser from 'hooks/useLoggedUser';
import { areEqualPrices } from 'utils/price';

const ProductFormPriceSummary = () => {
  const { isGettingStandalonePrices, showPriceForRole, isGettingPricesForRole } =
    useStandalonePrices();
  const { isUserNotLoggedIn } = useLoggedUser();
  const {
    currentPrice,
    confirmedDate,
    priceTitles,
    selectedOptionSkus,
    selectedProduct,
    productFormFields,
    productVariants,
    bundleOptions,
    productFieldPrices,
    isProductConfigured,
    isBannedTier,
  } = useProductForm();
  const regularPrice = currentPrice?.[CUSTOMER_PRICING_GROUP_MAP.NON_MEMBERS];
  const candidatePrice = currentPrice?.[CUSTOMER_PRICING_GROUP_MAP.CANDIDATES];
  const memberPrice = currentPrice?.[CUSTOMER_PRICING_GROUP_MAP.MEMBERS];
  const associatePrice = currentPrice?.[CUSTOMER_PRICING_GROUP_MAP.ASSOCIATES];

  const isPriceValuesEqualInRoles = useMemo(() => {
    const isEqualPrices = areEqualPrices([regularPrice, candidatePrice, memberPrice]);

    return isUserNotLoggedIn && isEqualPrices;
  }, [regularPrice, candidatePrice, memberPrice, isUserNotLoggedIn]);

  const isProductSelected = useMemo(
    () =>
      productFormFields.some((field) => field.type === FormElementTypes.schedule)
        ? Boolean(confirmedDate?.sku)
        : Boolean(selectedOptionSkus?.length),
    [confirmedDate?.sku, productFormFields, selectedOptionSkus?.length]
  );

  const productSelectionCheck = useMemo(() => {
    // single search result or selected date/variant
    const isScheduleSelectorPresent = productFormFields.some(
      (item) => item.name === FormFields.StartDate.key
    );

    const isTrainingOnlyMode = productFormFields.find(
      (item) => item.name === FormFields.PurchaseOptions.key
    )?.isTrainingOnlyMode;

    const isProductNarrowed = isScheduleSelectorPresent
      ? Boolean(confirmedDate?.sku)
      : (isTrainingOnlyMode && productVariants?.length === 1) || productVariants?.length;

    // bundles for purcahse option
    const isBundlePurschaseOptionsPresent = Boolean(
      bundleOptions?.filter((item) => !item.disabled)?.length
    );
    const isSelectedPurchaseOption = selectedProduct[FormFields.PurchaseOptions.key];
    const isPurchaseOptionsPresent = productFormFields.some(
      (item) => item.name === FormFields.PurchaseOptions.key
    );

    // pdp bundle selector (may have complex fields with addOns)
    const isBundlePdpOptionsPresent = productFormFields.some(
      (item) => item.name === FormFields.BundleOptions.key
    );
    const selectedBundlePdpOption = selectedProduct[FormFields.BundleOptions.key];
    const bundlePdpPrice = productFieldPrices?.[FormFields.BundleOptions.key]?.find(
      (item) => item?.value === selectedBundlePdpOption?.data?.value
    );
    const isBundlePdpPricedRoot =
      bundlePdpPrice?.price && selectedBundlePdpOption?.data?.value === bundlePdpPrice?.value;

    const isBundlePdpPricedAddon = bundlePdpPrice?.addOn?.some(
      (item) => item.price && item.value && selectedBundlePdpOption?.options?.[item.value]?.price
    );

    const isBundlePdpSet =
      selectedBundlePdpOption && (isBundlePdpPricedRoot || isBundlePdpPricedAddon);

    if (isBundlePdpOptionsPresent) {
      return isBundlePdpSet;
    }

    if (isPurchaseOptionsPresent) {
      return (
        isProductConfigured &&
        (isBundlePurschaseOptionsPresent
          ? isProductNarrowed && isSelectedPurchaseOption
          : isProductSelected)
      );
    }
    return isProductConfigured && isProductSelected;
  }, [
    productFormFields,
    bundleOptions,
    confirmedDate?.sku,
    productVariants?.length,
    selectedProduct,
    isProductConfigured,
    isProductSelected,
    productFieldPrices,
  ]);

  if (isBannedTier) {
    return <></>;
  }

  return (
    <>
      {Boolean(productSelectionCheck && !isGettingPricesForRole) && (
        <div
          className={clsx(
            'flex flex-col w-full px-4 !mt-7',
            isGettingStandalonePrices ? 'space-y-3.5' : 'space-y-0.5'
          )}
        >
          {Boolean(regularPrice) && showPriceForRole.forRegularUser && (
            <ProductFormPrice
              price={regularPrice}
              freeText={priceTitles?.isForFreeText?.value}
              title={priceTitles?.regularPriceText?.value}
              isLoadingPrices={isGettingStandalonePrices}
              additionalClasses="body-m space-x-2 font-semibold"
            />
          )}
          {!isPriceValuesEqualInRoles &&
            Boolean(candidatePrice) &&
            showPriceForRole.forCandidateUser && (
              <ProductFormPrice
                price={candidatePrice}
                freeText={priceTitles?.isForFreeText?.value}
                title={priceTitles?.candidatePriceText?.value}
                isLoadingPrices={isGettingStandalonePrices}
                additionalClasses="text-isc2-green space-x-2 body-m font-semibold"
              />
            )}
          {!isPriceValuesEqualInRoles && Boolean(memberPrice) && showPriceForRole.forMemberUser && (
            <ProductFormPrice
              price={memberPrice}
              freeText={priceTitles?.isForFreeText?.value}
              title={priceTitles?.memberPriceText?.value}
              isLoadingPrices={isGettingStandalonePrices}
              additionalClasses="text-isc2-green space-x-2 body-m font-semibold"
            />
          )}
          {!isPriceValuesEqualInRoles &&
            Boolean(associatePrice) &&
            showPriceForRole.forAssociateUser && (
              <ProductFormPrice
                price={associatePrice}
                freeText={priceTitles?.isForFreeText?.value}
                title={priceTitles?.associatePriceText?.value}
                isLoadingPrices={isGettingStandalonePrices}
                additionalClasses="text-isc2-green space-x-2 body-m font-semibold"
              />
            )}
        </div>
      )}
    </>
  );
};

export default ProductFormPriceSummary;
