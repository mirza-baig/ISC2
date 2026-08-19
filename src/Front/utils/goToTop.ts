// Smoothly scroll the window to a target offset (default: page top).
//
// We animate with requestAnimationFrame instead of the native
// `scrollTo({ behavior: 'smooth' })` because the browser's built-in smooth
// scroll caps its own duration: from far down a very tall page (e.g. the B2B
// PLP with many infinite-scroll hits) it whips to the top in a couple of
// frames and reads as an abrupt jolt. A controlled, eased animation keeps the
// motion consistent regardless of distance.
//
// Note: this animation runs regardless of the OS "reduce motion" setting — the
// native smooth behavior honors that flag and would snap instantly, which is
// what we're deliberately replacing here.

const MIN_DURATION = 400;
const MAX_DURATION = 900;

// easeInOutCubic — gentle acceleration in, gentle deceleration out.
const ease = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

let activeFrame = 0;

export const goToTop = (top = 0) => {
  if (typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function') {
    if (typeof window !== 'undefined') {
      window.scrollTo(0, top);
    }
    return;
  }

  const start = window.scrollY ?? window.pageYOffset;
  const distance = top - start;

  if (distance === 0) {
    return;
  }

  // Scale the duration with the distance travelled, clamped to a comfortable range.
  const duration = Math.min(MAX_DURATION, Math.max(MIN_DURATION, Math.abs(distance) * 0.6));

  // Cancel any in-flight scroll so overlapping clicks don't fight each other.
  if (activeFrame) {
    window.cancelAnimationFrame(activeFrame);
  }

  let startTime = 0;

  const step = (now: number) => {
    if (!startTime) {
      startTime = now;
    }

    const elapsed = now - startTime;
    const progress = Math.min(1, elapsed / duration);
    // `behavior: 'instant'` forces a non-animated write each frame so the browser
    // can't coalesce our per-frame positions into its own smooth scroll.
    window.scrollTo({
      left: 0,
      top: start + distance * ease(progress),
      behavior: 'instant' as ScrollBehavior,
    });
    if (progress < 1) {
      activeFrame = window.requestAnimationFrame(step);
    } else {
      activeFrame = 0;
    }
  };

  activeFrame = window.requestAnimationFrame(step);
};
