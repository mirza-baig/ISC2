import type { Hit } from 'instantsearch.js';

import type { SearchResultHit } from 'types/index';

/**
 * Purchase-option rows for the B2B listing, expanded on the client from what the index already
 * carries.
 *
 * A product is sold the way the PDP sells it: (for a scheduled class, pick a region and a date,
 * then) pick a purchase option — "Training" (the product itself), "Training & Exam", "…with Peace of
 * Mind Protection", a language variant, an exam kit. The upgrades are separate `product-bundle`
 * products carrying no date, no region and no certification, joined to the parent only by its
 * `skuReferencesProduct` (the same field the PDP's `fetchSkuReferenceItems` reads to build its
 * Purchase Options panel). On a variant listing they are therefore dateless, attribute-less rows
 * that vanish under any refinement, so most of the offer is unreachable.
 *
 * **This is not an OIL-only rule and the expansion below is not gated on modality or productType** —
 * any record with resolvable refs expands, EXCEPT a `liveonline` record is required to be a real,
 * dated session first (see `isInvalidOilSession`). Measured on the live index 2026-08-06, of the 38
 * records that then expanded on the PLP, 24 were scheduled live-online sessions (47 rows) and 14 were
 * not (29 rows): a self-paced course whose options are five language variants
 * (EDU-EXP-CC-OSP-180DAY-PH), a `pt-exams` record with a kit bundle (EXM-EXM-CISSP-AIM-EXM).
 *
 * This expands the cross product **at render time** instead of at index time. The alternative was a
 * generated third index (`shared/b2bListing.ts` in the commerce-tools repo, plus a scheduled full
 * rebuild); it was dropped because everything the join needs is already on the records — the refs
 * are plain SKUs and `objectID === sku`, so they resolve by direct lookup — and a generated index
 * would only ever be as fresh as its last rebuild.
 *
 * Measured against the live `-b2b` index (2026-08-06): 206 records carry `skuReferencesProduct`,
 * 391 refs in total, of which 369 resolve to a record in the index and 368 of those are
 * `product-bundle` (so ~6% of refs dangle and are skipped rather than rendered as a broken row).
 * 184 records have at least one resolvable ref; all of them are `pt-exam-prep` bar one `pt-exams`,
 * and all are inside the listing's scope filter. The drop from 184 to the 38 that expand is entirely
 * the past-date and region-less rules, not a type restriction.
 */

/** Joins the session SKU to the bundle SKU in a generated row's `objectID`. Matches the convention
 *  the index-side transform used, so a row's identity reads the same either way. */
export const B2B_OPTION_ID_SEPARATOR = '__';

/** `b2bRecordType` on a row this module generated. B2BProductLineHit already reads the field to
 *  render the option variant of the row; the suppression rule below reads it to tell a generated row
 *  (which carries a bundle SKU legitimately) from a bare bundle record. */
export const B2B_PURCHASE_OPTION_RECORD_TYPE = 'purchase-option';

/** True for a row produced by `expandPurchaseOptionRows`, as opposed to a record Algolia returned. */
export const isGeneratedOptionRow = (hit: { b2bRecordType?: string } | undefined): boolean =>
  hit?.b2bRecordType === B2B_PURCHASE_OPTION_RECORD_TYPE;

/** The `product-bundle` fields a generated row needs. A subset of the full record — this is what the
 *  bootstrap query asks Algolia to retrieve. */
export interface B2BBundleRecord {
  objectID: string;
  sku?: string;
  productKey?: string;
  productType?: string;
  parentTitle?: string;
  copyName?: string;
  description?: string;
  moreInfo?: string;
  productMessage?: string;
}

/** sku → bundle record, for every `product-bundle` in the index (103 of them, so this is small and
 *  is fetched once per page load rather than per refinement). */
export type B2BBundleMap = Record<string, B2BBundleRecord>;

type ExpandableHit = Hit<SearchResultHit> & {
  skuReferencesProduct?: string[];
  productType?: string;
};

/** The refs on a record that actually resolve to a `product-bundle` in the index, in index order and
 *  de-duplicated. Anything dangling or pointing at a non-bundle is dropped — a ref we cannot resolve
 *  has no title and no price, so there is nothing to render. */
export const resolvableBundleRefs = (
  hit: { skuReferencesProduct?: string[] } | undefined,
  bundles: B2BBundleMap
): B2BBundleRecord[] => {
  const refs = hit?.skuReferencesProduct;
  if (!Array.isArray(refs) || !refs.length) {
    return [];
  }

  const seen = new Set<string>();

  return refs.reduce<B2BBundleRecord[]>((acc, ref) => {
    if (typeof ref !== 'string' || seen.has(ref)) {
      return acc;
    }
    seen.add(ref);

    const bundle = bundles[ref];
    if (bundle && bundle.productType === 'product-bundle') {
      acc.push(bundle);
    }

    return acc;
  }, []);
};

/**
 * An instructor-led session that is not a real, dated, regioned instance must not be listed at all,
 * and must not be used as the class half of a purchase-option row: no region (user decision,
 * 2026-08-05: "if an OIL class does not have a region value then we don't use or show it"), or no
 * `startDate` at all — a placeholder/parent catalog record impersonating a session rather than an
 * actual scheduled instance.
 *
 * Scoped strictly to online instructor-led — `modality.key === 'liveonline'`. Widening either rule to
 * every scheduled record would erase the in-person ones, none of which carry a region (0 of 11,
 * measured), and would erase the legitimately dateless non-OIL expansions (a self-paced course's
 * language-variant options, an exam kit bundle) that have no session to date in the first place.
 * Region coverage on OIL is the limiting factor on how much this listing shows: only 64 of 244 dated
 * live-online records had one on 2026-08-06.
 */
export const isInvalidOilSession = (hit: {
  startDate?: string;
  modality?: { key?: string };
  region?: { key?: string };
}): boolean => hit?.modality?.key === 'liveonline' && (!hit?.startDate || !hit?.region?.key);

/**
 * One generated row: the **bundle's** identity and money (it is what gets priced and added to the
 * cart) carrying the **session's** when/where/what, so it filters, sorts and reads alongside the
 * class rows it sits under.
 *
 * `b2bPickedSku`/`b2bPickedProductKey` are the two halves of the `pickedProducts` entry the cart
 * service needs to know which session the bundle is for — the same payload the PDP sends once its
 * date picker is confirmed (see `buildAddPayload` in B2BProductLineHitContainer and
 * `getSelectDateBundlePayload`).
 */
const buildOptionRow = (
  session: ExpandableHit,
  bundle: B2BBundleRecord,
  position: number
): Hit<SearchResultHit> => {
  const bundleSku = bundle.sku ?? bundle.objectID;

  return {
    ...session,
    objectID: `${session.objectID}${B2B_OPTION_ID_SEPARATOR}${bundleSku}`,
    sku: bundleSku,
    productKey: bundle.productKey ?? bundleSku,
    // The option's own name ("SSCP Online Instructor-Led Training & Exam with Peace of Mind
    // Protection"). No bundle record carries `title` (0 of 103, measured), so `parentTitle` is the
    // real name here, not a fallback.
    title: bundle.parentTitle ?? bundle.copyName ?? session.title,
    parentTitle: bundle.parentTitle,
    copyName: bundle.copyName,
    // Detail text and the rich-text marketing message belong to the option being sold, not to the
    // class — a POM row's "You're covered for a second try" only makes sense against the POM bundle.
    description: bundle.description ?? '',
    moreInfo: bundle.moreInfo,
    productMessage: bundle.productMessage,
    // `product-bundle` records carry none of the facet attributes (certification/modality/duration/
    // focusArea are 0 of 103), so the session's are kept as spread above: a generated row has to
    // stay consistent with the server-side refinement that produced its session, or refining by
    // certification would drop the very rows the class was expanded into.
    b2bRecordType: B2B_PURCHASE_OPTION_RECORD_TYPE,
    b2bPickedSku: (session.sku ?? session.objectID) as string,
    b2bPickedProductKey: session.productKey,
    b2bSessionTitle: session.title,
    // Keep list position monotonic across the expansion so analytics and the "first rendered row"
    // lookups stay in DOM order.
    __position: position,
  } as unknown as Hit<SearchResultHit>;
};

/**
 * Expand a page of hits into listing rows: every record that references resolvable bundles keeps its
 * own row (that row IS the plain "Training" option) and gains one row per referenced bundle, in
 * index order, directly beneath it.
 *
 * Applied to the hit list **before** sorting, pricing and the row filters, so a generated row is
 * priced by its own (bundle) SKU, sorts on its own price, and is subject to exactly the same client
 * -side filters as any other row.
 *
 * `suppressedBundleSkus` collects the bundles that were expanded onto a session here; the caller
 * hides their bare, dateless rows (see `b2bBundleRowSuppressor`). Left to the caller rather than
 * done inline because the bare row and its sessions can land on different infinite-scroll pages.
 */
export const expandPurchaseOptionRows = (
  hits: Hit<SearchResultHit>[],
  bundles: B2BBundleMap
): Hit<SearchResultHit>[] => {
  if (!hits.length || !Object.keys(bundles).length) {
    return hits;
  }

  const expanded: Hit<SearchResultHit>[] = [];

  hits.forEach((hit) => {
    expanded.push(hit);

    resolvableBundleRefs(hit as ExpandableHit, bundles).forEach((bundle) => {
      expanded.push(buildOptionRow(hit as ExpandableHit, bundle, expanded.length));
    });
  });

  return expanded;
};

/**
 * The set of bundle SKUs that are represented by a generated row somewhere in the current result
 * set, so their bare rows can be hidden.
 *
 * Derived from the whole refined result set (not from the loaded pages), because a bundle's bare row
 * and the sessions that reference it are ordered independently and routinely land on different
 * pages — suppressing per page would make a row appear or disappear depending on how far the reader
 * had scrolled.
 *
 * Deliberately empty when the refinement leaves no referencing session in the set: refining to
 * Category = Bundles must still list the bundles, otherwise the rule would hide rows and put nothing
 * in their place.
 */
export const collectSuppressedBundleSkus = (
  sessions: { skuReferencesProduct?: string[] }[],
  bundles: B2BBundleMap
): Set<string> => {
  const suppressed = new Set<string>();

  sessions.forEach((session) => {
    resolvableBundleRefs(session, bundles).forEach((bundle) => {
      suppressed.add(bundle.sku ?? bundle.objectID);
    });
  });

  return suppressed;
};
