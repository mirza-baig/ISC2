import { LearningJourneyElement } from 'types/index';
import MyAccountSectionCard, { MyAccountSectionCardFields } from '../MyAccountSectionCard';
import { LeaningJourneyLabels } from './LearningJourney';
import { useCallback, useMemo } from 'react';
import { useLineItems } from 'providers/index';
import { useFeatureFlag } from 'providers/featureFlags';
import { formatDate } from 'utils/index';
import { EXAM_VALUE } from './LearningJourneyFilters';
import useGetAlgoliaSitecoreData from 'hooks/useGetAlgoliaSitecoreData';
import { useValidateEnrollmentAccess } from 'hooks/index';

interface LeaningJourneyProps {
  fields: {
    elements: LearningJourneyElement[];
    labels: LeaningJourneyLabels;
  };
}

const LearningJourneyContent = ({ fields }: LeaningJourneyProps) => {
  const { elements, labels } = fields;
  const { algoliaIndex } = useLineItems();

  const productKeysList = elements.map((element) => element.productInfo.key);
  const { algoliaBulkData, algoliaDataIsLoading } = useGetAlgoliaSitecoreData({
    productKeysList,
    algoliaIndex,
  });

  const { enrollmentValidations } = useValidateEnrollmentAccess({
    products: elements,
  });

  const specialAccommodationsEnabled = useFeatureFlag('Special_Accommodations');

  const getLabelsForProduct = useCallback(
    (learningJourneyElement: LearningJourneyElement) => {
      const productLabels = [];
      const { productInfo, productType, specialAccommodations } = learningJourneyElement;

      if (productInfo.description) {
        productLabels.push({ content: productInfo.description });
      }

      if (productInfo.allocatedBy) {
        productLabels.push({
          title: labels.assignedBy,
          content: productInfo.allocatedBy,
        });
      }

      if (productType === EXAM_VALUE) {
        if (productInfo.dateTime) {
          productLabels.push({
            title: labels.date,
            content: formatDate({ value: productInfo.dateTime }),
          });
        }

        if (productInfo.endDate) {
          productLabels.push({
            title: labels.expirationDateLabel,
            content: formatDate({ value: productInfo.endDate }),
          });
        }

        if (specialAccommodationsEnabled) {
          const activeSAs = (specialAccommodations ?? []).filter(
            (sa) => sa.status.toLowerCase() === 'active'
          );

          activeSAs.forEach((sa) => {
            productLabels.push({
              title: labels.specialAccommodationsTitle,
              content: sa.expirationDate
                ? `${sa.name} - ${labels.saExpirationDateLabel}: ${formatDate({
                    value: sa.expirationDate,
                  })}`
                : sa.name,
            });
          });
        }
      } else if (productInfo.startDate && productInfo.endDate) {
        productLabels.push({
          title: labels?.accessPeriod,
          content: `${formatDate({ value: productInfo.startDate })} - ${formatDate({
            value: productInfo.endDate,
          })}`,
        });
      } else if (productInfo.startDate) {
        productLabels.push({
          title: labels.date,
          content: formatDate({ value: productInfo.startDate }),
        });
      }

      return productLabels;
    },
    [labels, specialAccommodationsEnabled]
  );

  const getCtaForProduct = useCallback(
    (
      productStatus: LearningJourneyElement['productStatus'],
      productType: string,
      elementIndex: number,
      error: LearningJourneyElement['error'],
      specialAccommodations: LearningJourneyElement['specialAccommodations']
    ) => {
      if (!productStatus) {
        return null;
      }

      if (productStatus.type === 'button') {
        if (error?.code || error?.message) {
          return {
            type: 'button',
            label: productStatus.label,
            href: productStatus.href,
            disabled: true,
            tooltip: error.message,
            supportingText: error.message,
          };
        }

        if (
          specialAccommodationsEnabled &&
          productType === EXAM_VALUE &&
          specialAccommodations?.length
        ) {
          const requiresCallToSchedule = specialAccommodations.some(
            (sa) => sa.status.toLowerCase() === 'active' && !sa.unrestrictedWhenPreApproved
          );

          if (requiresCallToSchedule) {
            return {
              type: 'button',
              label: labels.callToScheduleLabel,
              disabled: true,
              supportingText: labels.callToScheduleSupportingText,
              supportingLinkHref: labels.callToScheduleLinkUrl,
              supportingLinkLabel: labels.callToScheduleLinkText,
              supportingLinkPostText: labels.callToScheduleLinkPostText,
            };
          }
        }

        const shouldApplyEnrollmentValidation = productType !== EXAM_VALUE;
        const validation = shouldApplyEnrollmentValidation
          ? enrollmentValidations[elementIndex]
          : null;

        if (validation && validation.isBeforeEnrollment && validation.formattedDate) {
          const availableText = labels.availableLabel || 'Available';
          return {
            type: 'button',
            label: `${availableText} ${validation.formattedDate}`,
            href: productStatus.href,
            disabled: true,
          };
        }

        return {
          type: 'button',
          label: productStatus.label,
          href: productStatus.href,
          disabled: false,
        };
      }

      const status = productStatus?.status.toLowerCase();
      const label = productStatus?.label.toLowerCase();

      const grayLabels = [
        'expired',
        'ineligible',
        'blocked',
        'no show',
        'refused',
        'enrolled',
        'client revoked',
      ];
      const grayStatuses = ['no show', 'refused', 'enrolled', 'client revoked'];

      const pillType =
        status === 'failed'
          ? 'warning-pill'
          : (status === 'action-required' && grayLabels.includes(label ?? '')) ||
            grayStatuses.includes(status ?? '')
          ? 'gray-pill'
          : 'success-pill';

      if (error?.code) {
        return {
          type: 'gray-pill',
          label: productStatus?.label,
          disabled: true,
          tooltip: error?.message || undefined,
          supportingText: error?.message || undefined,
        };
      }

      return {
        type: pillType,
        label: productStatus?.label,
        tooltip: error?.message,
        supportingText: error?.message,
      };
    },
    [enrollmentValidations, labels, specialAccommodationsEnabled]
  );

  const cardsContent = useMemo(
    () =>
      elements.map((learningJourneyElement, index) => {
        const { productInfo, productStatus, productType, error, specialAccommodations } =
          learningJourneyElement;
        const productImage = algoliaBulkData?.find(
          (product) => product.objectID === productInfo.key
        );

        return {
          name: productInfo.name,
          labels: getLabelsForProduct(learningJourneyElement),
          cta: getCtaForProduct(productStatus, productType, index, error, specialAccommodations),
          image: {
            src: productImage?.thumbnailImage,
            alt: productInfo.name,
          },
        } as MyAccountSectionCardFields;
      }),
    [algoliaBulkData, elements, getCtaForProduct, getLabelsForProduct]
  );

  return (
    <>
      {cardsContent.map((card, index) => (
        <MyAccountSectionCard
          key={`${card.name}-${index}`}
          fields={{ ...card, imagesAreLoading: algoliaDataIsLoading }}
        />
      ))}
    </>
  );
};

export default LearningJourneyContent;
