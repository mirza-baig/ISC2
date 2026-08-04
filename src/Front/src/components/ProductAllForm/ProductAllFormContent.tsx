import { useMemo, useEffect } from 'react';
import { RichTextUI } from 'ui/index';
import ProductFormContent from '../ProductForm/ProductFormContent';
import {
  ProductAllFormFields,
  isNonProductPage,
  CertificationItemFromMultilist,
} from './ProductAllForm.types';
import { ProductFormPropsFields } from '../ProductForm/ProductForm';

interface ProductAllFormContentProps {
  fields: ProductAllFormFields;
  selectedCertificationId: string;
  onCertificationChange: (id: string) => void;
  onSelectedCertificationChange?: (cert: CertificationItemFromMultilist | null) => void;
}

const ProductAllFormContent = ({
  fields,
  selectedCertificationId,
  onCertificationChange,
  onSelectedCertificationChange,
}: ProductAllFormContentProps) => {
  const certificationsList = useMemo(() => {
    const rawList = Array.isArray(fields.productList)
      ? fields.productList
      : fields.productList?.value;

    return (rawList || []).filter(
      (cert) => cert.fields?.allProductDropDownTitle?.value || cert.displayName || cert.name
    );
  }, [fields.productList]);

  const selectedCertification = useMemo(() => {
    if (!selectedCertificationId || !certificationsList.length) return null;
    const cert = certificationsList.find((cert) => cert.id === selectedCertificationId) || null;

    return cert;
  }, [selectedCertificationId, certificationsList]);

  useEffect(() => {
    onSelectedCertificationChange?.(selectedCertification);
  }, [selectedCertification, onSelectedCertificationChange]);

  const isNonProductSelected = useMemo(() => {
    if (!selectedCertification) return false;
    return isNonProductPage(selectedCertification);
  }, [selectedCertification]);

  const productFormFields = useMemo((): ProductFormPropsFields | null => {
    if (!selectedCertification?.fields || isNonProductSelected) {
      return null;
    }

    const certFields = selectedCertification.fields;
    const skuValue = certFields.sku?.value || '';

    const productKeyValue = certFields.productKey?.value || selectedCertification.name || skuValue;

    const defaultFormLabels = {
      fields: {
        currencyChangeModal: { fields: {} },
        thirdPartyModal: { fields: {} },
        productOptionsScheduledModal: { fields: {} },
        toolTips: { value: '' },
        labels: { value: '' },
        messages: { value: '' },
        headline: { value: '' },
        primaryCtaLabel: { value: '' },
      },
    };

    return {
      formType: certFields.formType || { value: '' },
      formLabelsAndTooltips: certFields.formLabelsAndTooltips || defaultFormLabels,
      sku: certFields.sku || { value: '' },
      productKey: { value: productKeyValue },
      headline: certFields.headline || { value: '' },
    };
  }, [selectedCertification, isNonProductSelected]);

  const handleCertificationChange = (certificationId: string) => {
    onCertificationChange(certificationId);
  };

  const renderNonProductLink = () => {
    const linkField = selectedCertification?.fields?.primaryCTA?.value;
    if (!linkField?.href) return null;

    return (
      <div className="mt-8 text-center">
        <a
          href={linkField.href}
          className="inline-block px-8 py-3 bg-isc2-green text-white font-semibold rounded-md hover:bg-isc2-green-dark transition-colors"
          target="_blank"
          rel="noopener noreferrer"
        >
          {linkField.text || 'Register for Exam'}
        </a>
      </div>
    );
  };

  if (!certificationsList.length) {
    return (
      <>
        {fields.errorMessage?.value ? (
          <RichTextUI value={fields.errorMessage.value} />
        ) : (
          <p className="text-center text-red-600">
            No certifications available. Please configure the Product List field.
          </p>
        )}
      </>
    );
  }

  const certificationSelectorElement = (
    <>
      <div className="flex items-center justify-between mb-1 min-h-6">
        <label htmlFor="certification-selector" className="body-m">
          Select a Certification
        </label>
        <div className="flex items-center space-x-1 body-s text-gray-500">
          <span>Required</span>
        </div>
      </div>
      <select
        id="certification-selector"
        value={selectedCertificationId || ''}
        onChange={(e) => handleCertificationChange(e.target.value)}
        disabled={certificationsList.length === 0}
        className="w-full px-4 py-3 border border-gray-300 rounded-md text-base text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-isc2-green focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed appearance-none cursor-pointer"
      >
        <option value="">
          {fields.productListSelectorPlaceholder?.value || 'Choose your certification...'}
        </option>
        {certificationsList.map((cert) => (
          <option key={cert.id} value={cert.id}>
            {cert.fields?.allProductDropDownTitle?.value || cert.displayName || cert.name}
          </option>
        ))}
      </select>
    </>
  );

  return (
    <>
      {!selectedCertification ? (
        <section id="product-form" className="space-y-8 sm:space-y-10">
          <div className="w-full flex flex-wrap p-6 bg-transparent rounded-lg border border-gray-500 text-black-100 space-y-4">
            <div className="w-full">
              <h2 className="headline-m mb-6">{fields.formHeadlineText?.value}</h2>
              {certificationSelectorElement}
            </div>
            {fields.noSelectionMessage?.value && (
              <div className="w-full text-center">
                <RichTextUI value={fields.noSelectionMessage.value} />
              </div>
            )}
          </div>
        </section>
      ) : isNonProductSelected ? (
        <section id="product-form" className="space-y-8 sm:space-y-10">
          <div className="w-full p-6 bg-transparent rounded-lg border border-gray-500 space-y-4">
            <div className="w-full">
              <h2 className="headline-m mb-6">{fields.formHeadlineText?.value}</h2>
              {certificationSelectorElement}
            </div>

            <div className="w-full text-center">
              <h3 className="headline-s mb-4">
                {selectedCertification.fields?.headline?.value || selectedCertification.name}
              </h3>
              {renderNonProductLink()}
            </div>
          </div>
        </section>
      ) : (
        productFormFields && (
          <section id="product-form" className="space-y-8 sm:space-y-10">
            <form className="w-full flex flex-wrap p-6 bg-transparent rounded-lg border border-gray-500 text-black-100 space-y-4">
              <div className="w-full">
                <h2 className="headline-m mb-6">{fields.formHeadlineText?.value}</h2>
                {certificationSelectorElement}
              </div>

              <ProductFormContent fields={productFormFields} hideHeadline={true} noWrapper={true} />
            </form>
          </section>
        )
      )}
    </>
  );
};

export default ProductAllFormContent;
