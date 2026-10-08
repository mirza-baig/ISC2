import algoliasearch, { type SearchClient } from 'algoliasearch';

/**
 * Algolia credentials, resolved from the environment.
 *
 * Pentest finding H-04: these used to live on a Sitecore item
 * (`/sitecore/content/ISC2/Main/Settings/Algolia Search Settings`) and were published
 * to Experience Edge. Edge serves every published field to anyone holding the public
 * delivery key, so the credential was world-readable — and no amount of hardening on
 * our own API routes could change that. Edge is a CDN, not a vault.
 *
 * There are two tiers, and the distinction is the whole point:
 *
 * `NEXT_PUBLIC_ALGOLIA_APP_ID` / `NEXT_PUBLIC_ALGOLIA_SEARCH_KEY`
 *   A **search-only, index-restricted** key. Next.js inlines it into the client
 *   bundle, which is intended — this is Algolia's documented model for in-browser
 *   search. It must carry the `search` ACL and nothing else. Verify with
 *   `GET https://{appId}.algolia.net/1/keys/{key}` authenticated with the key itself.
 *
 * `ALGOLIA_APP_ID` / `ALGOLIA_API_KEY`
 *   The privileged key. Server-only, and it must never be reachable from a module
 *   that ships to the browser. Used by the `/api/algolia/*` routes.
 *
 * Index *names* stay in Sitecore. They are content, not secrets.
 */

export type PublicAlgoliaCredentials = {
  appId: string;
  searchKey: string;
};

export type ServerAlgoliaCredentials = {
  appId: string;
  apiKey: string;
};

/**
 * The browser-safe pair. Returns null when either half is unset, so callers fail
 * closed (no search client, no results) rather than constructing a client that
 * 403s on every request.
 */
export const getPublicAlgoliaCredentials = (): PublicAlgoliaCredentials | null => {
  const appId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID;
  const searchKey = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY;

  if (!appId || !searchKey) {
    return null;
  }

  return { appId, searchKey };
};

/**
 * The privileged pair. Throws if called from the browser — a bundler that pulls this
 * into client code is a regression of H-04, and a loud failure in dev is how it gets
 * caught before it ships.
 */
export const getServerAlgoliaCredentials = (): ServerAlgoliaCredentials | null => {
  if (typeof window !== 'undefined') {
    throw new Error(
      'getServerAlgoliaCredentials() was called in the browser. The privileged Algolia key must never reach the client — use getPublicAlgoliaCredentials() or an /api/algolia route.'
    );
  }

  const appId = process.env.ALGOLIA_APP_ID;
  const apiKey = process.env.ALGOLIA_API_KEY;

  if (!appId || !apiKey) {
    return null;
  }

  return { appId, apiKey };
};

/**
 * Shared search client built from the public key. Memoized because several
 * components mount at once (the cart and mini-cart both render on /cart) and each
 * `algoliasearch()` call otherwise opens its own connection pool.
 */
let publicSearchClient: SearchClient | null | undefined;

export const createPublicSearchClient = (): SearchClient | null => {
  if (publicSearchClient !== undefined) {
    return publicSearchClient;
  }

  const credentials = getPublicAlgoliaCredentials();
  publicSearchClient = credentials ? algoliasearch(credentials.appId, credentials.searchKey) : null;

  return publicSearchClient;
};
