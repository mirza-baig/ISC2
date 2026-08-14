import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { fetchB2BLabels } from 'providers/b2bLabels';
import { B2BInventoryProvider } from './B2BInventoryContext';
import { EMPTY_CUSTOM_ADDRESS, type AddressCustomFields } from './b2bAddress';
import type { B2BLabelGroups, B2BProductMessageModal } from 'types/b2bLabels';

/**
 * B2B PLP "private class questions" (design: dedicated B2B Product List file).
 *
 * Private / classroom (in-person) training products collect extra scheduling info once they're
 * in the cart — a requested start date, a delivery location (Online / At A Location), an event
 * address, and the number of attendees. Those answers are shown on BOTH the product row and the
 * on-page mini-cart, so they live in shared client state keyed by SKU (this context) and both
 * surfaces read/write the same entry.
 *
 * PERSISTENCE (interim, UI-first): answers are NOT yet written to the commercetools cart — there
 * is no confirmed BFF line-item-custom-field support for start date / location / address. When
 * that lands, this context is where the write would be wired. See docs/B2B-Open-Questions.md
 * (PRIV-1) and the Make prototype's CheckoutPrivateCourses (the old checkout-step equivalent).
 */

// DATA (PRIV-1): the crawler index has no "is private/classroom" flag, so we detect from the
// product's type/title. In-person / classroom / private courses need an event location; online
// and self-paced products do not. Interim until a real product flag exists (see DATA-1).
const PRIVATE_CLASS_PATTERN = /classroom|in[-\s]?person|private/i;

export const isPrivateClass = (...values: (string | undefined)[]): boolean =>
  values.some((value) => value && PRIVATE_CLASS_PATTERN.test(value));

/**
 * The key a row's scheduling answers are stored under.
 *
 * A plain SKU is not enough for a purchase option. A B2B buyer can hold the same class twice for
 * two groups running on different dates, and those two rows share a bundle SKU — so keying on it
 * alone would give both occurrences one shared date and one shared location, which is the opposite
 * of what buying for two groups means. The picked session is what tells them apart, so it is part
 * of the key. Anything with no picked session keys exactly as it did before.
 */
export const buildAnswersKey = (sku: string, pickedSku?: string): string =>
  pickedSku ? `${sku}::${pickedSku}` : sku;

export type LocationMode = '' | 'online' | 'at-location';
export type AddressChoice = '' | 'mailing' | 'billing' | 'other';

// The custom-address shape and its rules live in `b2bAddress.ts`, which defers to checkout's own
// country/state lists, postal-code patterns and required-state rule so an international address can
// be entered here exactly as it can at checkout. Re-exported so existing import sites keep working.
export { EMPTY_CUSTOM_ADDRESS, type AddressCustomFields };

/** The Classroom Location pop-up's full selection — carried so it can re-open pre-filled (#8/#9). */
export interface AddressSelection {
  addressChoice: AddressChoice;
  customAddress: AddressCustomFields;
  /** Formatted address for display + validation. */
  eventAddress: string;
}

export interface PrivateClassAnswers {
  /** ISO date string (yyyy-mm-dd) for the requested class start date. */
  requestedStartDate: string;
  /** Delivery location choice. */
  locationMode: LocationMode;
  /** Formatted event address (when locationMode === 'at-location'). */
  eventAddress: string;
  /** Which address option was chosen in the pop-up (so it re-opens on that selection). */
  addressChoice: AddressChoice;
  /** The "Other Address" fields (so they persist into the re-opened pop-up). */
  customAddress: AddressCustomFields;
}

const EMPTY_ANSWERS: PrivateClassAnswers = {
  requestedStartDate: '',
  locationMode: '',
  eventAddress: '',
  addressChoice: '',
  customAddress: EMPTY_CUSTOM_ADDRESS,
};

const EMPTY_LABEL_GROUPS: B2BLabelGroups = {
  privateClass: {},
  addressModal: {},
  cart: {},
  row: {},
  sort: {},
  region: {},
  toolbar: {},
  currencyModal: {},
};

interface B2BPrivateClassContextValue {
  /** Sitecore-managed label groups (/Data/B2B Product List Labels), fetched once. Empty until
   *  loaded — the label hooks always fall back to code defaults. */
  labelGroups: B2BLabelGroups;
  /** Committed (saved) answers per SKU — the source of truth each surface inits/re-syncs from. */
  getAnswers: (sku: string) => PrivateClassAnswers;
  setAnswers: (sku: string, patch: Partial<PrivateClassAnswers>) => void;
  /** Drop a SKU's committed answers (e.g. when the item is removed from the cart) so the row
   *  resets to its blank state. */
  clearAnswers: (sku: string) => void;
  /** Classroom Location modal — callback-based so the confirmed selection flows to the DRAFT of
   *  whichever surface (row or cart line) opened it, not straight into the committed store. Opens
   *  pre-filled from `initial` so an existing address is shown when editing (#8/#9). */
  locationModalOpen: boolean;
  locationModalInitial: AddressSelection | null;
  openLocationModal: (
    initial: AddressSelection,
    onConfirm: (result: AddressSelection) => void
  ) => void;
  closeLocationModal: () => void;
  confirmLocation: (result: AddressSelection) => void;
}

const B2BPrivateClassContext = createContext<B2BPrivateClassContextValue | null>(null);

export const B2BPrivateClassProvider = ({
  children,
  enabled = true,
}: {
  children: ReactNode;
  /** False when the B2B experience is off (feature flag) or this simply isn't the B2B listing.
   *  The provider still mounts — it wraps the shared results tree, so unmounting it would mean
   *  duplicating that whole subtree at the call site — but it does no work: the label fetch below
   *  is skipped and the nested inventory queue is already inert until a row registers a SKU. */
  enabled?: boolean;
}): JSX.Element => {
  const [answersBySku, setAnswersBySku] = useState<Record<string, PrivateClassAnswers>>({});
  const [labelGroups, setLabelGroups] = useState<B2BLabelGroups>(EMPTY_LABEL_GROUPS);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [locationModalInitial, setLocationModalInitial] = useState<AddressSelection | null>(null);
  const onConfirmRef = useRef<((result: AddressSelection) => void) | null>(null);

  // Load the Sitecore-managed labels once on mount (client-side, like the Algolia settings). Any
  // failure resolves to empty groups, so the label hooks keep rendering their code fallbacks.
  //
  // Skipped entirely when disabled: this provider wraps the results tree on EVERY SearchWrapper
  // page (/search included), and without the guard each of them would make a B2B GraphQL round-trip
  // for labels nothing on the page can render.
  useEffect(() => {
    if (!enabled) {
      return;
    }
    let active = true;
    fetchB2BLabels().then((groups) => {
      if (active) {
        setLabelGroups(groups);
      }
    });
    return () => {
      active = false;
    };
  }, [enabled]);

  const getAnswers = useCallback(
    (sku: string): PrivateClassAnswers => answersBySku[sku] ?? EMPTY_ANSWERS,
    [answersBySku]
  );

  const setAnswers = useCallback((sku: string, patch: Partial<PrivateClassAnswers>) => {
    setAnswersBySku((prev) => ({
      ...prev,
      [sku]: { ...EMPTY_ANSWERS, ...prev[sku], ...patch },
    }));
  }, []);

  const clearAnswers = useCallback((sku: string) => {
    setAnswersBySku((prev) => {
      if (!(sku in prev)) {
        return prev;
      }
      const next = { ...prev };
      delete next[sku];
      return next;
    });
  }, []);

  const openLocationModal = useCallback(
    (initial: AddressSelection, onConfirm: (result: AddressSelection) => void) => {
      onConfirmRef.current = onConfirm;
      setLocationModalInitial(initial);
      setLocationModalOpen(true);
    },
    []
  );
  const closeLocationModal = useCallback(() => {
    onConfirmRef.current = null;
    setLocationModalOpen(false);
  }, []);
  const confirmLocation = useCallback((result: AddressSelection) => {
    onConfirmRef.current?.(result);
    onConfirmRef.current = null;
    setLocationModalOpen(false);
  }, []);

  const value = useMemo(
    () => ({
      labelGroups,
      getAnswers,
      setAnswers,
      clearAnswers,
      locationModalOpen,
      locationModalInitial,
      openLocationModal,
      closeLocationModal,
      confirmLocation,
    }),
    [
      labelGroups,
      getAnswers,
      setAnswers,
      clearAnswers,
      locationModalOpen,
      locationModalInitial,
      openLocationModal,
      closeLocationModal,
      confirmLocation,
    ]
  );

  // The inventory queue is nested here rather than mounted separately in SearchWrapper: it needs
  // exactly this scope (an ancestor of the listing rows) and exactly this lifetime, and the two are
  // always wanted together. Rows that never register a SKU — every non-B2B hit — leave it inert.
  return (
    <B2BPrivateClassContext.Provider value={value}>
      <B2BInventoryProvider>{children}</B2BInventoryProvider>
    </B2BPrivateClassContext.Provider>
  );
};

export const useB2BPrivateClass = (): B2BPrivateClassContextValue => {
  const ctx = useContext(B2BPrivateClassContext);
  if (!ctx) {
    throw new Error('useB2BPrivateClass must be used within a B2BPrivateClassProvider');
  }
  return ctx;
};

/**
 * Reads the fetched Sitecore label groups from context WITHOUT throwing when used outside a
 * provider (the label hooks then just render their code fallbacks). See fetchB2BLabels / the
 * /api/b2bLabels route.
 */
const useLabelGroups = (): B2BLabelGroups =>
  useContext(B2BPrivateClassContext)?.labelGroups ?? EMPTY_LABEL_GROUPS;

/**
 * Private-class + address-modal UI labels, resolved from the Sitecore-managed items under
 * /Data/B2B Product List Labels (groups "Private Class" and "Address Modal"). Each has a safe
 * fallback so nothing renders blank before the items load / if a key is missing. Keys are
 * catalogued in docs/B2B-EnvLocal-Sitecore-Items.md.
 */
export const useB2BPrivateClassLabels = () => {
  const groups = useLabelGroups();
  const pc = groups.privateClass;
  const am = groups.addressModal;
  return {
    requestedStartDate: pc.requestedStartDate || 'Requested Start Date',
    location: pc.location || 'Course Format',
    // Location-type field values
    locationChoose: pc.locationChoose || 'Please Choose',
    locationOnline: pc.locationOnline || 'Online',
    locationAtLocation: pc.locationAtLocation || 'In Person',
    eventLocation: pc.eventLocation || 'Event Location',
    editAddress: pc.editAddress || 'Edit',
    selectAddress: pc.selectAddress || 'Select address',
    noAddress: pc.noAddress || 'No address selected yet.',
    // Address-type choices (Classroom Location modal)
    addressChoose: am.addressChoose || 'Please Choose',
    addressMailing: am.addressMailing || 'My Mailing Address',
    addressBilling: am.addressBilling || 'My Billing Address',
    addressOther: am.addressOther || 'Other Address',
    // Classroom Location modal chrome + Other-Address form fields
    modalTitle: am.modalTitle || 'Classroom Location',
    addressPrompt: am.addressPrompt || 'Please choose an address:',
    addressField1: am.addressField1 || 'Address 1',
    addressField2: am.addressField2 || 'Address 2',
    addressCity: am.addressCity || 'City',
    addressState: am.addressState || 'State',
    addressCountry: am.addressCountry || 'Country/Region',
    addressZip: am.addressZip || 'Zip Code',
    // Placeholder row for the two dropdowns, matching the "Please Choose" pattern already used by
    // the address-type and course-format selects.
    addressSelect: am.addressSelect || 'Please Choose',
    // Shown under Zip when the entered code doesn't match the selected country's postal format —
    // the same failure checkout reports as `incorrect_postal_code`.
    addressZipInvalid: am.addressZipInvalid || 'Please enter a valid postal code for this country.',
    // Stand-in for the mailing/billing address line before the signed-in account's addresses have
    // loaded, or when there is no signed-in user (PRIV-1).
    addressNoneOnFile: am.addressNoneOnFile || 'No address on file for this account.',
    cancel: am.cancel || 'Cancel',
    confirmLocation: am.confirmLocation || 'Confirm Location',
  };
};

/**
 * B2B mini-cart labels, from the Sitecore "Cart" group under /Data/B2B Product List Labels,
 * with code fallbacks.
 */
export const useB2BCartLabels = () => {
  const c = useLabelGroups().cart;
  return {
    title: c.title || 'Cart',
    item: c.item || 'Item',
    items: c.items || 'Items',
    subtotal: c.subtotal || 'Subtotal',
    taxes: c.taxes || 'Taxes*',
    taxesTbd: c.taxesTbd || 'TBD',
    price: c.price || 'Price',
    total: c.total || 'Total',
    checkout: c.checkout || 'Checkout',
    update: c.update || 'Update',
    remove: c.remove || 'Remove',
    quantity: c.quantity || 'Quantity',
    // Just "Attendees" — the row labels already use the short form, and the long one made the
    // cart line's label/controls row wrap on the 290px panel.
    attendees: c.attendees || 'Attendees',
    taxNote: c.taxNote || '*Taxes are Calculated At Checkout',
    openCart: c.openCart || 'Open cart',
    // Shown on a cart line whose scheduled session has already begun (`sessionStarted`), and beside
    // the greyed-out Checkout while such a line is in the panel (`checkoutBlocked` — short, because
    // the line itself already carries the explanation, and it may be scrolled out of view).
    // B2B-only: the shared cart has no past-session check at all, only a stock one.
    sessionStarted: c.sessionStarted || 'This session has already started.',
    checkoutBlocked: c.checkoutBlocked || 'Remove the started session to check out.',
    // CPQ (quoted) cart — CTX-5. The cart page states this with its own `normalCartSubtitle` rich
    // text and shows the quote's numbers above the lines; these are the PLP panel's equivalents.
    // Defaults echo the cart page's wording for the same three fields (`salesNumberLabel`,
    // `SFInvoiceNumberLabel`, `validUntilLabel`) so the two surfaces read the same.
    cpqNotice:
      c.cpqNotice ||
      'This is a quoted cart. Items and quantities are set by your quote and cannot be changed here.',
    cpqSalesNumber: c.cpqSalesNumber || 'Sales number',
    cpqInvoiceNumber: c.cpqInvoiceNumber || 'Invoice Number',
    cpqValidUntil: c.cpqValidUntil || 'Valid until',
    // Checkout-entry modals, mirroring the cart page's `cartStatusAvailablePopupNotice` /
    // `cartStatusUnavailablePopupNotice`. Those live on the Shopping Cart rendering's datasource,
    // which the PLP has no access to (`useCartFields` is empty here), hence this group.
    cpqAssignHeading: c.cpqAssignHeading || 'This cart will be assigned to you',
    cpqAssignDescription:
      c.cpqAssignDescription ||
      'Continuing to checkout assigns this quoted cart to your account. Do you want to continue?',
    cpqAssignConfirm: c.cpqAssignConfirm || 'Continue',
    cpqAssignCancel: c.cpqAssignCancel || 'Cancel',
    cpqUnavailableHeading: c.cpqUnavailableHeading || 'This cart is not available',
    cpqUnavailableDescription:
      c.cpqUnavailableDescription ||
      'This quoted cart is already assigned to another customer, so it cannot be checked out from this account.',
    cpqUnavailableConfirm: c.cpqUnavailableConfirm || 'OK',
    // `?cart-sku=` link pre-fill (CART-3): the status line while the link's items are being added,
    // and the notice when some of them couldn't be. The cart page shows its own warning modal from
    // a rendering-datasource field (`cartWarningPopupNotice`), which has no value on the PLP.
    preloadLoading: c.preloadLoading || 'Adding the items from your link…',
    preloadWarningHeading: c.preloadWarningHeading || 'Some items could not be added',
    preloadWarningDescription:
      c.preloadWarningDescription ||
      'One or more products from your link are unavailable or no longer on sale, so they were skipped. Everything else has been added to your cart.',
    preloadWarningConfirm: c.preloadWarningConfirm || 'OK',
  };
};

/**
 * B2B sort-control labels, from the Sitecore "Sort" group under /Data/B2B Product List Labels,
 * with code fallbacks. The Sort button text can still be overridden by the datasource
 * `sortByLabel` field (that wins over `sortButton`).
 */
export const useB2BSortLabels = () => {
  const s = useLabelGroups().sort;
  return {
    sortButton: s.sortButton || 'Sort',
    sortRecommended: s.sortRecommended || 'Recommended',
    sortPriceAsc: s.sortPriceAsc || 'Price: Low to High',
    sortPriceDesc: s.sortPriceDesc || 'Price: High to Low',
    sortAlpha: s.sortAlpha || 'Alphabetical',
  };
};

/**
 * B2B PLP toolbar labels (filter button + the popup's Clear/Apply), from the Sitecore "Toolbar"
 * group under /Data/B2B Product List Labels, with code fallbacks.
 *
 * Unlike the Sort control, these deliberately have NO datasource-field override. The PLP shares
 * `/search`'s Algolia Search Settings item, whose `filterLabel` / `clearFiltersLabel` hold that
 * page's wording ("Filter & Sort", "Clear all filters"); letting those win would relabel the PLP
 * with search copy. Sitecore still owns the text — just via this group rather than that item.
 */
export const useB2BToolbarLabels = () => {
  const t = useLabelGroups().toolbar;
  return {
    filterButton: t.filterButton || 'Categories & Products',
    clearLabel: t.clearLabel || 'Clear',
    applyLabel: t.applyLabel || 'Apply',
    // Shown in place of a facet's checkboxes when the current selection leaves it with no values —
    // e.g. no Course record carries a certification, so Certification empties out. The section stays
    // put rather than disappearing mid-interaction.
    noOptionsLabel: t.noOptionsLabel || 'None for the current selection',
  };
};

/**
 * Copy for the currency-mismatch confirmation shown when adding/updating a row while the cart still
 * holds items in another currency (Sitecore "Currency Modal" group). Mirrors what the PDP reads from
 * its product-form `currencyChangeModal` datasource — the PLP has no such datasource, so the same
 * wording lives here. `{currency}` in the description is replaced with the newly selected currency.
 */
export const useB2BCurrencyModalLabels = () => {
  const c = useLabelGroups().currencyModal;
  return {
    heading: c.heading || 'Change currency?',
    description:
      c.description ||
      'Your cart contains items priced in a different currency. Continuing will re-price your entire cart in {currency}.',
    confirmLabel: c.confirmLabel || 'Continue',
    cancelLabel: c.cancelLabel || 'Cancel',
  };
};

/**
 * The popup a `productMessage` link opens on a row — the Peace of Mind terms, read from the SAME
 * authored Sitecore item the PDP's purchase-option radios open (see /api/b2bLabels), so the listing
 * cannot drift from the PDP's terms copy.
 *
 * Returns `null` until it has loaded, and stays `null` if the item can't be resolved — the row then
 * leaves the link inert rather than opening an empty modal. Unlike every other hook here there is no
 * code fallback: legal terms are not something to hard-code a stand-in for.
 */
export const useB2BProductMessageModal = (): B2BProductMessageModal | null =>
  useLabelGroups().productMessageModal ?? null;

/**
 * Region facet value map (Sitecore "Region Labels" group): Algolia `region.key` code → friendly
 * label. Editable in Sitecore; falls back to the index's own labels for the known codes and passes
 * through any additional codes set in Sitecore.
 */
export const useB2BRegionLabels = (): Record<string, string> => {
  const r = useLabelGroups().region;
  // MEMOIZE: a fresh object each render would churn any consumer that uses this as a hook/callback
  // dependency (e.g. the region facet's transformItems → useRefinementList), causing a render loop.
  return useMemo(
    () => ({
      nar01: 'Americas',
      emea01: 'Europe, Middle East & Africa',
      apac01: 'APAC',
      ...r,
    }),
    [r]
  );
};

/**
 * B2B product-row (listing item) labels, from the Sitecore "Product Row" group under
 * /Data/B2B Product List Labels, with code fallbacks.
 */
export const useB2BRowLabels = () => {
  const r = useLabelGroups().row;
  return {
    quantityLabel: r.quantityLabel || 'Quantity',
    attendeesLabel: r.attendeesLabel || 'Attendees',
    addToCartLabel: r.addToCartLabel || 'Add to Cart',
    updateQuantityLabel: r.updateQuantityLabel || 'Update',
    removeFromCartLabel: r.removeFromCartLabel || 'Remove from Cart',
    showDetailsLabel: r.showDetailsLabel || 'More Info',
    hideDetailsLabel: r.hideDetailsLabel || 'Less Info',
    priceLabel: r.priceLabel || 'Price:',
    originallyLabel: r.originallyLabel || 'Originally:',
    totalLabel: r.totalLabel || 'Total:',
    // Stock pills. Defaults deliberately match the cart page's own wording for the same two states
    // (`productNotAvailableNotice` / `inventoryLabel`) so the listing and the cart read the same.
    notAvailableLabel: r.notAvailableLabel || 'Not Available',
    fewSeatsLabel: r.fewSeatsLabel || 'Few Seats Left',
    // Tooltip on a row's greyed-out quantity/Add controls while a CPQ (quoted) cart is active
    // (CTX-5). The cart panel carries the full explanation; a row only has room for a `title`.
    cpqReadOnlyTooltip:
      r.cpqReadOnlyTooltip || 'Your quoted cart cannot be changed from the product list.',
  };
};
