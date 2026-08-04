import { LinkField } from '@sitecore-jss/sitecore-jss-nextjs';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useCallback, useMemo } from 'react';
import clsx from 'clsx';

import { GenericModal } from 'ui/index';
import { areStringsEqual } from 'utils/index';
import { useLoggedUser } from 'hooks/index';
import { CART_ID_PARAM_NAME } from 'constants/index';
import { useModal, useCart, useCartFields } from 'providers/index';

import { ClearNotAvailableProductsModal } from './ClearNotAvailableProductsModal';
import AssignB2BCartModal from '../AssignB2BCartModal';

type CartButtonsProps = {
  primaryCta: LinkField;
  secondaryCta: {
    text: string;
    onClick: (e: React.MouseEvent<HTMLElement>) => void;
  };
};

export const CartButtons = ({ primaryCta, secondaryCta }: CartButtonsProps) => {
  const router = useRouter();

  const { activeCart } = useCart();
  const { fields, labels } = useCartFields();
  const { setModalContent } = useModal();
  const { user, isUserNotLoggedIn } = useLoggedUser();

  const checkoutUrl = useMemo(() => {
    const checkoutBaseUrl = primaryCta.value.href;

    if (checkoutBaseUrl) {
      const raw = Object.entries(router.query).find(
        ([k]) => k.toLowerCase() === CART_ID_PARAM_NAME.toLowerCase()
      )?.[1];
      const cartIdParam = Array.isArray(raw) ? raw[0] : raw;

      if (cartIdParam) {
        return `${checkoutBaseUrl}?${CART_ID_PARAM_NAME}=${cartIdParam}`;
      }

      return checkoutBaseUrl;
    }

    return '';
  }, [primaryCta.value.href, router.query]);

  const goToCheckoutPage = useCallback(() => {
    if (checkoutUrl) {
      router.push(checkoutUrl);
    }
  }, [checkoutUrl, router]);

  const onPrimaryCtaClicked = useCallback(() => {
    if (activeCart.computed.isCheckoutDisabled || !checkoutUrl) {
      return;
    }

    if (activeCart.computed.hasNotAvailableProducts) {
      return setModalContent(
        <ClearNotAvailableProductsModal
          onSuccess={goToCheckoutPage}
          fields={{
            heading: labels.clearNotAvailableProductsModalHeading,
            description: labels.clearNotAvailableProductsModalDescription,
            primaryCTALabel: labels.clearNotAvailableProductsModalPrimaryCTALabel,
          }}
        />
      );
    }

    if (isUserNotLoggedIn) {
      return signIn('salesforce', { callbackUrl: checkoutUrl });
    }

    // Show 'Cart is already assigned to other customer' modal
    if (
      activeCart.computed.isB2B &&
      activeCart.customerEmail &&
      user?.email &&
      !areStringsEqual(activeCart.customerEmail, user.email)
    ) {
      return setModalContent(
        <GenericModal
          heading={fields.cartStatusUnavailablePopupNotice.fields.heading.value}
          description={fields.cartStatusUnavailablePopupNotice.fields.description.value}
          primaryCtaLabel={fields.cartStatusUnavailablePopupNotice.fields.primaryCtaLabel.value}
          secondaryCtaLabel={fields.cartStatusUnavailablePopupNotice.fields.secondaryCtaLabel.value}
        />
      );
    }

    // Show 'Cart will be assigned to you' modal
    if (activeCart.computed.isB2B && !activeCart.customerEmail) {
      return setModalContent(
        <AssignB2BCartModal
          {...fields.cartStatusAvailablePopupNotice.fields}
          cartID={activeCart.id!}
          onSuccess={goToCheckoutPage}
        />
      );
    }

    goToCheckoutPage();
  }, [
    activeCart,
    checkoutUrl,
    isUserNotLoggedIn,
    user,
    goToCheckoutPage,
    setModalContent,
    fields,
    labels,
  ]);

  return (
    <div className="flex flex-col items-center gap-4 md:gap-2 mt-4 md:mt-8">
      <button
        disabled={activeCart.computed.isCheckoutDisabled}
        onClick={onPrimaryCtaClicked}
        className={clsx('primary-cta tracking-link flex justify-center w-full', {
          'opacity-50 pointer-events-none cursor-default': activeCart.computed.isCheckoutDisabled,
        })}
        aria-label={primaryCta.value.text}
      >
        {primaryCta.value.text}
      </button>
      {!activeCart.computed.isB2B && (
        <a
          role="button"
          tabIndex={0}
          onClick={secondaryCta.onClick}
          className="secondary-cta tracking-link with-chevron-left flex justify-center w-full"
        >
          {secondaryCta.text}
        </a>
      )}
    </div>
  );
};
