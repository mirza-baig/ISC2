import { useEffect, useMemo, useState, useRef } from 'react';

import {
  FormAdditionalData,
  FormElement,
  FormFields,
  FormTypes,
  ProductOptions,
} from 'types/forms';
import {
  buildProductForm,
  buildProductFormModal,
  extractLabels,
  extractAttributeValue,
} from 'utils/product-form';
import ProductFormFields from './ProductFormFields';
import {
  CertificationExamScaffold,
  CertificatesScaffold,
  TrainingClassroomBasedScaffold,
  TrainingOnlineInstructorScaffold,
  TrainingOnlineSelfPacedScaffold,
  TrainingCoursesScaffold,
  SkillBuilderScaffold,
} from 'scaffolds/forms';
import { FALLBACK_EXTERNAL_PROVIDER_LINK_TEXT } from 'constants/pdp';
import { useUserSession, useProductForm, useStandalonePrices, useModal } from 'providers/index';
import LoadingIndicator from 'ui/LoadingIndicator';
import {
  ALLOCATION_ID,
  ANALYTICS_EVENTS,
  DEFAULT_BRAND,
  PRODUCT_REDEEM_MODAL_ERRORS,
} from 'constants/index';

import { useRouter } from 'next/router';
import { useAcceptOilAllocation } from 'hooks/index';
import useAnalyticsTracking from 'hooks/useAnalyticsTracking';
import { ProductFormPropsFields } from './ProductForm';
import { formatAnalyticsPrice } from 'utils/analytics';
import ProductFormOptionsScheduledModal from './ProductFormOptionsScheduledModal';

interface ProductFormContentProps {
  fields: ProductFormPropsFields;
  prependElement?: React.ReactNode; // Renders before all fields
  afterHeadlineElement?: React.ReactNode; // Renders after headline but before other fields
  hideHeadline?: boolean; // Hide the headline element if true (for ProductAllForm visual integration)
  noWrapper?: boolean; // Render without section/form wrapper (for ProductAllForm visual integration)
}

const getProductFormScaffold = (formType: string): FormElement[] => {
  switch (formType) {
    case FormTypes.TrainingOnlineInstructor:
      return TrainingOnlineInstructorScaffold;

    case FormTypes.TrainingOnlineSelfPaced:
      return TrainingOnlineSelfPacedScaffold;

    case FormTypes.TrainingClassroomBased:
      return TrainingClassroomBasedScaffold;

    case FormTypes.Courses:
      return TrainingCoursesScaffold;

    case FormTypes.CertificationExam:
      return CertificationExamScaffold;

    case FormTypes.Certificate:
      return CertificatesScaffold;

    case FormTypes.SkillBuilder:
      return SkillBuilderScaffold;

    default:
      console.error(`Invalid product form type from Sitecore ${formType}`);
      return [];
  }
};

const ProductFormContent = ({
  fields,
  prependElement,
  afterHeadlineElement,
  hideHeadline,
  noWrapper,
}: ProductFormContentProps) => {
  const formType = fields.formType?.fields?.Value?.value as string;
  const formScaffold = getProductFormScaffold(formType);
  const router = useRouter();
  const [preselectPrdSku, setPreselectPrdSku] = useState<string | null>(null);
  const [preselectDateSku, setPreselectDateSku] = useState<string | null>(null);

  useEffect(() => {
    if (!router.isReady) return;
    const getQueryParam = (key: string): string | undefined => {
      const match = Object.keys(router.query).find((k) => k.toLowerCase() === key);
      return match ? (router.query[match] as string | undefined) : undefined;
    };
    setPreselectPrdSku(getQueryParam('prd-sku')?.toUpperCase() ?? null);
    setPreselectDateSku(getQueryParam('date-sku')?.toUpperCase() ?? null);
  }, [router.isReady, router.query]);

  const { currencyCode } = useUserSession();
  const { showPriceForRole, productPrices, isGettingPricesForRole, addSkuToPricingQueue } =
    useStandalonePrices();
  const { acceptOilAllocationAsync } = useAcceptOilAllocation();

  const {
    selectedOptionSkus,
    isThirdPartyProvider,
    setProductKey,
    setProductFormFields,
    setOptionPriceData,
    productFormFields,
    productFieldPrices,
    productVariants,
    setModalContent: setProductFormModalContent,
    snapshotData,
    isSearchError,
    facetList,
    isRedeemingCompleted,
    allocationId,
    productKey,
    setAllocationId,
    toggleSelectedProduct,
    presetSelectedProduct,
    bundleOptions,
    updateConfirmedDate,
    scheduleData,
    selectedProduct,
  } = useProductForm();

  const { track } = useAnalyticsTracking();
  const eventTrackedRef = useRef(false);

  useEffect(() => {
    if (!router.isReady) return;
    const allocationId = (router.query[ALLOCATION_ID] as string | undefined) ?? null;
    setAllocationId(allocationId);
  }, [router.isReady, router.query, setAllocationId]);

  const { setModalContent } = useModal();
  const [loadingProductId, setLoadingProductId] = useState(false);
  const [formFieldsData, setFormFieldsData] = useState<FormElement[]>([]);

  const formLabelsMap: { [key: string]: { key: string; label?: string } } = useMemo(
    () => ({
      ...FormAdditionalData,
      ...FormFields,
    }),
    []
  );
  const formNotice = fields?.formLabelsAndTooltips?.fields?.formNotice;
  const formDataMessages = fields?.formLabelsAndTooltips?.fields?.messages?.value;
  const formDataLabels = fields?.formLabelsAndTooltips?.fields?.labels?.value;
  const formDataExtractedLabels = ((formDataLabels && [formDataLabels]) || [])
    .concat((formDataMessages && [formDataMessages]) || [])
    .join('&');
  const formLabels = useMemo(
    () => extractLabels(formLabelsMap, formDataExtractedLabels),
    [formDataExtractedLabels, formLabelsMap]
  );

  const buttonLabels = useMemo(() => {
    return {
      regular: formLabels?.[formLabelsMap.Button.key] || FormFields.Button.label,
      thirdParty:
        formLabels?.[formLabelsMap.ThirdPartyCta.key] || FALLBACK_EXTERNAL_PROVIDER_LINK_TEXT,
    };
  }, [formLabels, formLabelsMap]);
  const peaceOfMindTermsModalContent = fields?.formLabelsAndTooltips?.fields?.peaceOfMindTermsModal;

  const productForm = useMemo(() => {
    return buildProductForm({
      formScaffold,
      fields: {
        ...fields?.formLabelsAndTooltips?.fields,
        primaryCtaLabel: isThirdPartyProvider
          ? buttonLabels.thirdParty
          : buttonLabels.regular || '',
      },
    });
  }, [isThirdPartyProvider, buttonLabels, fields?.formLabelsAndTooltips?.fields, formScaffold]);

  useEffect(() => {
    if (snapshotData && productKey) {
      // collect all possible sku values in the form and avoid potential duplicates
      const skuArray = new Set(
        [productKey, ...snapshotData.map((item) => item.sku)].filter(Boolean)
      );
      addSkuToPricingQueue([...skuArray]);
    }
  }, [productKey, snapshotData, addSkuToPricingQueue]);

  useEffect(() => {
    const masterVariantPrice = productPrices?.[fields.sku?.value];

    if (
      formType &&
      !eventTrackedRef.current &&
      !isGettingPricesForRole &&
      masterVariantPrice &&
      snapshotData.length > 0
    ) {
      const attributes = snapshotData
        ?.filter((product) => product.isMasterVariant)
        .find((product) => product.productKey === fields.productKey?.value);

      if (!attributes) {
        return;
      }

      const { price, discount } = formatAnalyticsPrice({
        prices: masterVariantPrice,
        showPriceForRole,
      });

      track({ ecommerce: null });
      track({
        event: ANALYTICS_EVENTS.VIEW_ITEM,
        ecommerce: {
          currency: currencyCode,
          items: [
            {
              item_id: attributes.productKey,
              item_name: attributes.parentTitle,
              ...(attributes.productTypeLabel !== undefined && {
                item_category: attributes.productTypeLabel,
              }),
              ...(attributes.division?.label !== undefined && {
                item_category2: attributes.division?.label,
              }),
              ...(attributes.modality?.label !== undefined && {
                item_category3: attributes.modality.label,
              }),
              index: 0,
              item_brand: DEFAULT_BRAND,
              price,
              ...(discount !== undefined && { discount }),
            },
          ],
        },
      });

      eventTrackedRef.current = true;
    }
  }, [
    currencyCode,
    fields,
    formType,
    isGettingPricesForRole,
    productPrices,
    showPriceForRole,
    snapshotData,
    track,
  ]);

  useEffect(() => {
    const thirdPartyLink =
      productVariants?.length === 1 && (productVariants[0].link as string[])?.[0];
    const thirdPartyLinkWithProtocol =
      thirdPartyLink && /^(http|https):\/\//i.test(thirdPartyLink)
        ? thirdPartyLink
        : thirdPartyLink
        ? `https://${thirdPartyLink}`
        : thirdPartyLink;
    setProductFormModalContent(
      buildProductFormModal(
        isThirdPartyProvider
          ? {
              fields: {
                ...fields?.formLabelsAndTooltips?.fields?.thirdPartyModal.fields,
                ...(thirdPartyLinkWithProtocol && {
                  formThirdPartyCTA: thirdPartyLinkWithProtocol,
                }),
              },
            }
          : fields?.formLabelsAndTooltips?.fields?.currencyChangeModal
      )
    );
  }, [
    formType,
    isThirdPartyProvider,
    productVariants,
    fields?.formLabelsAndTooltips?.fields?.currencyChangeModal,
    fields?.formLabelsAndTooltips?.fields?.thirdPartyModal?.fields,
    fields?.formLabelsAndTooltips?.fields?.peaceOfMindTermsModal?.fields,
    setProductFormModalContent,
  ]);

  useEffect(() => {
    if (currencyCode && productPrices) {
      setOptionPriceData(formLabels, productPrices);
    }
  }, [setOptionPriceData, currencyCode, productPrices, formLabels]);

  useEffect(() => {
    if (productForm && !productFormFields?.length) {
      setProductFormFields(productForm);
    }
  }, [productForm, setProductFormFields, productFormFields]);

  useEffect(() => {
    if (fields?.productKey?.value && !loadingProductId) {
      setProductKey((oldValue) => oldValue || fields.productKey.value);
      setLoadingProductId(true);
    }
  }, [fields.productKey.value, loadingProductId, setProductKey]);

  const preInitRef = useRef(false);
  const prePurchaseDoneRef = useRef(false);
  const preScheduleDoneRef = useRef(false);
  const [phase1DoneSignal, setPhase1DoneSignal] = useState(false);
  const [phase3DoneSignal, setPhase3DoneSignal] = useState(false);

  useEffect(() => {
    if (
      (!preselectPrdSku && !preselectDateSku) ||
      preInitRef.current ||
      !snapshotData.length ||
      !productFormFields.length
    ) {
      return;
    }

    const targetSku = preselectDateSku ?? preselectPrdSku;
    const hit =
      snapshotData.find((item) => item.sku === targetSku) ??
      bundleOptions.find((item) => item.sku === targetSku);

    if (!hit && !bundleOptions.length) {
      return;
    }

    preInitRef.current = true;

    setPhase1DoneSignal(true);
    if (hit) {
      const configValues: ProductOptions = {};
      productFormFields
        .filter((f) => f.isConfigurationOption)
        .forEach((field) => {
          const raw = extractAttributeValue(hit, field.name);
          const value = raw != null ? String(raw) : null;
          if (value) {
            configValues[field.name] = { data: { value } };
          }
        });
      if (Object.keys(configValues).length) {
        presetSelectedProduct(configValues);
      }
    }
  }, [
    snapshotData,
    bundleOptions,
    productFormFields,
    preselectPrdSku,
    preselectDateSku,
    presetSelectedProduct,
  ]);

  useEffect(() => {
    if (!preselectPrdSku || !phase1DoneSignal || prePurchaseDoneRef.current) return;
    if (preselectDateSku && !phase3DoneSignal && !selectedProduct[FormFields.StartDate.key]) return;

    const bundleMatch = bundleOptions.find(
      (item) => item.sku === preselectPrdSku && !item.disabled
    );
    if (bundleMatch) {
      prePurchaseDoneRef.current = true;
      toggleSelectedProduct({
        [FormFields.PurchaseOptions.key]: { value: preselectPrdSku, noAlgoliaConnection: true },
      });
      return;
    }

    const purchaseOptions = productFieldPrices?.[FormFields.PurchaseOptions.key];
    if (purchaseOptions?.length) {
      const match = purchaseOptions.find((opt) => opt.value === preselectPrdSku);
      if (match) {
        prePurchaseDoneRef.current = true;
        toggleSelectedProduct({
          [FormFields.PurchaseOptions.key]: { value: preselectPrdSku, noAlgoliaConnection: true },
        });
      }
    }
  }, [
    bundleOptions,
    productFieldPrices,
    preselectPrdSku,
    preselectDateSku,
    phase1DoneSignal,
    phase3DoneSignal,
    selectedProduct,
    toggleSelectedProduct,
  ]);

  useEffect(() => {
    if ((!preselectPrdSku && !preselectDateSku) || !phase1DoneSignal || preScheduleDoneRef.current)
      return;
    if (!scheduleData?.length) return;

    preScheduleDoneRef.current = true;
    const dateSku = preselectDateSku ?? preselectPrdSku;
    const matchingDate = scheduleData.flatMap((g) => g.dates).find((d) => d.sku === dateSku);
    if (matchingDate) {
      updateConfirmedDate(matchingDate);
    } else if (preselectDateSku && preselectPrdSku) {
      setPhase3DoneSignal(true);
    }
  }, [scheduleData, preselectPrdSku, preselectDateSku, phase1DoneSignal, updateConfirmedDate]);

  useEffect(() => {
    // here we set up updated form data with merged external prices into it
    if (productFormFields) {
      const data = productFormFields.reduce((acc, item) => {
        const isPriceBlock =
          item.name === FormFields.BundleOptions.key ||
          item.name === FormFields.PurchaseOptions.key;
        const value = {
          ...item,
          ...(item.name === FormFields.FormNotice.key && {
            label: formNotice?.value,
          }),
          ...(isPriceBlock && {
            values: productFieldPrices?.[item.name],
          }),
        };
        return [...acc, value] as FormElement[];
      }, []);
      setFormFieldsData(data);
    }
  }, [productFieldPrices, productFormFields, formNotice, setFormFieldsData]);

  // Redeem OIL allocation product logic
  useEffect(() => {
    const acceptAllocation = async () => {
      if (!allocationId) {
        return;
      }

      const redeemedModalFields =
        fields?.formLabelsAndTooltips?.fields?.productOptionsScheduledModal.fields;
      const productInformations = snapshotData.find(
        (products) => products.sku === selectedOptionSkus[0]
      );

      if (!productInformations) {
        console.error('Product selection is invalid, no data found.');
        setModalContent(
          <ProductFormOptionsScheduledModal
            isSuccess={false}
            redeemedModalFields={redeemedModalFields}
            errorCode={PRODUCT_REDEEM_MODAL_ERRORS.DEFAULT}
          />,
          {
            dismissOnClickOutside: false,
          }
        );

        return;
      }

      const { success, errorCode } = await acceptOilAllocationAsync({
        allocationId,
        productSku: productInformations.sku,
      });

      setModalContent(
        <ProductFormOptionsScheduledModal
          isSuccess={success}
          redeemedModalFields={redeemedModalFields}
          errorCode={errorCode}
          productData={productInformations}
        />,
        {
          dismissOnClickOutside: false,
        }
      );
    };

    if (isRedeemingCompleted) {
      acceptAllocation();
    }
  }, [
    acceptOilAllocationAsync,
    allocationId,
    fields?.formLabelsAndTooltips,
    isRedeemingCompleted,
    selectedOptionSkus,
    setModalContent,
    snapshotData,
  ]);

  const mappedForm = useMemo(() => {
    const index = formFieldsData.findIndex((field) => field.name === FormFields.Button.key);
    if (index >= 0) {
      formFieldsData[index].label = isThirdPartyProvider
        ? buttonLabels.thirdParty
        : buttonLabels.regular || '';
      return formFieldsData;
    }
    return formFieldsData;
  }, [formFieldsData, isThirdPartyProvider, buttonLabels]);

  const showLoader = useMemo(() => {
    return !Object.keys(facetList).length;
  }, [facetList]);

  if (!productForm) {
    return null;
  }

  // Render fields content
  const fieldsContent = (
    <>
      {isSearchError && <p className="text-red-error body-s">{formLabels?.productFetchError}</p>}
      {!isSearchError && (
        <>
          {showLoader && <LoadingIndicator className="m-auto" />}
          {!showLoader && (
            <>
              {prependElement}
              <ProductFormFields
                productForm={mappedForm}
                formLabels={formLabels}
                formType={formType}
                peaceOfMindTermsModalContent={peaceOfMindTermsModalContent}
                afterHeadlineElement={afterHeadlineElement}
                hideHeadline={hideHeadline}
              />
            </>
          )}
        </>
      )}
    </>
  );

  // If noWrapper, render fields directly without any wrapper (for ProductAllForm visual integration)
  if (noWrapper) {
    return <>{fieldsContent}</>;
  }

  // Default: render with section and styled form wrapper
  return (
    <section id="product-form" className="space-y-8 sm:space-y-10">
      <form className="w-full flex flex-wrap p-6 bg-transparent rounded-lg border border-gray-500 text-black-100 space-y-4">
        {fieldsContent}
      </form>
    </section>
  );
};

export default ProductFormContent;
