// Date helpers shared by the B2B PLP rows, the PLP cart panel and the listing's row filter.
//
// Two different questions live here, and they need different precision:
//
//  * "you can't REQUEST a private class for a day that has already gone" — a whole-day question,
//    asked of a date the user typed into `<input type="date">`. `todayISODate` + `isPastCalendarDay`
//    answer it, in the visitor's own timezone, never on instants.
//  * "has this scheduled session already STARTED?" — an instant question, asked of an indexed
//    session that carries a start time and a timezone. `hasSessionStarted` answers it, and it is a
//    deliberate mirror of what the PDP's buy box already does so the two cannot disagree about the
//    same session (see the note on that function).
import { getUTCTime } from 'utils/date';

/** Today as `YYYY-MM-DD` in the visitor's local timezone — the format `<input type="date">` wants
 *  for its `min`. `en-CA` is the shortest way to get a zero-padded ISO day out of `toLocaleDateString`
 *  without hand-rolling the padding. */
export const todayISODate = (): string => new Date().toLocaleDateString('en-CA');

const ISO_DAY = /^\d{4}-\d{2}-\d{2}/;

/**
 * True when `value` names a calendar day *before* today. Missing, empty or unparseable values are
 * NOT past (the index leaves `startDate` off most records, and a product with no session date must
 * always stay visible — only an actual, filled-in, past date counts).
 */
export const isPastCalendarDay = (value?: string | null): boolean => {
  const trimmed = value?.trim();
  if (!trimmed) {
    return false;
  }

  // The index stores `startDate` as a plain `YYYY-MM-DD` string and the date input produces the
  // same, so compare as text: it is exact, and it sidesteps the timezone trap in `new Date(...)`,
  // which reads a bare ISO day as UTC midnight. Anyone west of UTC would otherwise see
  // `new Date('2026-07-29')` report its *local* day as the 28th and count today as past.
  if (ISO_DAY.test(trimmed)) {
    return trimmed.slice(0, 10) < todayISODate();
  }

  // Any other format (a full timestamp, a locale string) goes through Date, compared day-to-day so
  // a session earlier today is still "today", not past.
  const parsed = new Date(trimmed);
  if (isNaN(parsed.getTime())) {
    return false;
  }
  const parsedDay = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  const now = new Date();
  return parsedDay < new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

/** The schedule fields an indexed session variant can carry. Same names (and same optionality) the
 *  PDP's commerce-index lookup uses — see `ProductHit` in types/forms.ts — because both read the
 *  very same commercetools-fed Algolia records. */
export type SessionScheduleFields = {
  startDate?: string;
  startTime?: string;
  timeZone?: string;
  timeZoneIana?: { key?: string } | null;
};

/**
 * True when a scheduled session's start moment has already passed.
 *
 * **This mirrors the PDP buy box on purpose.** `formatProductSearchResult` (utils/product-form.ts)
 * keeps a date option only while `isoStart >= now`, building `isoStart` with `getUTCTime` from the
 * start date, the start time and the session's timezone. The listing reuses the *same* `getUTCTime`
 * — not a copy of the arithmetic — so a session can never be listed as available here while the buy
 * box has already dropped its date, which is what happened when this side compared whole calendar
 * days and the PDP compared instants.
 *
 * Two deliberate differences from the PDP's filter, both because the listing's job is different:
 *
 *  1. **No start date means "keep".** `getUTCTime` returns `undefined` without a date, and the PDP
 *     treats that as "drop" — correct for a scheduled product's date picker, but most of the index
 *     carries no `startDate` at all (self-paced, on-demand, bundles, exams), and those must stay
 *     listed. Only an actual, filled-in, elapsed session is hidden.
 *  2. **No start time falls back to whole days.** `getUTCTime` defaults a missing time to midnight,
 *     which would hide a session dated *today* from 00:01 onwards even though nothing says it has
 *     begun. Most dated records have no `startTime` (measured 2026-08-03: 16 of 44), so this matters
 *     far more here than on a PDP whose sessions are the ones that do carry times. Without a time,
 *     the row stays visible for the whole of its start day.
 */
export const hasSessionStarted = (hit?: SessionScheduleFields | null): boolean => {
  const startDate = hit?.startDate?.trim();
  if (!startDate) {
    return false;
  }

  // Nothing to build an instant out of — fall back to the whole-day rule (see difference 2 above).
  if (!hit?.startTime) {
    return isPastCalendarDay(startDate);
  }

  // Exactly how the PDP resolves the zone: the IANA name when the record has one (its keys use
  // underscores, e.g. `America_New_York`), otherwise the short code, which resolveTimezoneOffset
  // maps (ET/PT/CT/…) or parses (`GMT+8`). Measured 2026-08-03: `timeZoneIana` is null on every
  // dated `-b2b` record and `timeZone` holds codes like `ET`, so today this always takes the
  // fallback — it is written this way so it keeps matching the PDP if that ever changes.
  const isoStart = getUTCTime({
    time: hit.startTime,
    date: startDate,
    timeZone: hit.timeZoneIana?.key?.replace(/_/g, '/') || hit.timeZone,
  });

  // Unparseable date/time: don't hide the row on a guess, but still apply the whole-day rule so a
  // plainly elapsed date is not advertised.
  if (!isoStart) {
    return isPastCalendarDay(startDate);
  }

  return isoStart.getTime() < Date.now();
};

/**
 * How many records an Algolia `startDate` facet accounts for whose day is entirely in the past.
 *
 * This is what lets the listing's header total agree with the rows on screen. Algolia computes
 * `nbHits` server-side and so counts the sessions `hasSessionStarted` hides; the facet is refined by
 * exactly the same query, so subtracting its past-day buckets is exact for every day *before*
 * today. Sessions dated today need their start time and are counted separately — see
 * `useB2BPastSessionCount`.
 *
 * Returns `null` when the tally cannot be trusted, in which case the caller must fall back to the
 * raw `nbHits` rather than show a number that is confidently wrong:
 *  * no facet in the response at all (it was not requested, or the response predates the change);
 *  * the value list came back at `maxValuesPerFacet` and is therefore probably truncated. Algolia's
 *    default is **10** and `exhaustiveFacetsCount` does *not* signal this — measured 2026-08-03, it
 *    stays `true` while returning 10 of 156 values, which understated the past count by 186 records.
 */
export const pastDayFacetCount = (
  facet: Record<string, number> | undefined,
  maxValuesPerFacet: number
): { past: number; today: number } | null => {
  if (!facet) {
    return null;
  }

  const values = Object.keys(facet);
  if (values.length >= maxValuesPerFacet) {
    return null;
  }

  const today = todayISODate();
  let past = 0;
  values.forEach((value) => {
    if (value.slice(0, 10) < today) {
      past += facet[value];
    }
  });

  return { past, today: facet[today] ?? 0 };
};
