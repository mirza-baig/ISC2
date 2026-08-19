import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  useCurrentRefinements,
  useRefinementList,
  type RefinementListProps,
} from 'react-instantsearch-hooks-web';
import type { SearchClient } from 'algoliasearch/lite';
import { CloseIcon, FilterIcon } from 'icons/index';
import { useOnEventOutside } from 'hooks/index';
import { FacetKeyValues } from 'types/index';

import { useB2BToolbarLabels } from './B2BPrivateClassContext';
import B2BPlpToolbarPopover from './B2BPlpToolbarPopover';
import { PRODUCT_TYPE_ATTRIBUTE, getProductTypeLabel } from './SearchFacets/productTypeLabels';
import { PRICE_FACET_ATTRIBUTE, type PriceBucket } from './SearchFacets/priceBuckets';
import { useB2BAllFacetValues, type B2BAllFacetValues } from './useB2BAllFacetValues';

/**
 * Joins `attribute` and `value` into a single pending-toggle key. A control character keeps the
 * split unambiguous — facet values are free text and could contain any printable separator — and
 * it must stay ONE character wide, since `applyPending` splits on `indexOf(SEP)` + 1. Written as
 * an escape rather than embedded literally: this file used to hold the raw byte, which made
 * ripgrep classify it as binary and skip it silently in every content search.
 */
const SEP = '\u0001';

/**
 * B2B PLP filter (prototype). A pop-up anchored to the "Categories & Products" button with a
 * two-column facet layout and **pending Clear/Apply behavior**: ticking a box does NOT refine
 * live — it updates local pending state; **Apply** commits all pending changes at once, **Clear**
 * unchecks everything. This avoids the per-tick re-search (and its goToTop scroll jump) of the
 * shared live-refine facet, and matches the prototype. Must live inside `<InstantSearch>`.
 */

interface B2BPlpFilterProps {
  filterKeyValues: FacetKeyValues[];
  showMoreLabel: string;
  /** Extra reset run by Clear, for listing state that lives outside InstantSearch (the B2B sort +
   *  applied price buckets). */
  onClear?: () => void;
  /** Currently-APPLIED price buckets (ids). Lives in SearchWrapper, not InstantSearch — the price
   *  filter is client-side (see priceBuckets.ts). Empty set = no price filter. */
  priceBuckets: Set<string>;
  /** Toggles one applied price bucket. Registered into the pending/Apply machinery as the price
   *  attribute's "refine", so Apply commits pending price ticks exactly like an Algolia facet. */
  onTogglePriceBucket: (bucketId: string) => void;
  /** The active currency's bucket definitions (bounds + formatted labels). Passed in rather than
   *  imported so this popup and SearchWrapper's filter predicate can never disagree about the
   *  thresholds — see `getPriceBuckets`. */
  priceBucketOptions: PriceBucket[];
  /** Used for the one extra query that fetches the unrefined option list — see
   *  useB2BAllFacetValues. Passed in because both already exist in SearchWrapper. */
  searchClient: SearchClient;
  indexName: string;
}

/** How many options a facet shows before "Show more". */
const FACET_COLLAPSED_LIMIT = 10;

/** Ceiling on the widget's own value list. It no longer decides how many options are *visible* —
 *  the panel draws the full list from useB2BAllFacetValues and does its own Show more — but the
 *  live list is still what says which values are currently applied, so it has to be able to hold
 *  every value rather than the first ten. Matches the `showMoreLimit` it replaces, so the request
 *  Algolia receives is unchanged. */
const FACET_ITEMS_LIMIT = 300;

/** Everything one Algolia facet's section needs from the live search response, reported up by the
 *  subscriber below. Taken off the hook's own return type so the two can never drift. Show-more is
 *  no longer part of it: the widget only ever sees the values that survive the current refinement,
 *  so paging *its* list would page the wrong list. */
type FacetData = Pick<ReturnType<typeof useRefinementList>, 'items'>;

/** One drawn checkbox: a value from the full list, carrying whatever the live response knows about
 *  it. `isRefined` is false for a value the current refinement excludes — it is offered anyway. */
type FacetOption = {
  value: string;
  label: string;
  isRefined: boolean;
};

interface B2BFacetSubscriberProps {
  attribute: string;
  transformItems?: RefinementListProps['transformItems'];
  registerRefine: (attribute: string, refine: (value: string) => void) => void;
  /** Hands this facet's live values up to the parent, which owns both the layout and the sections. */
  report: (attribute: string, data: FacetData) => void;
}

/**
 * The `useRefinementList` widget for one facet — and nothing else. Renders no DOM: its whole job is
 * to hold the subscription and pass the values up.
 *
 * **Why the widget is split from the section that draws the checkboxes.** react-instantsearch-hooks
 * removes a widget's contributed refinement from InstantSearch's UI state when the widget unmounts,
 * and a React element moved to a *different parent* unmounts and remounts — a `key` does not survive
 * a change of parent. Sections are dealt between two independent column `<div>`s (see the comment on
 * the columns below) and that deal changes as facets report their values, so a widget living inside a
 * section got unmounted by a re-deal and silently dropped its own refinement. That is what broke
 * shareable URLs: `/products/listing?productType=pt-exam-prep&certification=CISSP` sent the correct
 * query first, then the refinements fell off one at a time (93 → 96 → 835 hits, all within ~20ms) as
 * each facet's values landed and re-dealt the columns, leaving the unfiltered list with nothing
 * ticked. Subscribers render in one flat list in the Sitecore facet order, which never re-parents,
 * so no layout change can unmount them; the sections are pure presentation and free to move.
 */
const B2BFacetSubscriber = ({
  attribute,
  transformItems,
  registerRefine,
  report,
}: B2BFacetSubscriberProps): null => {
  // No `showMore`: the panel's own Show more pages the FULL option list (useB2BAllFacetValues), not
  // this one. This list is asked for whole so every applied value is in it, whatever its rank.
  const { items, refine } = useRefinementList({
    attribute,
    limit: FACET_ITEMS_LIMIT,
    transformItems,
  });

  // Expose this facet's refine() so the parent's Apply can commit pending changes (ref write only —
  // never calls refine here, so no render loop).
  useEffect(() => {
    registerRefine(attribute, refine);
  }, [attribute, refine, registerRefine]);

  // Safe against a report → setState → re-render → report loop: `useConnector` holds its render
  // state in `useState` and only replaces it when the state actually changed (comparing everything
  // except functions), so `items` is stable across re-renders it did not cause.
  useEffect(() => {
    report(attribute, { items });
  }, [attribute, items, report]);

  return null;
};

/** One facet section: pure presentation over the subscriber's reported values, so it can be dealt
 *  into either column — and re-dealt — with nothing to lose. Defers refinement to the parent's
 *  Apply. */
interface B2BFacetSectionProps {
  attribute: string;
  label: string;
  showMoreLabel: string;
  /** Stand-in for the checkboxes when the current selection leaves this facet with no values. */
  noOptionsLabel: string;
  data?: FacetData;
  /** Every value this facet can offer, ignoring the current selection — see useB2BAllFacetValues.
   *  Undefined until that query answers (or if it failed), in which case the live values are used
   *  on their own, exactly as before. */
  allValues?: string[];
  /** The values currently refined on this attribute, per InstantSearch's own state. Undefined when
   *  nothing is refined on it, in which case the live values speak for themselves. */
  applied?: Set<string>;
  /** Whether this facet's Show more has been used. Owned by the parent and keyed by attribute, so
   *  re-dealing the columns cannot collapse a facet the user has already expanded. */
  expanded: boolean;
  onShowMore: (attribute: string) => void;
  pendingHas: (attribute: string, value: string) => boolean;
  onToggle: (attribute: string, value: string) => void;
}

const B2BFacetSection = ({
  attribute,
  label,
  showMoreLabel,
  noOptionsLabel,
  data,
  allValues,
  applied,
  expanded,
  onShowMore,
  pendingHas,
  onToggle,
}: B2BFacetSectionProps): JSX.Element => {
  const liveItems = data?.items;

  // The full option list, wearing the live response's applied state. Anything the current selection
  // excludes is still listed — just unticked — which is the whole point: the options do not move as
  // you filter. Values are taken in the full list's fixed order (see useB2BAllFacetValues), so a
  // checkbox never jumps under the cursor when a tick changes the counts.
  const items = useMemo<FacetOption[]>(() => {
    const live = liveItems ?? [];
    const byValue = new Map(live.map((item) => [item.value, item]));

    const values = allValues?.length ? [...allValues] : live.map((item) => item.value);
    const seen = new Set(values);
    // Anything live or applied that the full list has never heard of: the two responses can
    // disagree (the full list is one query older than the index), and a shared URL can carry a
    // value that has since gone. Listing it is what keeps it removable.
    live.forEach((item) => {
      if (!seen.has(item.value)) {
        seen.add(item.value);
        values.push(item.value);
      }
    });
    applied?.forEach((value) => {
      if (!seen.has(value)) {
        seen.add(value);
        values.push(value);
      }
    });

    return values.map((value) => ({
      value,
      label: byValue.get(value)?.label ?? value,
      // Taken from InstantSearch's own refinement state rather than from the facet response
      // whenever that state knows this attribute. A refinement that leaves zero hits also leaves
      // the facet response with nothing to report, and the box for it then drew itself UNTICKED —
      // a filter the badge counted, the URL carried, and the user had no way to take off again.
      isRefined: applied ? applied.has(value) : byValue.get(value)?.isRefined ?? false,
    }));
  }, [liveItems, allValues, applied]);

  const hasValues = items.length > 0;
  const isChecked = (item: FacetOption) => item.isRefined !== pendingHas(attribute, item.value);
  // Collapsed shows the first N — plus any ticked value further down, which must stay on screen or
  // an applied refinement looks like it was lost and cannot be undone without Show more.
  const visibleItems = expanded
    ? items
    : [
        ...items.slice(0, FACET_COLLAPSED_LIMIT),
        ...items.slice(FACET_COLLAPSED_LIMIT).filter(isChecked),
      ];

  return (
    <div className="py-3">
      <p className="cta mb-3 font-semibold text-black-100">{label}</p>
      {!hasValues && <p className="text-sm italic text-black-60">{noOptionsLabel}</p>}
      <div className="flex flex-col gap-2.5">
        {visibleItems.map((item) => {
          // Displayed check = applied state XOR a pending toggle (so it reflects unsaved edits).
          const checked = isChecked(item);
          const display =
            attribute === PRODUCT_TYPE_ATTRIBUTE
              ? getProductTypeLabel(item.value, item.label)
              : item.label;
          return (
            <label
              key={item.value}
              className="flex cursor-pointer items-center gap-2 text-sm text-black-100"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(attribute, item.value)}
                className="h-4 w-4 cursor-pointer rounded-sm accent-isc2-green"
              />
              {/* Value only — no `(count)`. Algolia's facet counts are computed on the server, so
                  they cannot see the client-side filters this listing applies afterwards (the price
                  buckets, and rows dropped for a past start date), which made them read high against
                  the list you actually get. They would also be the wrong number here now: the
                  options come from a query that ignores the current selection, so a count next to
                  them would describe a listing you are not looking at. */}
              <span className="truncate">{display}</span>
            </label>
          );
        })}
        {visibleItems.length < items.length && (
          <button
            type="button"
            onClick={() => onShowMore(attribute)}
            className="cta focus-underline-dark-green mt-1 p-0 text-left"
          >
            {showMoreLabel}
          </button>
        )}
      </div>
    </div>
  );
};

interface B2BPriceFacetProps {
  label: string;
  buckets: PriceBucket[];
  /** Applied bucket ids — the checkbox shows applied XOR pending, same as an Algolia facet. */
  appliedBucketIds: Set<string>;
  pendingHas: (attribute: string, value: string) => boolean;
  onToggle: (attribute: string, value: string) => void;
  onTogglePriceBucket: (bucketId: string) => void;
  registerRefine: (attribute: string, refine: (value: string) => void) => void;
}

/**
 * The price section — a hand-rolled facet, because price is not an Algolia attribute (see
 * priceBuckets.ts). It plugs into the parent's pending/Apply machinery exactly like B2BPendingFacet:
 * it registers a "refine" (the bucket toggle) under the price sentinel attribute, and its checkbox
 * reflects `applied XOR pending`. Like the Algolia facets it shows no per-value count; unlike them it
 * never could, since price is not indexed and counting buckets would mean bulk-pricing the whole set
 * on mount (defeating the lazy per-SKU pricing).
 */
const B2BPriceFacet = ({
  label,
  buckets,
  appliedBucketIds,
  pendingHas,
  onToggle,
  onTogglePriceBucket,
  registerRefine,
}: B2BPriceFacetProps): JSX.Element => {
  // Expose the bucket toggle as this facet's refine() so the parent's Apply commits pending price
  // ticks in the same loop as the Algolia facets (ref write only — never toggles during render).
  useEffect(() => {
    registerRefine(PRICE_FACET_ATTRIBUTE, onTogglePriceBucket);
  }, [onTogglePriceBucket, registerRefine]);

  return (
    <div className="py-3">
      <p className="cta mb-3 font-semibold text-black-100">{label}</p>
      <div className="flex flex-col gap-2.5">
        {buckets.map((bucket) => {
          const checked =
            appliedBucketIds.has(bucket.id) !== pendingHas(PRICE_FACET_ATTRIBUTE, bucket.id);
          return (
            <label
              key={bucket.id}
              className="flex cursor-pointer items-center gap-2 text-sm text-black-100"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(PRICE_FACET_ATTRIBUTE, bucket.id)}
                className="h-4 w-4 cursor-pointer rounded-sm accent-isc2-green"
              />
              <span className="truncate">{bucket.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
};

const B2BPlpFilter = ({
  filterKeyValues,
  showMoreLabel,
  onClear,
  priceBuckets,
  onTogglePriceBucket,
  priceBucketOptions,
  searchClient,
  indexName,
}: B2BPlpFilterProps): JSX.Element | null => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  // Called up here with the other hooks, ahead of the `!filterableKeyValues.length` bail-out below —
  // hooks must run unconditionally on every render.
  const L = useB2BToolbarLabels();

  // Every Algolia facet this panel draws. Price is excluded — it is not an Algolia attribute at all
  // (see priceBuckets.ts), so it has no values to fetch.
  const facetAttributes = useMemo(
    () =>
      (filterKeyValues ?? [])
        .map((filter) => filter.FacetAttribute)
        .filter((attribute) => attribute !== PRICE_FACET_ATTRIBUTE),
    [filterKeyValues]
  );

  // The complete option list per facet, independent of what is ticked — this is what stops the
  // panel narrowing itself as filters are applied. See useB2BAllFacetValues.
  const allFacetValues: B2BAllFacetValues = useB2BAllFacetValues({
    enabled: facetAttributes.length > 0,
    searchClient,
    indexName,
    attributes: facetAttributes,
  });

  // Which facets the user has expanded via Show more. Keyed by attribute rather than held in the
  // section, so re-dealing the columns (which remounts the sections) cannot collapse one again.
  const [expandedFacets, setExpandedFacets] = useState<Set<string>>(new Set());
  const onShowMore = useCallback((attribute: string) => {
    setExpandedFacets((prev) => new Set(prev).add(attribute));
  }, []);

  // Pending toggles keyed `attribute\u0001value` — a value here means "flip it vs the applied state".
  const [pending, setPending] = useState<Set<string>>(new Set());
  const facetRefineRef = useRef<Record<string, (value: string) => void>>({});

  const { items: currentRefinements } = useCurrentRefinements();
  // Applied price buckets live outside InstantSearch (client-side filter, see priceBuckets.ts), so
  // add them to the badge count that useCurrentRefinements only knows the Algolia refinements for.
  const activeCount =
    currentRefinements.reduce((sum, item) => sum + item.refinements.length, 0) + priceBuckets.size;

  // What is refined right now, per attribute — the same state the badge above counts, which is what
  // makes it the honest source for the checkboxes too (see the note in B2BFacetSection).
  const appliedByAttribute = useMemo(() => {
    const applied: Record<string, Set<string>> = {};
    currentRefinements.forEach((group) => {
      applied[group.attribute] = new Set(group.refinements.map((r) => String(r.value)));
    });
    return applied;
  }, [currentRefinements]);

  const registerRefine = useCallback((attribute: string, refine: (value: string) => void) => {
    facetRefineRef.current[attribute] = refine;
  }, []);

  // Live values per facet, reported up by the subscribers. The parent owns them because it owns both
  // the sections (which are now pure) and the column layout, which depends on which facets have
  // anything to show.
  const [facetData, setFacetData] = useState<Record<string, FacetData>>({});
  const report = useCallback((attribute: string, data: FacetData) => {
    setFacetData((prev) => ({ ...prev, [attribute]: data }));
  }, []);
  /** Attributes that have had values at least once — see where it is filled in, below. */
  const everHadValuesRef = useRef<Set<string>>(new Set());
  const pendingHas = useCallback(
    (attribute: string, value: string) => pending.has(`${attribute}${SEP}${value}`),
    [pending]
  );
  const onToggle = useCallback((attribute: string, value: string) => {
    setPending((prev) => {
      const key = `${attribute}${SEP}${value}`;
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  // Reset unsaved edits whenever the pop-up opens, so it always reflects the applied state.
  useEffect(() => {
    if (open) {
      setPending(new Set());
    }
  }, [open]);

  const applyPending = () => {
    pending.forEach((key) => {
      const sep = key.indexOf(SEP);
      const attribute = key.slice(0, sep);
      const value = key.slice(sep + 1);
      facetRefineRef.current[attribute]?.(value); // toggles it to the pending state
    });
    setPending(new Set());
    setOpen(false);
  };

  // Clear = unlike a checkbox tick, this commits immediately: it removes every currently-applied
  // refinement from the page right away (not just the popup's checkboxes), while leaving Apply's
  // pending/apply behavior untouched. Also discards any unrelated pending toggles, since after a
  // Clear there is nothing left applied for them to be "pending against". Like Apply, it also
  // closes the popup (prototype: both footer buttons close it after acting). `onClear` resets the
  // listing state that is not InstantSearch's — the sort — so Clear returns the page to its
  // default view rather than to "unfiltered but still sorted".
  const clearPending = () => {
    // `onClear` runs FIRST, before the refinements are dropped. Un-refining puts InstantSearch's
    // router to work, and the router serialises the next URL — including the `sort=` that
    // SearchWrapper's `createURL` re-appends — from state as it stands at that moment, then writes
    // it after its debounce. Resetting the sort afterwards left the router holding the *old* sort,
    // so its delayed write put `sort=` back into the URL after the reset had already stripped it:
    // the list re-sorted correctly but the URL still said otherwise, and a refresh or share brought
    // the old sort back.
    onClear?.();
    currentRefinements.forEach((group) =>
      group.refinements.forEach((r) => facetRefineRef.current[group.attribute]?.(String(r.value)))
    );
    setPending(new Set());
    setOpen(false);
  };

  useOnEventOutside(ref, ['mousedown', 'touchstart'], () => setOpen(false));

  // Which facets render is entirely Sitecore's call — whatever the datasource's `filterKeyValues`
  // lists, in that order. No attribute is special-cased here.
  const filterableKeyValues = filterKeyValues;

  if (!filterableKeyValues?.length) {
    return null;
  }

  const label = L.filterButton;

  // A facet can come back empty for two reasons that need opposite treatment. Either the index has no
  // values for it at all — the facet datasource is shared with /search, so topics, genericType and
  // pageLanguage resolve here too and are empty against the -b2b index — in which case there is
  // nothing to say and the section should not exist; or its values are all excluded by the current
  // selection, which is common because certifications are only tagged on exam prep/exams (no Course
  // or Bundle record carries one). In that second case the section has to stay: a whole heading
  // vanishing while you tick boxes reads as the filter breaking, and the space it leaves reshuffles
  // the columns. This latch tells them apart — a facet that has shown values at least once is real,
  // so it keeps its place and explains itself instead. Monotonic, so writing it during render is safe.
  // Now that the full option list is fetched independently of the selection, that list alone is
  // enough to say a facet is real — the "all its values are excluded right now" case it used to
  // have to survive can no longer happen. The live values still feed it so the panel behaves as it
  // always did on the first render, before that query has answered.
  const everHadValues = everHadValuesRef.current;
  filterableKeyValues.forEach((filter) => {
    if (
      (facetData[filter.FacetAttribute]?.items.length ?? 0) > 0 ||
      (allFacetValues[filter.FacetAttribute]?.length ?? 0) > 0
    ) {
      everHadValues.add(filter.FacetAttribute);
    }
  });
  // Price is not an Algolia facet, so it has no subscriber and nothing to report — its buckets are
  // always there.
  const isFacetVisible = (attribute: string) =>
    attribute === PRICE_FACET_ATTRIBUTE || everHadValues.has(attribute);

  // Deal the visible facets alternately into the two columns rendered below — see the comment there
  // for why the columns are independent stacks and why alternating (not left-column-first) is what
  // matches the prototype. Facets with nothing to show are left out entirely rather than parked:
  // they would take no space, so counting them would deal every later section into the wrong column
  // (the datasource currently lists an orphaned Region facet ahead of Category, which did exactly
  // that). Dropping the section no longer drops the subscription — that lives in the flat subscriber
  // list, which is mounted for every configured facet regardless of the layout.
  const facetColumns: [typeof filterableKeyValues, typeof filterableKeyValues] = [[], []];
  filterableKeyValues
    .filter((filter) => isFacetVisible(filter.FacetAttribute))
    .forEach((filter, index) => facetColumns[index % 2].push(filter));

  return (
    <B2BPlpToolbarPopover
      containerRef={ref}
      open={open}
      onToggle={() => setOpen((prev) => !prev)}
      haspopup="dialog"
      trigger={
        <>
          <FilterIcon size={18} />
          {label}
          {activeCount > 0 && (
            <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-isc2-green px-1.5 text-xxsm font-bold text-white-00">
              {activeCount}
            </span>
          )}
        </>
      }
    >
      {/* Stays mounted (hidden via a CSS class, not unmounted) even when closed: each facet below
          is backed by a `useRefinementList` widget, and react-instantsearch-hooks clears a
          widget's contributed refinement from InstantSearch's UI state when it unmounts. Closing
          the popup right after Apply used to unmount these widgets and silently revert the
          refinement it had just applied. Visibility is toggled via the `hidden`/`flex` class pair
          rather than the native `hidden` attribute — the attribute's `display: none` loses the
          cascade tie against this element's own `flex` utility class, so the attribute was being
          set correctly but had no visual effect. */}
      <section
        role="dialog"
        aria-label={label}
        aria-hidden={!open}
        /* `max-w` matches the page's own horizontal padding on mobile (`px-5` each side = 2.5rem
           total), so the 460px popup can never extend past the left edge of the viewport and get
           clipped off-page on a narrow screen.

           That clamp alone was not enough below `sm`: `right-0` aligns the popup's RIGHT edge with
           the Filter button's, and on mobile that button sits at the LEFT of its row, so a popup
           this wide still ran off the left of the page. There the wrapper goes `static` and the
           popup pins to both edges of the toolbar row instead — spanning the content width, which
           is already inset by the page padding. The width clamps are cleared at that size or they
           would fight the two-edge pin. */
        // `max-sm:z-filters-menu` (3001, from tailwind.config.js) so the full-screen mobile overlay
        // sits above the sticky header (`z-header`, 1000) instead of appearing to render behind it.
        className={`absolute right-0 top-full z-30 mt-2 max-h-[70vh] w-[460px] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-lg border border-gray-50 bg-white-00 shadow-lg max-sm:fixed max-sm:inset-0 max-sm:z-filters-menu max-sm:m-0 max-sm:h-full max-sm:max-h-none max-sm:w-full max-sm:max-w-none max-sm:rounded-none max-sm:border-0 ${
          open ? 'flex' : 'hidden'
        }`}
      >
        {/* Mobile-only header: "Filters" + X close. Below `sm` this popup becomes a full-screen
            overlay (see the `max-sm:fixed max-sm:inset-0` classes above), so it needs its own
            close affordance — on desktop it stays a pop-up closed via outside-click or the
            footer buttons, so this row is hidden there. */}
        <div className="flex items-center justify-between border-b border-gray-50 px-4 py-3 sm:hidden">
          <span className="text-sm font-semibold text-black-100">{label}</span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close filters"
            className="flex h-6 w-6 cursor-pointer items-center justify-center rounded border border-gray-50 text-gray-70 hover:text-black-100"
          >
            <CloseIcon size={12} />
          </button>
        </div>

        {/* Two-column facet layout (prototype) — two columns even on mobile, matching the design.
            These are two INDEPENDENT stacks, not a two-column grid. In a grid every section is a
            cell, so a row is as tall as its tallest section and a short one leaves dead space
            underneath: with Category (6 values) beside Certification (10), Price fell into the next
            grid row and rendered level with the bottom of Certification — far down the panel,
            visually detached from the facets above it. Independent flex columns share no rows, so
            each one packs tight against its own contents.
            Sections are dealt out alternately rather than filling the left column first, which is
            what reproduces the prototype's arrangement: the Sitecore facet order is Category,
            Certification, Price, so Price lands directly under Category and the long Certification
            list gets the right column to itself. */}
        {/* The Algolia subscriptions, one per configured facet, in the Sitecore facet order. Render
            no DOM and deliberately live OUTSIDE the columns: this list is what must never re-parent,
            or the refinement a shareable URL arrived with gets dropped — see B2BFacetSubscriber. */}
        {filterableKeyValues
          .filter((filter) => filter.FacetAttribute !== PRICE_FACET_ATTRIBUTE)
          .map((filter) => (
            <B2BFacetSubscriber
              key={filter.FacetAttribute}
              attribute={filter.FacetAttribute}
              registerRefine={registerRefine}
              report={report}
            />
          ))}

        <div className="flex flex-1 gap-4 overflow-y-auto px-4 pt-4 sm:gap-8">
          {facetColumns.map((column, columnIndex) => (
            <div key={columnIndex} className="flex w-1/2 flex-col">
              {column.map((filter) =>
                filter.FacetAttribute === PRICE_FACET_ATTRIBUTE ? (
                  // Price isn't an Algolia facet — it's resolved per-SKU client-side, so it has no
                  // subscriber like the others. This custom section registers a synthetic "refine"
                  // (the bucket toggle) so Apply commits pending price ticks in the same loop. It is
                  // not an InstantSearch widget, so re-parenting it costs nothing but a re-register.
                  <B2BPriceFacet
                    key={filter.FacetAttribute}
                    label={filter.FacetLabel}
                    buckets={priceBucketOptions}
                    appliedBucketIds={priceBuckets}
                    pendingHas={pendingHas}
                    onToggle={onToggle}
                    onTogglePriceBucket={onTogglePriceBucket}
                    registerRefine={registerRefine}
                  />
                ) : (
                  <B2BFacetSection
                    key={filter.FacetAttribute}
                    attribute={filter.FacetAttribute}
                    label={filter.FacetLabel}
                    showMoreLabel={showMoreLabel}
                    noOptionsLabel={L.noOptionsLabel}
                    data={facetData[filter.FacetAttribute]}
                    allValues={allFacetValues[filter.FacetAttribute]}
                    applied={appliedByAttribute[filter.FacetAttribute]}
                    expanded={expandedFacets.has(filter.FacetAttribute)}
                    onShowMore={onShowMore}
                    pendingHas={pendingHas}
                    onToggle={onToggle}
                  />
                )
              )}
            </div>
          ))}
        </div>

        <footer className="flex gap-3 border-t border-gray-50 p-4">
          <button
            type="button"
            className="cta secondary-cta grow cursor-pointer"
            onClick={clearPending}
          >
            {L.clearLabel}
          </button>
          <button
            type="button"
            className="cta primary-cta grow cursor-pointer"
            onClick={applyPending}
          >
            {L.applyLabel}
          </button>
        </footer>
      </section>
    </B2BPlpToolbarPopover>
  );
};

export default B2BPlpFilter;
