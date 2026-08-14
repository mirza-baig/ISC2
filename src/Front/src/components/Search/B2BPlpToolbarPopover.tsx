import type { ReactNode, Ref } from 'react';

/**
 * The shell the two B2B PLP toolbar controls (Filter and Sort) share: a positioning wrapper, the
 * toolbar trigger button, and whatever popup the caller renders beneath it. Extracted so the pair
 * cannot drift apart visually — they sit side by side in the same row.
 *
 * Deliberately dumb. It owns no open state, no outside-click handling and no ref of its own: the
 * caller keeps all of that and passes `containerRef` in, because the Filter's outside-click has to
 * co-ordinate with its pending-selection state and the Sort's does not. Nothing here re-parents the
 * popup either — the Filter's facet widgets must stay mounted in the same place in the tree (see
 * B2BPlpFilter's own note about the flat subscriber list).
 *
 * B2B-only: nothing outside the B2B PLP toolbar renders this.
 */

// `max-sm:static` hands the popup's positioning context up to the toolbar wrapper in SearchResults,
// which spans the full content width on mobile — see each popup's own comment. `useOnEventOutside`
// is unaffected: it tests DOM containment, not layout.
const CONTAINER_CLASS = 'relative max-sm:static';

const TRIGGER_CLASS =
  'flex cursor-pointer items-center gap-2 rounded border border-gray-50 bg-white-00 px-4 py-2 text-sm font-semibold text-black-100';

interface B2BPlpToolbarPopoverProps {
  // `Ref`, not `RefObject`: React 18 and 19 type `useRef<T>(null)` differently (`RefObject<T>` vs
  // `RefObject<T | null>`), and only `Ref<T>` accepts both — this code has to compile on either.
  containerRef: Ref<HTMLDivElement>;
  open: boolean;
  onToggle: () => void;
  /** `dialog` for the filter panel, `menu` for the sort options. */
  haspopup: 'dialog' | 'menu';
  /** Accessible name for the trigger, when its own content isn't enough on its own. */
  triggerLabel?: string;
  /** Contents of the trigger button — icon, label, badge, whatever the control needs. */
  trigger: ReactNode;
  /** The popup itself, rendered as a sibling of the trigger inside the positioning wrapper. */
  children: ReactNode;
}

const B2BPlpToolbarPopover = ({
  containerRef,
  open,
  onToggle,
  haspopup,
  triggerLabel,
  trigger,
  children,
}: B2BPlpToolbarPopoverProps): JSX.Element => (
  <div ref={containerRef} className={CONTAINER_CLASS}>
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-haspopup={haspopup}
      aria-label={triggerLabel}
      className={TRIGGER_CLASS}
    >
      {trigger}
    </button>

    {children}
  </div>
);

export default B2BPlpToolbarPopover;
