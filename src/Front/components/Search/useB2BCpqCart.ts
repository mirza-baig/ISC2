import { useMemo } from 'react';
import { format, parse } from 'date-fns';

import { useCart } from 'providers/index';
import { getCartAttributes } from 'utils/cart';

/**
 * Is the active cart a CPQ (quoted) cart — and what does the quote say?
 *
 * **CTX-5:** a B2B shopper who already has a CPQ cart gets a READ-ONLY cart *everywhere*. The quote
 * was negotiated in Salesforce/CPQ, so the storefront must never modify it: no adds, no quantity
 * changes, no removals, and no re-pricing into another currency. The cart page has always enforced
 * this — `Cart/CartLineItem` hides the trash icon and renders the quantity as static text,
 * `useUpdateLineItemQuantity` refuses to write, `useRecalculateCart` no-ops — and this hook is how
 * the B2B PLP applies the SAME rule to its rows and its on-page cart.
 *
 * `computed.isB2B` (`cartType === 'CPQ'`, see `utils/cart.ts`) is deliberately the same signal the
 * cart page and checkout read, so the two surfaces can never take different views of one cart.
 *
 * B2B-only and read-only: nothing outside `components/Search` consumes this, and it touches no
 * shared state — it just reads the cart every surface already reads.
 */

export interface B2BQuoteAttributes {
  /** CPQ sales/quote number (`tempOrderNumber` on the cart). */
  salesNumber?: string;
  /** Salesforce invoice number, when the quote has been invoiced. */
  invoiceNumber?: string;
  /** Quote expiry, already formatted for display ("August 30, 2026") — the cart page's format. */
  validUntil?: string;
}

export interface B2BCpqCart {
  /** The active cart is a CPQ quote → every write path on the PLP must be blocked. */
  isCpq: boolean;
  /** Quote metadata for display. Empty object unless `isCpq`. */
  quote: B2BQuoteAttributes;
}

export const useB2BCpqCart = (): B2BCpqCart => {
  const { activeCart } = useCart();
  const isCpq = Boolean(activeCart?.computed?.isB2B);

  const quote = useMemo<B2BQuoteAttributes>(() => {
    if (!isCpq || !activeCart) {
      return {};
    }

    const { tempOrderNumber, SFInvoiceNumber, quoteExpiryDate } = getCartAttributes(activeCart);

    // Same parse/format pair the cart page uses (ShoppingCart's `cartAttributes`): the raw value is
    // a plain `yyyy-MM-dd` string, so it is parsed as a LOCAL date rather than handed to `new Date()`
    // (which would read it as UTC midnight and can show the previous day west of Greenwich).
    return {
      salesNumber: tempOrderNumber,
      invoiceNumber: SFInvoiceNumber,
      validUntil: quoteExpiryDate
        ? format(parse(quoteExpiryDate, 'yyyy-MM-dd', new Date()), 'MMMM dd, yyyy')
        : undefined,
    };
  }, [isCpq, activeCart]);

  return { isCpq, quote };
};

export default useB2BCpqCart;
