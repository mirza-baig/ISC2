import { useRef, useState } from 'react';
import clsx from 'clsx';

import { ChevronDownIcon } from 'icons/index';
import { useOnEventOutside } from 'hooks/index';
import { useB2BSortLabels } from './B2BPrivateClassContext';
import B2BPlpToolbarPopover from './B2BPlpToolbarPopover';

/**
 * B2B PLP sort control (prototype: a "Sort" button in the top toolbar, separate from the
 * "Categories & Exams" filter). Opens a small menu; selecting an option updates the sort.
 *
 * All labels (the button + each option) resolve from the Sitecore-managed items under
 * /Data/B2B Product List Labels ("Sort" group) via `useB2BSortLabels()`, with safe fallbacks.
 * The Sort button text can also be overridden per-instance by the datasource `sortByLabel` field.
 *
 * Sorting is applied client-side to the rendered hits (see SearchWrapper's comparator):
 * Recommended → relevance; Alphabetical → by title; Price → commercetools standalone price
 * loaded per SKU (approximate until price is in the index — DATA-1).
 */

export type B2BSortKey = 'recommended' | 'price-asc' | 'price-desc' | 'alpha';

// Exported so SearchWrapper can validate a `?sort=` URL param against the same set of keys
// (single source of truth) when preloading the sort from a shared/bookmarked link.
export const SORT_KEYS: B2BSortKey[] = ['recommended', 'price-asc', 'price-desc', 'alpha'];

interface B2BPlpSortProps {
  value: B2BSortKey;
  onChange: (value: B2BSortKey) => void;
  sortByLabel?: string;
}

const B2BPlpSort = ({ value, onChange, sortByLabel }: B2BPlpSortProps): JSX.Element => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const L = useB2BSortLabels();

  useOnEventOutside(ref, ['mousedown', 'touchstart'], () => setOpen(false));

  // Datasource `sortByLabel` field wins if set; else the Sitecore "Sort" group label.
  const label = sortByLabel || L.sortButton;

  const optionLabel = (key: B2BSortKey): string => {
    switch (key) {
      case 'price-asc':
        return L.sortPriceAsc;
      case 'price-desc':
        return L.sortPriceDesc;
      case 'alpha':
        return L.sortAlpha;
      case 'recommended':
      default:
        return L.sortRecommended;
    }
  };

  // Once a sort is chosen the button reads "Sort: <that option>", with the option in red, so the
  // current selection is readable without opening the menu. On the default (`recommended` — what
  // the page loads with and what Clear returns to) it stays the plain Sitecore-managed "Sort"
  // label, since nothing has been selected yet. The generic label is the menu's accessible name
  // either way. (`red-warning` is just the palette's deep red — no warning semantics intended.)
  const isSortSelected = value !== 'recommended';

  return (
    <B2BPlpToolbarPopover
      containerRef={ref}
      open={open}
      onToggle={() => setOpen((prev) => !prev)}
      haspopup="menu"
      triggerLabel={label}
      trigger={
        <>
          <span>
            {label}
            {isSortSelected && (
              <>
                {': '}
                <span className="text-red-warning">{optionLabel(value)}</span>
              </>
            )}
          </span>
          <ChevronDownIcon
            size={18}
            className={clsx('transition-transform', open && 'rotate-180')}
          />
        </>
      }
    >
      {open && (
        <section
          role="menu"
          aria-label={label}
          // Unlike B2BPlpFilter, Sort is the LAST toolbar item (packed via the row's
          // `justify-end`), so its button already sits flush against the row's true right edge —
          // centering the popup on the button (as tried previously) actually pushed it past that
          // edge, since the button's own center sits near the edge rather than mid-row. Anchoring
          // straight to `right-0` keeps the popup's right edge aligned with the button's, which is
          // already page-edge-safe; `max-w` is just a floor for extremely narrow viewports.
          //
          // Below `sm` the toolbar buttons pack from the LEFT of their own row, so anchoring to the
          // button's right edge pushed the menu off the left of the page. There the wrapper goes
          // `static` and the menu pins to both edges of the toolbar row instead — it spans the
          // content width, which is inset by the page padding, so both edges stay on screen. Width
          // clamps are cleared at that size or they would fight the two-edge pin.
          className="absolute right-0 top-full z-30 mt-2 w-56 max-w-[calc(100vw-2.5rem)] overflow-hidden rounded-lg border border-gray-50 bg-white-00 py-1 shadow-lg max-sm:left-0 max-sm:right-0 max-sm:w-auto max-sm:max-w-none"
        >
          {SORT_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              role="menuitemradio"
              aria-checked={value === key}
              onClick={() => {
                onChange(key);
                setOpen(false);
              }}
              className={clsx(
                'block w-full cursor-pointer px-4 py-2 text-left text-sm',
                value === key ? 'font-semibold text-isc2-green' : 'text-black-100 hover:bg-gray-10'
              )}
            >
              {optionLabel(key)}
            </button>
          ))}
        </section>
      )}
    </B2BPlpToolbarPopover>
  );
};

export default B2BPlpSort;
