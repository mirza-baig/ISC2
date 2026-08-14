import clsx from 'clsx';
import { useCallback, useMemo } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { FormElementTypes, PRODUCT_ONLY_KEY } from 'types/forms';

import { ProductPrice, StandalonePrice } from 'types/index';
import { useModal, useProductForm, useStandalonePrices } from 'providers/index';

import ProductFormPrice from './ProductFormPrice';
import { RichText } from '@sitecore-jss/sitecore-jss-nextjs';
import ProductFormModal from './ProductFormModal';
import { buildProductFormModal, ProductFormModalLabelsType } from 'utils/product-form';

interface ProductFormRadioFields {
  fields: {
    name: string;
    label: string;
    value: string;
    productMessage?: string;
    selected: boolean;
    price?: ProductPrice;
    isRequired?: boolean;
    isExtraPrice?: boolean;
    disabled?: boolean;
    type?: string;
    renderButtonStyles?: boolean;
    noAlgoliaConnection?: boolean;
    parentKey?: string;
    isError?: boolean;
    alwaysShowPrice?: boolean;
    peaceOfMindTermsModalContent?: ProductFormModalLabelsType;
  };
}

const ProductFormRadio = ({ fields }: ProductFormRadioFields) => {
  const {
    name,
    label,
    value,
    productMessage,
    selected,
    price,
    isRequired = false,
    isExtraPrice = false,
    disabled = false,
    type = FormElementTypes.radio,
    renderButtonStyles,
    parentKey,
    isError,
    peaceOfMindTermsModalContent,
    alwaysShowPrice,
  } = { ...fields };
  const { isGettingStandalonePrices } = useStandalonePrices();
  const { toggleSelectedProduct, isShowPrices, productVariants, isBannedTier } = useProductForm();
  const { setModalContent } = useModal();

  const onOpenTermsAndConditionHandler = useCallback(
    (e: ReactMouseEvent<HTMLDivElement>) => {
      if (!(e.target as HTMLElement).closest('a')) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      if (peaceOfMindTermsModalContent?.fields) {
        const modalData = buildProductFormModal(peaceOfMindTermsModalContent, true);
        setModalContent(<ProductFormModal fields={{ ...modalData }} />);
      }
    },
    [peaceOfMindTermsModalContent, setModalContent]
  );

  const handleClick = useCallback((): void => {
    if (isBannedTier) {
      return;
    }
    toggleSelectedProduct(
      {
        [fields?.name]: {
          value: fields?.value,
          ...(fields?.price?.currencyCode && { price: fields?.price }),
          noAlgoliaConnection: fields?.noAlgoliaConnection,
        },
      },
      fields?.parentKey
    );
  }, [fields, isBannedTier, toggleSelectedProduct]);

  const labelValue = useMemo(
    () => (value === PRODUCT_ONLY_KEY ? productVariants?.[0]?.title || label : label),
    [label, productVariants, value]
  );

  return (
    <div className={clsx('w-full flex flex-wrap items-stretch')}>
      <div className={clsx('w-full flex')}>
        <button
          type="button"
          title={labelValue}
          onClick={handleClick}
          className={clsx(
            'relative',
            'w-full h-full py-5 disabled:text-gray-70 disabled:pointer-events-none',
            renderButtonStyles &&
              'px-4 border border-gray-70 rounded-lg has-[:checked]:border-isc2-green disabled:border-gray-70',
            isBannedTier && 'pointer-events-none',
            isError && !disabled && '!border-red-error'
          )}
          aria-label={`Toggle ${labelValue}`}
          disabled={disabled}
        ></button>
      </div>
      <div className={clsx('py-5 px-4 -ml-[100%] w-full flex flex-col')}>
        <div
          className={clsx(
            'flex w-full min-h-7 justify-between space-x-2',
            parentKey ? 'items-start' : 'items-center'
          )}
        >
          <span className={clsx('flex w-full', parentKey ? 'items-start' : 'items-center')}>
            <input
              id={value}
              name={name}
              title={name}
              type={type}
              className={clsx(
                'h-4 w-4 mr-2 cursor-pointer border checked:border-isc2-green bg-white-00 hover:text-isc2-green',
                'checked:text-isc2-green focus:ring-isc2-green focus:ring-1 pointer-events-none',
                type === FormElementTypes.radio ? 'rounded-lg' : 'rounded-sm',
                disabled && 'disabled:border-gray-300',
                parentKey && 'mt-1.5'
              )}
              disabled={disabled}
              checked={selected}
              required={type !== FormElementTypes.checkbox && isRequired}
              tabIndex={-1}
              onClick={(e) => e.stopPropagation()}
              onChange={() => false}
            />
            <label
              htmlFor={value}
              className={clsx(
                'disabled:cursor-default text-left body-m align-middle',
                !isBannedTier && !disabled && 'cursor-pointer',
                disabled && 'text-gray-50',
                parentKey && 'pt-0.5'
              )}
            >
              {labelValue}
            </label>
          </span>
          {!isBannedTier &&
            (isGettingStandalonePrices || price) &&
            (isShowPrices || (alwaysShowPrice && price)) && (
              <ProductFormPrice
                price={{ value: price } as StandalonePrice}
                isLoadingPrices={isGettingStandalonePrices}
                prefix={isExtraPrice ? '\u002B' : undefined}
                additionalClasses={clsx(
                  'font-bold',
                  disabled && `text-gray-50`,
                  isGettingStandalonePrices && 'w-20'
                )}
              />
            )}
        </div>
        {Boolean(productMessage) && (
          <div
            className="pdp-radio-rich-text body-s text-gray-500 pl-6 m-0"
            onClickCapture={onOpenTermsAndConditionHandler}
          >
            <RichText field={{ value: productMessage }} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductFormRadio;
