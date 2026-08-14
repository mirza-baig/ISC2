import { useEffect, useState } from 'react';

import B2BProductLineHit, { B2BProductHit } from './SearchHits/B2BProductLineHit';
import { useB2BPrivateClass } from './B2BPrivateClassContext';
import { useB2BPrivateClassDraft } from './useB2BPrivateClassDraft';
import {
  DEMO_SKU,
  DEMO_TITLE,
  DEMO_META,
  DEMO_MORE_INFO,
  DEMO_UNIT_PRICE,
  DEMO_ORIGINAL_PRICE,
  useB2BDemoCart,
  b2bDemoCartActions,
} from './b2bDemoCart';

/**
 * TEMPORARY DEMO ROW — remove before release.
 *
 * Injects a fake private/classroom product at the top of the B2B PLP so the private-class
 * questions (PC-3) can be previewed without real classroom/in-person products in the index
 * (DATA-1). "Add to Cart" pushes it into a client-side demo cart (b2bDemoCart) so the on-page
 * mini-cart opens and shows the same private-class fields — no commercetools involved. The
 * scheduling answers use the real private-class context, so the row and cart line stay in sync.
 *
 * To remove: delete this file + b2bDemoCart.ts and their usages in SearchResults, B2BPlpCart,
 * and SearchWrapper.
 */

const currency = (n: number): string => `$${n.toLocaleString('en-US')}`;

const DEMO_HIT = {
  objectID: DEMO_SKU,
  sku: DEMO_SKU,
  productType: 'training-classroom',
  title: DEMO_TITLE,
  description: DEMO_META,
  moreInfo: DEMO_MORE_INFO,
} as unknown as B2BProductHit;

const B2BDemoPrivateClassRow = (): JSX.Element => {
  const { getAnswers, setAnswers, clearAnswers, openLocationModal } = useB2BPrivateClass();
  const demo = useB2BDemoCart();
  // Local qty draft (re-syncs from the demo store after a commit/remove), like a real row.
  const [qty, setQty] = useState(demo.quantity);
  useEffect(() => {
    setQty(demo.quantity);
  }, [demo.quantity]);

  const committed = getAnswers(DEMO_SKU);
  const { draft, setDraft, areAnswersDirty, openAddressModal } = useB2BPrivateClassDraft(
    committed,
    openLocationModal
  );

  const isDirty = areAnswersDirty || qty !== demo.quantity;

  return (
    <div>
      <B2BProductLineHit
        hit={DEMO_HIT}
        categoryLabel="Training"
        metaLine={DEMO_META}
        quantityLabel="Attendees"
        displayPrice={currency(DEMO_UNIT_PRICE)}
        displayOriginalPrice={currency(DEMO_ORIGINAL_PRICE)}
        displayTotal={currency(DEMO_UNIT_PRICE * qty)}
        isInCart={demo.inCart}
        isDirty={isDirty}
        isPrivate
        quantity={qty}
        requestedStartDate={draft.requestedStartDate}
        locationMode={draft.locationMode}
        eventAddress={draft.eventAddress}
        onQuantityChange={setQty}
        onStartDateChange={(value) => setDraft((d) => ({ ...d, requestedStartDate: value }))}
        onLocationModeChange={(mode) => {
          setDraft((d) => ({ ...d, locationMode: mode }));
          if (mode === 'at-location' && !draft.eventAddress) {
            openAddressModal();
          }
        }}
        onEditLocation={openAddressModal}
        onAddToCart={() => {
          b2bDemoCartActions.add(qty);
          setAnswers(DEMO_SKU, draft);
        }}
        onUpdateQuantity={() => {
          b2bDemoCartActions.setQuantity(qty);
          setAnswers(DEMO_SKU, draft);
        }}
        onRemove={() => {
          b2bDemoCartActions.remove();
          clearAnswers(DEMO_SKU);
        }}
        addToCartLabel="Add to Cart"
        updateQuantityLabel="Update"
        removeFromCartLabel="Remove from Cart"
        showDetailsLabel="Show Details"
        hideDetailsLabel="Hide Details"
        priceLabel="Price:"
        originallyLabel="Originally:"
        totalLabel="Total:"
      />
    </div>
  );
};

export default B2BDemoPrivateClassRow;
