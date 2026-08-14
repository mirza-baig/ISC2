import axios from 'axios';
import qs from 'qs';

import { Tokens } from 'src/types';

import tokenIntrospection from './tokenIntrospection';

/**
 * Consume token object and returns a new updated `accessToken`.
 * @param tokens
 */
export default async function refreshAccessToken(tokens: Tokens) {
  try {
    const data = qs.stringify({
      grant_type: 'refresh_token',
      client_id: process.env.SALESFORCE_ID,
      client_secret: process.env.SALESFORCE_SECRET,
      refresh_token: tokens.refreshToken,
    });

    const tokenResponse = await axios({
      method: 'post',
      url: `${process.env.SALESFORCE_AUTHURL}/services/oauth2/token`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data,
    });

    const { access_token, refresh_token, instance_url } = await tokenResponse.data;

    // Get expire date from token introspection end point.
    tokens.accessToken = access_token;
    const { exp } = await tokenIntrospection(tokens);

    return {
      ...tokens,
      accessToken: access_token,
      refreshToken: refresh_token ?? tokens.refreshToken,
      accessTokenExpires: exp,
      instanceUrl: instance_url,
    };
  } catch (error) {
    return {
      ...tokens,
      error: 'RefreshAccessTokenError',
    };
  }
}
