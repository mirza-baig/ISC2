import config from 'temp/config';
import { GraphQLRequestClient } from '@sitecore-jss/sitecore-jss-nextjs/graphql';

export const getGraphQLRequestClient = (): GraphQLRequestClient => {
  if (!config.sitecoreApiKey || !config.graphQLEndpoint) {
    console.error('No Sitecore API Key, Sitemap Root ID and/or public URL configured for the site');
    return {} as GraphQLRequestClient;
  }

  return new GraphQLRequestClient(config.graphQLEndpoint, {
    apiKey: config.sitecoreApiKey,
  });
};

/**
 * Executes a GraphQL document against Experience Edge.
 *
 * Caller-supplied values belong in `variables` — never interpolated into `query`.
 * See GraphQL-API-Patterns.md §1.
 */
export const getGraphQLResult = async <T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> => {
  const graphQLClient = getGraphQLRequestClient();

  try {
    const result = await graphQLClient.request<T>(query, variables);

    return result;
  } catch (err) {
    console.log('Error during graphQL request', err);
    return null as T;
  }
};
