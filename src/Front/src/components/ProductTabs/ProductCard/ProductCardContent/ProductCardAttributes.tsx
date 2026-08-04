import { TextField } from '@sitecore-jss/sitecore-jss-nextjs';
import clsx from 'clsx';

import { Tooltip } from 'ui/index';
import { QuestionIcon } from 'icons/index';
import { useBreakpoint } from 'hooks/index';
import { TooltipPosition } from 'types/index';

export namespace ProductCardAttributes {
  export type Props = {
    productTitle1: TextField;
    productValue1: TextField;
    productAttribute1ToolTipText: TextField;
    productTitle2: TextField;
    productValue2: TextField;
    productAttribute2ToolTipText: TextField;
    productTitle3: TextField;
    productValue3: TextField;
    productAttribute3ToolTipText: TextField;
  };
}

export const ProductCardAttributes = ({
  productTitle1,
  productValue1,
  productAttribute1ToolTipText,
  productTitle2,
  productValue2,
  productAttribute2ToolTipText,
  productTitle3,
  productValue3,
  productAttribute3ToolTipText,
}: ProductCardAttributes.Props) => {
  const breakpoint = useBreakpoint();

  const tooltipPosition = breakpoint === 'lg' || breakpoint === 'xl' ? 'top' : 'left';

  const showAttribute1 = Boolean(productTitle1?.value || productValue1?.value);
  const showAttribute2 = Boolean(productTitle2?.value || productValue2?.value);
  const showAttribute3 = Boolean(productTitle3?.value || productValue3?.value);

  if (!showAttribute1 && !showAttribute2 && !showAttribute3) {
    return null;
  }

  return (
    <section className="mt-6">
      {showAttribute1 && (
        <ProductCardAttribute
          title={productTitle1?.value}
          value={productValue1?.value}
          tooltip={productAttribute1ToolTipText?.value}
          tooltipPosition={tooltipPosition}
        />
      )}
      {showAttribute2 && (
        <ProductCardAttribute
          title={productTitle2?.value}
          value={productValue2?.value}
          tooltip={productAttribute2ToolTipText?.value}
          tooltipPosition={tooltipPosition}
        />
      )}
      {showAttribute3 && (
        <ProductCardAttribute
          title={productTitle3?.value}
          value={productValue3?.value}
          tooltip={productAttribute3ToolTipText?.value}
          tooltipPosition={tooltipPosition}
        />
      )}
    </section>
  );
};

export namespace ProductCardAttribute {
  export type Props = {
    title?: string | number;
    value?: string | number;
    tooltip?: string | number;
    tooltipPosition: TooltipPosition;
  };
}

export const ProductCardAttribute = ({
  title,
  value,
  tooltip,
  tooltipPosition,
}: ProductCardAttribute.Props) => (
  <div className="flex items-center border-t border-gray-30 py-2.5">
    <label className="eyebrow tracking-wide">{title}</label>
    <label className={clsx('body-s grow text-right', tooltip && 'mr-2')}>{value}</label>
    {tooltip && (
      <Tooltip
        Component={<QuestionIcon size={20} />}
        content={tooltip!}
        position={tooltipPosition}
        className="w-52 text-center"
      />
    )}
  </div>
);
