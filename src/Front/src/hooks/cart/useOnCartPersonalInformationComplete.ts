/* eslint-disable @typescript-eslint/no-unused-vars */
import { useMutation } from '@tanstack/react-query';
import isEqual from 'lodash.isequal';

import { useCheckoutProcess } from 'providers/index';
import { getMailingAddress, isTaxAddressDefined } from 'utils/index';
import { PersonalInformation } from 'types/index';

import useUpdateTax from './useUpdateTax';
import useSetCartAddress from './useSetCartAddress';
import useUpdateUserData from '../useUpdateUserData';
import useUpdateB2BPersonalInformation from './useUpdateB2BPersonalInformation';
import { CHECKOUT_STEPS } from 'constants/checkout';
import useRecalculateCart from './useRecalculateCart';
import useIsCpqStyleCheckout from './useIsCpqStyleCheckout';
import useIsBusinessBuyer from './useIsBusinessBuyer';
import useGetPaymentIntent from '../checkout/useGetPaymentIntent';
import useEnsureBusinessCartTax from '../checkout/useEnsureBusinessCartTax';

const getFieldsForUserUpdate = (data?: PersonalInformation) => {
  if (!data) {
    return undefined;
  }

  const { agreeTerms, ...otherFields } = data;

  return {
    ...otherFields,
    mailingAddress: getMailingAddress(data),
  };
};

type MutationPayload = {
  initialData?: PersonalInformation;
  callbacks: {
    onSuccess: (data: PersonalInformation) => void;
  };
};

export default function useOnCartPersonalInformationComplete(payload: MutationPayload) {
  const isCpqStyleCheckout = useIsCpqStyleCheckout();
  const isBusinessBuyer = useIsBusinessBuyer();
  const { setActiveStep, setErrorState, setHasInventoryError } = useCheckoutProcess();

  const { setCartAddressAsync } = useSetCartAddress({ onError: setErrorState });
  const { updateUserAsync } = useUpdateUserData({ onError: setErrorState });
  const { setTaxesAsync } = useUpdateTax();
  const { recalculateCartAsync } = useRecalculateCart();
  const { getPaymentIntentAsync } = useGetPaymentIntent();
  const { ensureTaxedCart } = useEnsureBusinessCartTax();
  const { updateB2BPersonalInformationAsync } = useUpdateB2BPersonalInformation({
    onError: setErrorState,
  });

  const { mutate, isPending, error, isSuccess } = useMutation({
    mutationFn: async (data: PersonalInformation) => {
      const oldUserData = getFieldsForUserUpdate(payload.initialData);
      const newUserData = getFieldsForUserUpdate(data);

      const personalInformationChanged = !isEqual(oldUserData, newUserData);

      if (isCpqStyleCheckout) {
        if (personalInformationChanged) {
          await updateB2BPersonalInformationAsync(newUserData!);
        }

        if (isBusinessBuyer) {
          await ensureTaxedCart(data);
        }

        return;
      }

      if (personalInformationChanged) {
        const { billingAddress, mailingAddress, employer, phoneNumber } = newUserData!;

        if (isBusinessBuyer) {
          // A business buyer's billing address is only entered to match an expense card,
          // and the company name comes from the account — neither is written back to the
          // contact. Only the phone edit is stored, in the contact's Other Phone field.
          if (phoneNumber !== payload.initialData?.phoneNumber) {
            await updateUserAsync({ otherPhone: phoneNumber });
          }
        } else {
          await updateUserAsync({
            employer,
            phoneNumber,
            billingAddress,
            mailingAddress,
          });
        }
      }

      // Always sync cart addresses from the form before tax. A cart may already have a
      // partial shippingAddress (e.g. country only), and skipping the update caused CT_001.
      const updatedAddressCart = await setCartAddressAsync({ personalInformation: data });

      if (!isTaxAddressDefined(updatedAddressCart?.shippingAddress)) {
        console.error(
          '[TAX-UPDATE-DEBUG] Cart shipping address incomplete after setCartAddress; skipping tax update',
          {
            cartId: updatedAddressCart?.id,
            shippingAddress: updatedAddressCart?.shippingAddress,
            timestamp: new Date().toISOString(),
          }
        );

        throw {
          message: 'An error occurred. Please contact support. CT_001',
          path: ['isc2CartTaxUpdate'],
        };
      }

      // Match checkout setup order: recalculate → tax → payment intent.
      // Tax-before-recalculate was wiping taxed totals (seen in DEV HAR: tax response ~2314
      // bytes, post-recalculate cart ~2035 with taxedPrice null), then a new PI was created
      // from the untaxed cart and PLACE_ORDER failed after Stripe succeeded.
      const recalculatedCart = await recalculateCartAsync({
        cartId: updatedAddressCart?.id,
      });

      setHasInventoryError(
        !Boolean(
          recalculatedCart &&
            Object.values(recalculatedCart.inventories).every(
              (entry) => entry.availableQuantity > 0
            )
        )
      );

      const taxedCart = await setTaxesAsync({
        cartId: recalculatedCart?.id || updatedAddressCart?.id,
      });

      const cartForPaymentIntent = taxedCart || recalculatedCart || updatedAddressCart;

      // Address/country changes can invalidate the payment intent created at checkout setup
      // (amount/tax/version). Refresh it from the post-tax cart before the payment step.
      if (cartForPaymentIntent) {
        const paymentIntent = await getPaymentIntentAsync({ cart: cartForPaymentIntent });

        // Re-tax against the new PI so Stripe amount stays aligned with cart tax after an
        // address change (tax may have previously updated a now-stale PI).
        if (paymentIntent?.intentPaymentId) {
          const syncedCart = await setTaxesAsync({
            cartId: cartForPaymentIntent.id,
            paymentIntentId: paymentIntent.intentPaymentId,
          });

          const totalChanged =
            syncedCart &&
            (syncedCart.version !== cartForPaymentIntent.version ||
              syncedCart.totalPrice?.centAmount !== cartForPaymentIntent.totalPrice?.centAmount ||
              syncedCart.taxedPrice?.totalGross?.centAmount !==
                cartForPaymentIntent.taxedPrice?.totalGross?.centAmount);

          if (totalChanged && syncedCart) {
            await getPaymentIntentAsync({ cart: syncedCart });
          }
        }
      }
    },
    onSuccess: (_data, variables: PersonalInformation) => {
      payload.callbacks.onSuccess(variables);

      setActiveStep(CHECKOUT_STEPS.PAYMENT_INFORMATION);
    },
  });

  return {
    onCartPersonalInformationComplete: mutate,
    isSettingInfo: isPending,
    cartPersonalInformationError: error,
    cartPersonalInformationSuccess: isSuccess,
  };
}
