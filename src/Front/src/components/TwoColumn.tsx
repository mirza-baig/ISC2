import React, { useMemo } from 'react';
import {
  ComponentParams,
  ComponentRendering,
  Placeholder,
} from '@sitecore-jss/sitecore-jss-nextjs';

import { useLayout } from 'providers/index';
import { parseFieldsFromURLString, replaceValues } from 'utils/index';
import { PromoPill, BaseCard } from 'ui/index';
import { PromoPills } from 'types/index';

interface ComponentProps {
  rendering: ComponentRendering & { params: ComponentParams };
  params: ComponentParams;
}

export const TwoColumn = (props: ComponentProps): JSX.Element => {
  const { layoutFields } = useLayout();

  const { discountPillComplement, discountPillNumber, regularPill } =
    parseFieldsFromURLString<PromoPills>(layoutFields?.promoPills);

  const promoCardFields = useMemo(() => {
    const isPromoConfigured = discountPillComplement && discountPillNumber;

    if (layoutFields?.promoCard && isPromoConfigured) {
      const { description, heading } = layoutFields.promoCard.fields;

      const replaceTerms = [
        { replace: '{discountPillPercentage}', with: discountPillNumber || '' },
        { replace: '{productType}', with: layoutFields.formType?.displayName || '' },
      ];

      return {
        description: {
          value: replaceValues(description.value, replaceTerms),
        },
        heading: {
          value: replaceValues(heading.value, replaceTerms),
        },
      };
    }

    return undefined;
  }, [
    discountPillComplement,
    discountPillNumber,
    layoutFields?.formType?.displayName,
    layoutFields?.promoCard,
  ]);

  return (
    <div className="two-columns flex flex-col lg:flex-row px-5 sm:px-16 lg:px-29 md:gap-x-10 lg:gap-x-12 w-full">
      <div className="flex-1 lg:px-5 overflow-hidden space-y-6">
        <div className="flex gap-2">
          <PromoPill field={{ value: regularPill }} className="border border-gray-50" />

          {discountPillNumber && discountPillComplement && (
            <PromoPill
              className="border border-discount"
              field={{
                value: `${discountPillNumber} ${discountPillComplement}`,
              }}
            />
          )}
        </div>

        <Placeholder name="product-detail-left-column" rendering={props.rendering} />
      </div>

      <div className="w-full lg:w-400 xl:w-520 space-y-5 pb-10 lg:pb-30">
        {promoCardFields && (
          <div className="bg-dark-blue rounded-lg shadow-card w-full px-6 py-4 ">
            <BaseCard fields={promoCardFields} textClassName="!text-white" />
          </div>
        )}

        <Placeholder name="product-detail-right-column" rendering={props.rendering} />
      </div>
    </div>
  );
};

export default TwoColumn;
