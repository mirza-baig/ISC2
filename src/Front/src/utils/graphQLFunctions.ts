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

export const getGraphQLResult = async <T>(query: string): Promise<T> => {
  const graphQLClient = getGraphQLRequestClient();

  try {
    const result = await graphQLClient.request<T>(query);

    return result;
  } catch (err) {
    console.log('Error during graphQL request', err);
    return null as T;
  }
};
