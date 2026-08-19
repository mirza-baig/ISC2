import type { ComponentRendering, Field, LinkField } from '@sitecore-jss/sitecore-jss-nextjs';

export type B2BCartOrderSummaryFields = {
  couponTitleAndLabels?: Field<string>;
  sectionHeadingAndLabels?: Field<string>;
  primaryCta?: LinkField;
  enableCartOnlyFeatures?: Field<boolean>;
};

export type B2BCartSecondaryCtaFields = {
  secondaryCtaLink?: string;
  authorizedBuyerSecondaryCtaLabel?: string;
  authorizedBuyerSecondaryCtaLink?: string;
};

const CART_RIGHT_COLUMN = 'cart-content-right-column';

const MAX_DEPTH = 3;

const isComponentRendering = (entry: unknown): entry is ComponentRendering =>
  typeof entry === 'object' && entry !== null && 'componentName' in entry;

const childRenderings = (rendering: ComponentRendering): ComponentRendering[] => {
  return Object.entries(rendering.placeholders ?? {})
    .sort(([a], [b]) => Number(b === CART_RIGHT_COLUMN) - Number(a === CART_RIGHT_COLUMN))
    .flatMap(([, entries]) => entries ?? [])
    .filter(isComponentRendering);
};

const findOrderSummary = (
  rendering: ComponentRendering,
  depth = 0
): ComponentRendering | undefined => {
  const children = childRenderings(rendering);

  const match = children.find(
    (child) => (child.fields as B2BCartOrderSummaryFields | undefined)?.couponTitleAndLabels
  );

  if (match || depth >= MAX_DEPTH) {
    return match;
  }

  return children.reduce<ComponentRendering | undefined>(
    (found, child) => found ?? findOrderSummary(child, depth + 1),
    undefined
  );
};

export const readB2BCartOrderSummaryFields = (
  rendering?: ComponentRendering
): B2BCartOrderSummaryFields | undefined => {
  if (!rendering) {
    return undefined;
  }

  return findOrderSummary(rendering)?.fields as B2BCartOrderSummaryFields | undefined;
};
