import { useCallback, useEffect, useMemo } from 'react';
import Link from 'next/link';
import clsx from 'clsx';

import {
  useCart,
  useLayout,
  useModal,
  useProductForm,
  useStandalonePrices,
  useUserSession,
} from 'providers/index';
import { useAddToCart } from 'hooks/index';
import { ExternalLinkIcon } from 'icons/index';

import ProductFormModal from './ProductFormModal';
import { FormTypes } from 'types/forms';
import { CurrencyMismatchModal } from '../Header/HeaderCurrencyDropdown/CurrencyMismatchModal';
import { getSelectDateBundlePayload } from 'utils/cart';
import LoadingIndicator from 'ui/LoadingIndicator';

interface ProductFormButtonFields {
  fields: {
    label: string;
    href?: string;
    formType: string;
    redeemingLabel: string;
    setIsValid: (value: boolean) => void;
    setIsValidationMode: (value: boolean) => void;
  };
}

const BUTTON_STYLES = 'primary-cta w-full h-full p-4 page-link bold-link text-center !mt-7';

const ProductFormButton = ({ fields }: ProductFormButtonFields) => {
  const { addFlashAlert } = useLayout();
  const { addToCart, isAddingToCart, addToCartSuccess } = useAddToCart({
    onError: (errorCode: string) => {
      addFlashAlert({
        type: 'error',
        label: `Product could not be added to cart: ${errorCode ?? 'DEFAULT_ERROR'}`,
        closable: true,
      });
    },
  });

  const {
    isThirdPartyProvider,
    productVariants,
    modalContent,
    formFieldsAreValid,
    currentPrice,
    bundlePdpData,
    selectedOptionSkus,
    allocationId,
    isRedeemingCompleted,
    setIsRedeemingCompleted,
    bundleOptions,
    confirmedDate,
    productKey,
    isBannedTier,
  } = useProductForm();
  const { activeCart } = useCart();
  const { currencyCode } = useUserSession();
  const { setModalContent } = useModal();
  const { openMiniCart } = useLayout();
  const { isGettingStandalonePrices } = useStandalonePrices();

  const { label, href, setIsValid, setIsValidationMode, redeemingLabel } = fields;
  const isDisabled = useMemo(() => {
    return (
      isGettingStandalonePrices ||
      Boolean(
        currentPrice &&
          // check that prices are loaded and mapped by roles
          Object.keys(currentPrice)?.length &&
          // check that prices are not undefined
          Object.keys(currentPrice).every((item) => currentPrice[item].value === undefined)
      )
    );
  }, [currentPrice, isGettingStandalonePrices]);

  useEffect(() => {
    if (addToCartSuccess) {
      openMiniCart();
    }
  }, [addToCartSuccess, openMiniCart]);

  const addToCartAction = useCallback(() => {
    if (isAddingToCart || isDisabled) {
      return;
    }

    const variantSkus = [bundlePdpData, ...productVariants, ...bundleOptions]
      .map((item) => item?.sku)
      .filter(Boolean);

    const products =
      variantSkus?.filter((productSku) =>
        selectedOptionSkus?.some((optionSku) => optionSku === productSku)
      ) || [];

    if (products?.length) {
      const sameCurrency = activeCart.computed.currencyCode === currencyCode;
      const skusNotInCartYet = products?.filter(
        (productSku) =>
          !(activeCart?.lineItems || []).some(
            (lineItem) =>
              lineItem.variant?.sku === productSku ||
              (lineItem.productType?.id === 'bundle' && lineItem.productKey === productSku)
          )
      );
      // for exam form if some of the provided products are already in the cart - we just open the minicart (CWPI-540)
      const examActiveCartItemSku =
        fields?.formType === FormTypes.CertificationExam &&
        variantSkus.find((variantSku) => {
          return activeCart?.lineItems?.find((item) => item?.variant?.sku === variantSku);
        });

      // if we select some bundle AND confiramtion date
      const selectedDateSkuWithBundleOption =
        selectedOptionSkus.some((sku) => bundleOptions.some((item) => item.sku === sku)) &&
        confirmedDate?.sku;

      if ((examActiveCartItemSku || !skusNotInCartYet.length) && sameCurrency) {
        openMiniCart();
      } else if (sameCurrency) {
        const items = variantSkus
          .filter((variantSku) => skusNotInCartYet?.some((sku) => variantSku === sku))
          .map((sku: string) =>
            getSelectDateBundlePayload({
              sku,
              selectedDateSkuWithBundleOption,
              productKey,
            })
          );
        addToCart({ items });
      } else {
        const skuList = new Set<string>();
        products.forEach((productSku) => {
          if (productSku) {
            skuList.add(productSku);
          }
        });
        activeCart?.lineItems?.forEach(({ variant }) => {
          skuList.add(variant.sku);
        });

        if (examActiveCartItemSku) {
          skuList.delete(selectedOptionSkus[0]); // there is only one selected sku in the exam form
          skuList.add(examActiveCartItemSku);
        }
        const items = variantSkus
          .filter((variantSku) => [...skuList]?.some((sku) => variantSku === sku))
          .map((sku: string) =>
            getSelectDateBundlePayload({
              sku,
              selectedDateSkuWithBundleOption,
              productKey,
            })
          );
        addToCart({ items });
      }
    }
  }, [
    productKey,
    selectedOptionSkus,
    productVariants,
    activeCart,
    isAddingToCart,
    currencyCode,
    isDisabled,
    fields?.formType,
    bundlePdpData,
    bundleOptions,
    confirmedDate?.sku,
    addToCart,
    openMiniCart,
  ]);

  const onThirdPartyButtonHandler = () => {
    setModalContent(<ProductFormModal fields={modalContent} />);
  };

  const onAddToCartButtonClick = () => {
    if (!activeCart.computed.isEmpty && activeCart.computed.currencyCode !== currencyCode) {
      return setModalContent(
        <CurrencyMismatchModal fields={modalContent} onConfirm={addToCartAction} />
      );
    }

    addToCartAction();
  };

  const validateForm = () => {
    if (isBannedTier) {
      return;
    }

    if (Boolean(allocationId) && formFieldsAreValid) {
      setIsRedeemingCompleted(true);
      return;
    }

    if (isThirdPartyProvider) {
      if (formFieldsAreValid && selectedOptionSkus?.length === 1) {
        onThirdPartyButtonHandler();
        setIsValidationMode(false);
        setIsValid(true);
      } else {
        setIsValidationMode(true);
        setIsValid(false);
      }
      return;
    }

    if (formFieldsAreValid && selectedOptionSkus?.length >= 1) {
      onAddToCartButtonClick();
    } else {
      setIsValidationMode(true);
      setIsValid(false);
    }
    setIsValidationMode(!formFieldsAreValid);
    setIsValid(formFieldsAreValid);
  };

  if (href && !isThirdPartyProvider) {
    return (
      <Link className={BUTTON_STYLES} href={href}>
        {label}
      </Link>
    );
  }

  if (isThirdPartyProvider) {
    return (
      <button
        type="button"
        className={clsx(BUTTON_STYLES, 'flex justify-center items-center')}
        onClick={() => {
          if (!isGettingStandalonePrices) {
            validateForm();
          }
        }}
        disabled={isBannedTier}
        aria-label={label}
      >
        <span className="mr-2">{label}</span>
        <ExternalLinkIcon size={20} />
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-label="Submit form"
      className={BUTTON_STYLES}
      disabled={isBannedTier || isRedeemingCompleted}
      onClick={validateForm}
    >
      {/* If the user is accepting an allocation, the button label and behavior is different */}
      {!isRedeemingCompleted ? (
        Boolean(allocationId) ? (
          redeemingLabel
        ) : (
          label
        )
      ) : (
        <LoadingIndicator className="justify-self-center !py-0 w-5" />
      )}
    </button>
  );
};

export default ProductFormButton;
