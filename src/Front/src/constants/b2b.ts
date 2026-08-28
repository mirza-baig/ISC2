// Shared B2B identifiers used to detect the B2B Product Listing Page outside of
// SearchWrapper (which owns the page itself) — e.g. the global Header, which needs to hide
// chrome that conflicts with the page's own cart UI without importing SearchWrapper's
// (heavy, Algolia-dependent) module.
export const B2B_LISTING_TEMPLATE_NAME = 'B2BProductListingPage';

// The single kill-switch for everything in this project's B2B work. Must match a row name in the
// `Flags` field of /sitecore/content/ISC2/Main/Data/Feature Flags Folder/Feature Flags EXACTLY —
// the lookup is by literal string, and an absent name reads as false (so a typo silently turns the
// whole B2B experience off rather than erroring). That data item is per-environment and is NOT
// serialized, so each env owns its own value; see docs/B2B-EnvLocal-Sitecore-Items.md §5.
export const B2B_FEATURE_FLAG = 'B2B_Company_Flow';

export const SHOPPER_CONTEXT_COOKIE = 'b2b-shopper-context-type';

export const B2B_HIDDEN_NAV_LINKS = [
  'Benefits',
  'My Certifications',
  'Courses and Exams',
  'CPE Credits',
  'My Learning Journey',
];
