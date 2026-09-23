import { useEffect } from 'react';

import { useRemoveFromCart } from 'hooks/index';
import { useModal } from 'providers/index';
import { CartLineItem } from 'types/index';
import { LoadingIndicator } from 'ui/index';

export namespace ClearNotAvailableProductsModal {
  export type Fields = {
    heading?: string;
    description?: string;
    primaryCTALabel?: string;
  };

  export type Props = {
    fields: Fields;
    onSuccess: () => void;
    cartID: string;
    lineItems: CartLineItem[];
  };
}

export const ClearNotAvailableProductsModal = ({
  fields,
  onSuccess,
  cartID,
  lineItems,
}: ClearNotAvailableProductsModal.Props) => {
  const { closeModal } = useModal();

  const { removeFromCart, isRemovingFromCart, removeFromCartSuccess } = useRemoveFromCart();

  const onModalConfirm = () => {
    if (isRemovingFromCart) {
      return;
    }

    const linesToRemove = (lineItems || []).reduce((accum, lineItem) => {
      if (lineItem.availableQuantity === 0) {
        return [...accum, lineItem];
      }

      return accum;
    }, []);

    if (linesToRemove.length) {
      removeFromCart({ lineItems: linesToRemove, cartId: cartID });
    }
  };

  useEffect(() => {
    if (removeFromCartSuccess) {
      closeModal();
      onSuccess();
    }
  }, [removeFromCartSuccess, closeModal, onSuccess]);

  return (
    <div className="flex justify-center items-center px-5">
      <div className="bg-white-00 rounded-lg py-2 w-full max-w-520">
        <div className="px-12 py-12 text-black-100 text-xsm leading-23 max-w-[90vw] max-h-[90vh] overflow-auto">
          {fields.heading && <h4 className="headline-s font-normal">{fields.heading}</h4>}
          {fields.description && <p className="mt-4 body-m">{fields.description}</p>}
          <div className="flex mt-8 space-x-8 items-center">
            <button
              type="button"
              disabled={isRemovingFromCart}
              onClick={onModalConfirm}
              aria-label={fields.primaryCTALabel}
              className="primary-cta !border-none relative text-xsm leading-20 tracking-link px-8"
            >
              {fields.primaryCTALabel}
              {isRemovingFromCart && (
                <LoadingIndicator className="absolute inset-0 w-full h-full object-contain bg-white !p-0" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
