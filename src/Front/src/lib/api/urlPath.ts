/**
 * The characters RFC 3986 allows in a URL path segment (`pchar`), plus `/`.
 *
 * Deliberately permissive. The injection fix for pentest finding #4 is the
 * parameterized query document — request values travel in the variables bag and are
 * never part of the document. This guard is defense in depth on top of that, so it
 * only needs to exclude the characters that could matter if a query is ever
 * mis-written again: quotes, braces, angle brackets, backslash, backtick, and
 * whitespace/control characters.
 *
 * Being strict here is actively harmful. `/api/middlewareFields` feeds
 * AccessControlPlugin, which treats ANY non-ok response as "no roles required" —
 * i.e. public. A false rejection of a legitimate URL would silently de-protect a
 * members-only page, which is a worse outcome than the input it would be blocking.
 */
export const URL_PATH_PATTERN = /^[A-Za-z0-9\-._~%!$&'()*+,;=:@/]*$/;

export const isUrlPath = (value: string): boolean => URL_PATH_PATTERN.test(value);

/** Drops a query string and/or fragment, so campaign links resolve to the page path. */
export const stripQueryAndFragment = (value: string): string => value.split('#')[0].split('?')[0];

/**
 * A single Sitecore item name: the same characters as a URL path, minus the `/`
 * separator, plus spaces (item names like "2025 Board Election" are routine).
 *
 * Excluding `/` is what keeps a key inside its parent folder — there is no way to
 * express a traversal without it. Kept permissive for the same reason as
 * URL_PATH_PATTERN: over-tight validation here would reject legitimate election
 * names like "Board & Committee Election (2025)" and block members from voting.
 */
export const ITEM_NAME_PATTERN = /^[A-Za-z0-9\-._~%!$&'()*+,;=:@ ]+$/;

export const isItemName = (value: string): boolean =>
  ITEM_NAME_PATTERN.test(value) && value !== '.' && value !== '..';
