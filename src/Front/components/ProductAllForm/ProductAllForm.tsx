import { ComponentRendering } from '@sitecore-jss/sitecore-jss-nextjs';
import { ComponentProps } from 'lib/component-props';
import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/router';

import { ProductFormProvider } from 'providers/index';
import ProductAllFormContent from './ProductAllFormContent';
import { ProductAllFormFields, CertificationItemFromMultilist } from './ProductAllForm.types';

interface ProductAllFormProps extends ComponentProps {
  rendering: ComponentRendering;
  fields: ProductAllFormFields;
}

const ProductAllForm = ({ fields, rendering }: ProductAllFormProps) => {
  const [selectedCertificationId, setSelectedCertificationId] = useState<string>('');
  const [selectedCertification, setSelectedCertification] =
    useState<CertificationItemFromMultilist | null>(null);

  const router = useRouter();

  useEffect(() => {
    if (!router.isReady || selectedCertificationId) return;
    const certIdParam = router.query['certId'] as string | undefined;
    if (!certIdParam) return;
    const plainGuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!plainGuidRegex.test(certIdParam)) return;
    const rawList = Array.isArray(fields.productList)
      ? fields.productList
      : fields.productList?.value;
    const match = (rawList || []).find((c) => c.id.toLowerCase() === certIdParam.toLowerCase());
    if (match) setSelectedCertificationId(match.id);
  }, [router.isReady, router.query, fields.productList, selectedCertificationId]);

  const enhancedRendering = useMemo((): ComponentRendering => {
    const certFields = selectedCertification?.fields || {};

    const enhanced: ComponentRendering = {
      uid: rendering.uid || '',
      componentName: rendering.componentName || 'ProductAllForm',
      dataSource: rendering.dataSource || '',
      fields: {
        ...(rendering.fields || {}),
        ...(certFields.regularPriceText && { regularPriceText: certFields.regularPriceText }),
        ...(certFields.memberPriceText && { memberPriceText: certFields.memberPriceText }),
        ...(certFields.candidatePriceText && {
          candidatePriceText: certFields.candidatePriceText,
        }),
        ...(certFields.associatePriceText && {
          associatePriceText: certFields.associatePriceText,
        }),
        ...(certFields.isForFreeText && { isForFreeText: certFields.isForFreeText }),
        ...(certFields.discountText && { discountText: certFields.discountText }),
        ...(certFields.loginBtnText && { loginBtnText: certFields.loginBtnText }),
      },
      params: rendering.params || {},
      placeholders: rendering.placeholders || {},
    };

    return enhanced;
  }, [rendering, selectedCertification]);

  return (
    <ProductFormProvider
      key={selectedCertificationId || 'no-selection'}
      rendering={enhancedRendering}
    >
      <ProductAllFormContent
        fields={fields}
        selectedCertificationId={selectedCertificationId}
        onCertificationChange={setSelectedCertificationId}
        onSelectedCertificationChange={setSelectedCertification}
      />
    </ProductFormProvider>
  );
};

export default ProductAllForm;
