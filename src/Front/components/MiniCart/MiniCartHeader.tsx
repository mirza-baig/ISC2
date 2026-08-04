import clsx from 'clsx';
import { useCallback } from 'react';

import { CloseIcon } from 'icons/index';
import { useLineItems, useLayout, useMiniCartFields, useCart } from 'providers/index';

export default function MiniCartHeader() {
  const { labels } = useMiniCartFields();
  const { isRemovingFromCart } = useLineItems();
  const { closeMiniCart } = useLayout();

  const { activeCart } = useCart();

  const onCloseCartClick = useCallback(() => {
    if (isRemovingFromCart) {
      return;
    }

    closeMiniCart();
  }, [closeMiniCart, isRemovingFromCart]);

  return (
    <header
      className={clsx(
        'py-8 pl-4 pr-3 sm:px-4 w-full flex items-center justify-between bg-white',
        activeCart?.computed.isEmpty && '!bg-gray-10'
      )}
    >
      <h4 className="headline-s">{labels.cartTitle}</h4>

      <button
        type="button"
        title="Close"
        disabled={isRemovingFromCart}
        onClick={onCloseCartClick}
        className="outline-isc2-green disabled:opacity-30"
        aria-label="Close"
      >
        <CloseIcon size={24} />
      </button>
    </header>
  );
}
