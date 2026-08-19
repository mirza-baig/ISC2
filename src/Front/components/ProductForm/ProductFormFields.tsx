import { FormAdditionalData, FormElement, FormElementTypes } from 'types/forms';
import ProductDateSelect from './ProductDateSelect';
import ProductFormDescription from './ProductFormDescription';
import ProductFormDisclaimer from './ProductFormDisclaimer';
import ProductFormHeadline from './ProductFormHeadline';
import ProductFormPriceSummary from './ProductFormPriceSummary';
import ProductFormRadioGroup from './ProductFormRadioGroup';
import ProductFormSelect from './ProductFormSelect';
import ProductFormButton from './ProductFormButton';
import { useEffect, useState } from 'react';
import { useProductForm } from 'providers/productForm';
import ProductFormNotice from './ProductFormNotice';
import { ProductFormModalLabelsType } from 'utils/product-form';

interface ProductFormFieldsProps {
  productForm: FormElement[];
  formLabels: {
    [key: string]: string;
  };
  formType: string;
  peaceOfMindTermsModalContent?: ProductFormModalLabelsType;
  afterHeadlineElement?: React.ReactNode;
  hideHeadline?: boolean; // Hide headline element for ProductAllForm visual integration
}

// Third-party related commented code could be restored in the next project iteration when we turn on filtering by training provider

const getJsxFormElement = ({
  productForm,
  element,
  //isThirdPartyProvider,
  formLabels,
  isValid,
  setIsValid,
  isValidationMode,
  setIsValidationMode,
  formType,
  peaceOfMindTermsModalContent,
  isBannedTier,
}: {
  productForm: FormElement[];
  element: FormElement;
  // isThirdPartyProvider: boolean;
  formLabels: {
    [key: string]: string;
  };
  isValid: boolean;
  setIsValid: (value: boolean) => void;
  isValidationMode: boolean;
  setIsValidationMode: (value: boolean) => void;
  formType: string;
  peaceOfMindTermsModalContent?: ProductFormModalLabelsType;
  isBannedTier: boolean;
}) => {
  /*const isThirdPartyNotVisibleItem = isThirdPartyProvider && element?.hideForThirdParty;
  const isNotThirdPartyVisibleItem = !isThirdPartyProvider && element?.hideForThirdParty === false;

  if (isThirdPartyNotVisibleItem || isNotThirdPartyVisibleItem) {
    return null;
  }*/

  switch (element.type) {
    case FormElementTypes.headline:
      return <ProductFormHeadline fields={element} key={element.name} />;

    case FormElementTypes.select:
      const elementSelectArg = {
        ...element,
        notificationMessage: formLabels?.[FormAdditionalData.NarrowResultsByFilters.key],
        isValid,
        isValidationMode,
        ...(isBannedTier && { additionalClasses: 'opacity-30' }),
      };
      return <ProductFormSelect fields={elementSelectArg} key={element.name} />;

    case FormElementTypes.radio:
      const args = {
        ...element,
        isValid,
        formLabels,
        isValidationMode,
        peaceOfMindTermsModalContent,
        ...(isBannedTier && { additionalClasses: 'opacity-30' }),
      };
      return <ProductFormRadioGroup fields={args} key={element.name} />;

    // date handles start and end dates as one, but stored as separate values for potential further usage
    case FormElementTypes.schedule:
      const fields: FormElement[] = productForm?.filter(
        (item) => item?.type === FormElementTypes.schedule
      );

      return (
        fields?.[0]?.name === element.name && (
          <ProductDateSelect
            fields={{
              fields,
              formLabels,
              isValid,
              isValidationMode,
            }}
            key={fields?.[0]?.name}
          />
        )
      );

    case FormElementTypes.disclaimer:
      const disclaimerNotice = formLabels?.[FormAdditionalData.DisclaimerNotice.key];
      const elementDisclaimerArg = {
        ...element,
        ...(disclaimerNotice && {
          value: disclaimerNotice,
        }),
      };
      return <ProductFormDisclaimer fields={elementDisclaimerArg} key={element.name} />;

    case FormElementTypes.description:
      return <ProductFormDescription fields={element} key={element.name} />;

    case FormElementTypes.formNotice:
      return <ProductFormNotice fields={element} key={element.name} />;

    case FormElementTypes.priceSummary:
      return <ProductFormPriceSummary key={element.name} />;

    case FormElementTypes.button:
      return (
        <ProductFormButton
          fields={{
            ...element,
            formType,
            setIsValid,
            setIsValidationMode,
            redeemingLabel: formLabels?.[FormAdditionalData.ConfirmOptionsCta.key],
          }}
          key={element.name}
        />
      );

    default:
      return null;
  }
};

const ProductFormFields = ({
  productForm,
  formLabels,
  formType,
  peaceOfMindTermsModalContent,
  afterHeadlineElement,
  hideHeadline,
}: ProductFormFieldsProps) => {
  const { /*isThirdPartyProvider,*/ isProductConfigured, isBannedTier } = useProductForm();

  const [isValid, setIsValid] = useState<boolean>(true);
  const [isValidationMode, setIsValidationMode] = useState<boolean>(false);

  useEffect(() => {
    if (isProductConfigured) {
      setIsValid((data) => (!data ? true : data));
    }
  }, [isProductConfigured /*, isThirdPartyProvider*/]);

  useEffect(() => {
    if (isValid) {
      setIsValidationMode(false);
    }
  }, [isValid]);

  return (
    <>
      {productForm?.map((element) => {
        // Skip headline if hideHeadline is true (for ProductAllForm visual integration)
        if (element.type === FormElementTypes.headline && hideHeadline) {
          return null;
        }

        const jsxElement = getJsxFormElement({
          productForm,
          element,
          //isThirdPartyProvider,
          formLabels,
          isValid,
          setIsValid,
          isValidationMode,
          setIsValidationMode,
          formType,
          peaceOfMindTermsModalContent,
          isBannedTier,
        });

        // If this is the headline and we have an afterHeadlineElement, render both
        if (element.type === FormElementTypes.headline && afterHeadlineElement) {
          return (
            <>
              {jsxElement}
              {afterHeadlineElement}
            </>
          );
        }

        return jsxElement;
      })}
    </>
  );
};

export default ProductFormFields;
