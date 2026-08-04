import { AUTHORIZATION_TOKEN, REFRESH_TOKEN, APIM_SUBSCRIPTION_KEY } from 'constants/index';

export const config = {
  runtime: 'edge',
};

// This file was created for testing purposes to test Edge Functions on Vercel
const edge = async (req: Request) => {
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
    const response = await fetch(process.env.SERVICE_LAYER_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [AUTHORIZATION_TOKEN]: authorizationToken,
        [REFRESH_TOKEN]: refreshToken,
        [APIM_SUBSCRIPTION_KEY]: apimSubscriptionKey,
      },
      body: JSON.stringify(await req.json()),
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), { status: 200 });
  } catch (err: unknown) {
    if (err instanceof Error) {
      return new Response(err.message, { status: 500 });
    } else if (typeof err === 'string') {
      return new Response(err, { status: 500 });
    } else {
      return new Response('Internal server error', { status: 500 });
    }
  }
};

export default edge;
