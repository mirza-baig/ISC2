/**
 * Grouped B2B Product List labels, sourced from Sitecore under
 * /sitecore/content/ISC2/Main/Data/B2B Product List Labels (one "B2B Label Group" item per area).
 * Served by /api/b2bLabels and consumed via the B2BPrivateClass context label hooks.
 */
/**
 * Content for the popup a `productMessage` link opens on a PLP row — the Peace of Mind terms the
 * PDP's purchase-option radios open (ProductFormRadio). Read from the same authored Sitecore popup
 * item (/Data/Popups Folder/Peace Of Mind Terms Modal Popup) rather than re-authored for B2B, so the
 * two surfaces can never show different terms. `description` is rich text.
 */
export interface B2BProductMessageModal {
  heading: string;
  description: string;
  primaryCtaLabel: string;
  secondaryCtaLabel: string;
}

export interface B2BLabelGroups {
  privateClass: Record<string, string>;
  addressModal: Record<string, string>;
  cart: Record<string, string>;
  row: Record<string, string>;
  sort: Record<string, string>;
  /** Region facet value map: Algolia region.key code -> friendly label (e.g. nar01 -> Americas). */
  region: Record<string, string>;
  /**
   * PLP toolbar chrome (the filter button + the popup's Clear/Apply). These live here rather than on
   * the rendering datasource because the PLP now shares `/search`'s Algolia Search Settings item,
   * whose `filterLabel`/`clearFiltersLabel` carry `/search` copy ("Filter & Sort", "Clear all
   * filters") — one field cannot hold two pages' wording. See docs/B2B-EnvLocal-Sitecore-Items.md.
   */
  toolbar: Record<string, string>;
  /**
   * Copy for the "your cart is in another currency" confirmation the PLP shows on add/update, so it
   * matches the PDP's `currencyChangeModal` datasource wording. The PLP has no product-form
   * datasource to read that from, hence its own group here.
   */
  currencyModal: Record<string, string>;
  /**
   * NOT a label group — the popup content above, carried on the same response so the PLP needs one
   * fetch rather than two. Optional/nullable: absent whenever the item can't be resolved, and the
   * row then leaves its `productMessage` links inert exactly as it does today.
   */
  productMessageModal?: B2BProductMessageModal | null;
}

/**
 * A fresh set of empty groups — the shape every consumer falls back to. Both the API route (on any
 * failure) and the client fetcher (which never throws) resolve to this, so an unreachable Sitecore
 * degrades to each component's built-in default copy rather than to blank UI.
 *
 * Built per call rather than shared as a constant: the API route fills the groups in place.
 */
export const emptyB2BLabelGroups = (): B2BLabelGroups => ({
  privateClass: {},
  addressModal: {},
  cart: {},
  row: {},
  sort: {},
  region: {},
  toolbar: {},
  currencyModal: {},
});
