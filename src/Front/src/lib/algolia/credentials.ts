import algoliasearch, { type SearchClient } from 'algoliasearch';

export type PublicAlgoliaCredentials = {
  appId: string;
  searchKey: string;
};

export type ServerAlgoliaCredentials = {
  appId: string;
  apiKey: string;
};
export const getPublicAlgoliaCredentials = (): PublicAlgoliaCredentials | null => {
  const appId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID;
  const searchKey = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY;

  if (!appId || !searchKey) {
    return null;
  }

  return { appId, searchKey };
};

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

let publicSearchClient: SearchClient | null | undefined;

export const createPublicSearchClient = (): SearchClient | null => {
  if (publicSearchClient !== undefined) {
    return publicSearchClient;
  }

  const credentials = getPublicAlgoliaCredentials();
  publicSearchClient = credentials ? algoliasearch(credentials.appId, credentials.searchKey) : null;

  return publicSearchClient;
};
