import type { ComponentRendering } from '@sitecore-jss/sitecore-jss-nextjs';
import { useRouter } from 'next/router';

import { useCart } from 'providers/index';
import { useB2BCartAccess } from 'hooks/index';
import { parseFieldsFromURLString } from 'utils/index';

import CartCoupon from '../Cart/CartCoupon';
import type { SectionHeadingAndLabels } from '../Cart/OrderSummary';

import {
  readB2BCartOrderSummaryFields,
  type B2BCartSecondaryCtaFields,
} from './b2bCartOrderSummaryFields';

const CTA_CLASS_NAME = 'secondary-cta tracking-link with-chevron-left flex w-full justify-center';

export interface B2BCartSummaryActionsProps {
  rendering?: ComponentRendering;
  part: 'coupon' | 'cta';
}

const B2BCartSummaryActions = ({
  rendering,
  part,
}: B2BCartSummaryActionsProps): JSX.Element | null => {
  const router = useRouter();
  const { activeCart } = useCart();
  const { isAuthorizedBuyer, isResolvingAccess } = useB2BCartAccess();

  const fields = readB2BCartOrderSummaryFields(rendering);
  const couponTitleAndLabels = fields?.couponTitleAndLabels;
  const labels = fields?.sectionHeadingAndLabels
    ? parseFieldsFromURLString<SectionHeadingAndLabels & B2BCartSecondaryCtaFields>(
        fields.sectionHeadingAndLabels
      )
    : undefined;

  const cartOnly = Boolean(fields?.enableCartOnlyFeatures?.value && !activeCart.computed.isB2B);
  const showCoupon = part === 'coupon' && cartOnly && Boolean(couponTitleAndLabels);

  const backLabel = labels?.secondaryCtaLabel?.trim();
  const backHref = labels?.secondaryCtaLink?.trim();
  const buyerHref = labels?.authorizedBuyerSecondaryCtaLink?.trim();
  const buyerLabel = labels?.authorizedBuyerSecondaryCtaLabel?.trim() || backLabel;

  const showBuyerCta = Boolean(
    part === 'cta' && cartOnly && isAuthorizedBuyer && !isResolvingAccess && buyerHref && buyerLabel
  );
  const showStandardCta = Boolean(part === 'cta' && cartOnly && !showBuyerCta && backLabel);

  if (part === 'coupon') {
    return showCoupon && couponTitleAndLabels ? (
      <CartCoupon couponTitleAndLabels={couponTitleAndLabels} />
    ) : null;
  }

  if (!showBuyerCta && !showStandardCta) {
    return null;
  }

  return (
    <>
      {showBuyerCta && (
        <a href={buyerHref} className={CTA_CLASS_NAME}>
          {buyerLabel}
        </a>
      )}

      {showStandardCta &&
        (backHref ? (
          <a href={backHref} className={CTA_CLASS_NAME}>
            {backLabel}
          </a>
        ) : (
          <a
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.preventDefault();
              router.back();
            }}
            className={CTA_CLASS_NAME}
          >
            {backLabel}
          </a>
        ))}
    </>
  );
};

export default B2BCartSummaryActions;
