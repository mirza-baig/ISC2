import {
  Field,
  ImageField,
  NextImage,
  useSitecoreContext,
} from '@sitecore-jss/sitecore-jss-nextjs';

import { useAuthorizedBuyer, useLoggedUser } from 'hooks/index';
import BuildingIcon from 'icons/BuildingIcon';
import { useCart, useShopperContext } from 'providers/index';

const DEFAULT_SHOPPING_FOR_LABEL = 'Shopping for:';
const DEFAULT_ORGANIZATION_NAME = 'Business Co. Canada Ltd';
const BANNER_BACKGROUND_COLOR = '#5B6AA8';

interface BuyerContextBannerFields {
  enabled?: Field<boolean>;
  icon?: ImageField;
  shoppingForLabel?: Field<string>;
  fallbackOrganizationName?: Field<string>;
}

interface BuyerContextBannerProps {
  fields?: BuyerContextBannerFields;
}

const resolveOrganizationName = (
  organizationFromSession?: string,
  fallbackFromSitecore?: string,
  allowFallback = false
): string | undefined => {
  if (organizationFromSession) {
    return organizationFromSession;
  }

  if (!allowFallback) {
    return undefined;
  }

  return fallbackFromSitecore || DEFAULT_ORGANIZATION_NAME;
};

const BuyerContextBanner = ({ fields }: BuyerContextBannerProps) => {
  const { sitecoreContext } = useSitecoreContext();
  const { isB2BAdminUser } = useLoggedUser();
  const { isAuthorizedBuyer } = useAuthorizedBuyer();
  const { activeCart } = useCart();
  const { shopperContext } = useShopperContext();

  const isEnabled = fields?.enabled?.value ?? true;
  const isPageEditing = Boolean(sitecoreContext?.pageEditing);
  const isB2BContext = isAuthorizedBuyer || isB2BAdminUser || Boolean(activeCart?.computed?.isB2B);
  // "Myself" (or no org selection) must never show the banner on storefront pages.
  const isShoppingForMyself = shopperContext?.type === 'myself';
  const isShoppingForOrganization =
    shopperContext?.type === 'organization' && Boolean(shopperContext.organization?.name);

  const shouldShowBanner =
    isEnabled &&
    !isShoppingForMyself &&
    (isPageEditing || (isB2BContext && isShoppingForOrganization));

  if (!shouldShowBanner) {
    return null;
  }

  const shoppingForLabel = fields?.shoppingForLabel?.value || DEFAULT_SHOPPING_FOR_LABEL;
  const organizationName = resolveOrganizationName(
    shopperContext?.organization?.name,
    fields?.fallbackOrganizationName?.value,
    isPageEditing
  );
  const hasIcon = Boolean(fields?.icon?.value?.src);

  if (!organizationName) {
    return null;
  }

  return (
    <div
      className="flex w-full items-center justify-center gap-2 px-4 py-2 text-white-00"
      style={{ backgroundColor: BANNER_BACKGROUND_COLOR }}
      role="status"
      aria-live="polite"
    >
      {hasIcon && fields?.icon ? (
        <NextImage field={fields.icon} width={16} height={16} className="h-4 w-4 shrink-0" />
      ) : (
        <BuildingIcon size={16} className="shrink-0 text-white-00" />
      )}
      <p className="body-s m-0 text-center text-white-00">
        <span>{shoppingForLabel}</span>{' '}
        <strong className="font-semibold">{organizationName}</strong>
      </p>
    </div>
  );
};

export default BuyerContextBanner;
