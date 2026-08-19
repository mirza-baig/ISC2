import { useMemo, useState } from 'react';
import { ChevronRightIcon, DateIcon } from 'icons/index';
import ProductFormLabel from '../ProductFormLabel';
import DateSelectorMenu from './DateSelectorMenu';
import { FormAdditionalData, FormElement, FormElementTypes } from 'types/forms';
import clsx from 'clsx';
import { useProductForm } from 'providers/productForm';

const ProductDateSelect = ({
  fields: { fields, formLabels, isValid, isValidationMode },
}: {
  fields: {
    fields: FormElement[];
    isValid: boolean;
    formLabels: { [name: string]: string };
    isValidationMode: boolean;
  };
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const { confirmedDate, isProductConfigured, selectedProduct, isBannedTier } = useProductForm();
  const LeftContent = useMemo(() => {
    if (confirmedDate) {
      return (
        <div className="flex flex-col text-left">
          <label className="body-m font-bold">{confirmedDate.weekScheduleText}</label>
          <label className="body-m">{confirmedDate.text}</label>
        </div>
      );
    }

    return (
      <label className="text-gray-70 body-m select-none pointer-events-none">
        {formLabels?.[FormAdditionalData.SelectDates.key]}
      </label>
    );
  }, [confirmedDate, formLabels]);

  const RightContent = useMemo(() => {
    if (confirmedDate) {
      return (
        <span className="flex items-center space-x-2 text-dark-green select-none">
          <label className="cta !p-0 !border-0 tracking-tighter">
            {formLabels?.[FormAdditionalData.ChangeSchedule.key]}
          </label>
          <ChevronRightIcon size={12} />
        </span>
      );
    }

    return <DateIcon size={24} />;
  }, [confirmedDate, formLabels]);

  const isDateSetup = selectedProduct[fields[0]?.name]?.data?.value;
  const isError =
    isValidationMode && !isValid && isProductConfigured && fields[0]?.isRequired && !confirmedDate;

  return (
    <>
      <div
        className={clsx(
          'w-full',
          (isBannedTier || !isProductConfigured) && 'opacity-30 pointer-events-none'
        )}
      >
        <ProductFormLabel
          fields={{
            ...fields[0],
            type: FormElementTypes.select,
            isError,
          }}
        />
        <button
          type="button"
          disabled={!isProductConfigured}
          className={clsx(
            'w-full min-h-17.5 rounded-lg flex items-center justify-between border border-gray-70 cursor-pointer focus:ring-isc2-green focus:ring-1 p-4',
            isDateSetup && 'border-isc2-green',
            isError && '!border-red-error'
          )}
          aria-label="Open Menu"
          onClick={() => isProductConfigured && setIsMenuOpen(true)}
        >
          {LeftContent}
          {RightContent}
        </button>
      </div>

      <DateSelectorMenu
        isOpen={isMenuOpen}
        onDateConfirmed={() => setIsMenuOpen(false)}
        onMenuClose={() => setIsMenuOpen(false)}
        activeTab={activeTab}
        formLabels={formLabels}
        setActiveTab={setActiveTab}
      />
    </>
  );
};

export default ProductDateSelect;
