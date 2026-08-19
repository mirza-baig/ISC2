import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { signIn } from 'next-auth/react';

import { useCart, useCartFields, useModal } from 'providers/index';
import { useLoggedUser } from 'hooks/index';
import { areStringsEqual } from 'utils/index';
import { GenericModal } from 'ui/index';
import { CART_ID_PARAM_NAME } from 'constants/index';

import { useB2BCartLabels } from '../Search/B2BPrivateClassContext';
import AssignB2BCartModal from '../Cart/AssignB2BCartModal';
import { ClearNotAvailableProductsModal } from '../Cart/OrderSummary/ClearNotAvailableProductsModal';

const CHECKOUT_HREF = '/checkout';

export default function useB2BCartCheckout(isCpq: boolean) {
  const { activeCart } = useCart();
  const { isUserNotLoggedIn, user } = useLoggedUser();
  const { setModalContent } = useModal();
  const router = useRouter();
  const cartLabels = useB2BCartLabels();
  const { labels: authoredCartLabels } = useCartFields();

  const checkoutUrl = useMemo(() => {
    const raw = Object.entries(router.query).find(
      ([key]) => key.toLowerCase() === CART_ID_PARAM_NAME.toLowerCase()
    )?.[1];
    const cartIdParam = Array.isArray(raw) ? raw[0] : raw;
    return cartIdParam ? `${CHECKOUT_HREF}?${CART_ID_PARAM_NAME}=${cartIdParam}` : CHECKOUT_HREF;
  }, [router.query]);

  const goToCheckout = useCallback(() => {
    router.push(checkoutUrl);
  }, [checkoutUrl, router]);

  const checkout = useCallback(() => {
    if (activeCart?.computed?.isCheckoutDisabled) {
      return;
    }

    if (activeCart?.computed?.hasNotAvailableProducts) {
      setModalContent(
        <ClearNotAvailableProductsModal
          onSuccess={goToCheckout}
          fields={{
            heading:
              authoredCartLabels?.clearNotAvailableProductsModalHeading ||
              cartLabels.clearUnavailableHeading,
            description:
              authoredCartLabels?.clearNotAvailableProductsModalDescription ||
              cartLabels.clearUnavailableDescription,
            primaryCTALabel:
              authoredCartLabels?.clearNotAvailableProductsModalPrimaryCTALabel ||
              cartLabels.clearUnavailableConfirm,
          }}
        />
      );
      return;
    }

    if (isUserNotLoggedIn) {
      signIn('salesforce', { callbackUrl: checkoutUrl });
      return;
    }

    if (isCpq) {
      if (
        activeCart?.customerEmail &&
        user?.email &&
        !areStringsEqual(activeCart.customerEmail, user.email)
      ) {
        setModalContent(
          <GenericModal
            heading={cartLabels.cpqUnavailableHeading}
            description={cartLabels.cpqUnavailableDescription}
            primaryCtaLabel={cartLabels.cpqUnavailableConfirm}
          />
        );
        return;
      }

      if (!activeCart?.customerEmail && activeCart?.id) {
        setModalContent(
          <AssignB2BCartModal
            heading={{ value: cartLabels.cpqAssignHeading }}
            description={{ value: cartLabels.cpqAssignDescription }}
            primaryCtaLabel={{ value: cartLabels.cpqAssignConfirm }}
            secondaryCtaLabel={{ value: cartLabels.cpqAssignCancel }}
            cartID={activeCart.id}
            onSuccess={goToCheckout}
          />
        );
        return;
      }
    }

    goToCheckout();
  }, [
    activeCart,
    authoredCartLabels,
    cartLabels,
    checkoutUrl,
    goToCheckout,
    isCpq,
    isUserNotLoggedIn,
    setModalContent,
    user?.email,
  ]);

  return { checkout, checkoutUrl };
}
