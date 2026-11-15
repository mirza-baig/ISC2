import { getToken } from 'next-auth/jwt';

import {
  AUTHORIZATION_TOKEN,
  REFRESH_TOKEN,
  APIM_SUBSCRIPTION_KEY,
  GENERIC_ERROR_MESSAGE,
} from 'constants/index';
import { IDENTITY_SCOPED_QUERIES, SERVICE_LAYER_QUERIES } from 'lib/service-layer-queries';

export const config = {
  runtime: 'edge',
};

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const edge = async (req: Request) => {
  if (process.env.NEXT_PUBLIC_USE_EDGE_FUNCTIONS !== 'true') {
    return json({ message: 'Not found' }, 404);
  }

  const { headers } = req;
  const authorizationToken = headers.get(AUTHORIZATION_TOKEN);
  const refreshToken = headers.get(REFRESH_TOKEN);
  const apimSubscriptionKey = process.env.APIM_SUBSCRIPTION_KEY;

  if (!process.env.SERVICE_LAYER_ENDPOINT) {
    return new Response('Invalid GraphQL endpoint', { status: 500 });
  }

  if (!authorizationToken) {
    return new Response('Missing authorization token', { status: 500 });
  }

  if (!refreshToken) {
    return new Response('Missing refresh token', { status: 500 });
  }

  if (!apimSubscriptionKey) {
    return new Response('Internal server error', { status: 500 });
  }

  try {
    const { query, variables } = await req.json();
    const graphqlQuery = SERVICE_LAYER_QUERIES[query as keyof typeof SERVICE_LAYER_QUERIES];

    if (!graphqlQuery) {
      return json({ message: 'Invalid query' }, 404);
    }

    let forwardedVariables = variables;

    if (IDENTITY_SCOPED_QUERIES.has(query)) {
      const token = await getToken({
        req: req as unknown as Parameters<typeof getToken>[0]['req'],
        secret: process.env.NEXTAUTH_SECRET,
      });
      const attributes = (
        token?.profile as
          | { custom_attributes?: { user_id?: string; email?: string; email_address?: string } }
          | undefined
      )?.custom_attributes;
      const externalId = attributes?.user_id;
      const email = attributes?.email || attributes?.email_address;

      if (!externalId || !email) {
        return json({ message: 'Not authenticated' }, 401);
      }

      forwardedVariables = { ...variables, externalId, email };
    }

    const response = await fetch(process.env.SERVICE_LAYER_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [AUTHORIZATION_TOKEN]: authorizationToken,
        [REFRESH_TOKEN]: refreshToken,
        [APIM_SUBSCRIPTION_KEY]: apimSubscriptionKey,
      },
      body: JSON.stringify({ query: graphqlQuery, variables: forwardedVariables }),
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), { status: 200 });
  } catch (err: unknown) {
    if (err instanceof Error) {
      return new Response(err.message, { status: 500 });
    }

    return new Response(GENERIC_ERROR_MESSAGE, { status: 500 });
  }
};

export default edge;
