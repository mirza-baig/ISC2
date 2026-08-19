/**
 * Raw query-string handling for the B2B PLP.
 *
 * The PLP writes its facet params in readable form (spaces as dashes, legal characters left
 * literal — see `b2bUrlValueEncoder` in SearchWrapper), so anything that rewrites the address bar
 * has to work on the raw `key=value` text. Re-serialising through `URLSearchParams.toString()`
 * would re-encode those params and turn a shareable `?certification=CISSP&region=emea01` into
 * percent-escape noise on the way past.
 */

/**
 * Split a query string into its raw `key=value` segments and keep the ones `keep` accepts, which
 * is given the key lowercased and percent-decoded. Segments are returned **byte for byte** as they
 * appeared.
 */
export const filterRawQueryParts = (
  search: string,
  keep: (lowercaseKey: string) => boolean
): string[] =>
  search
    .replace(/^\?/, '')
    .split('&')
    .filter((part) => {
      if (!part) return false;
      const rawKey = part.split('=')[0];
      let key = rawKey;
      try {
        key = decodeURIComponent(rawKey);
      } catch {
        // A malformed escape can't match a key we know; judge it on its raw form rather than throw.
      }
      return keep(key.toLowerCase());
    });
