import axios from 'axios';
import qs from 'qs';

import { Tokens } from 'src/types';

/**
 * Method to check the token expire date by calling the
 * Salesforce End point fot Token Introspection.
 * @param tokens
 */
export default async function tokenIntrospection(tokens: Tokens) {
  try {
    const data = qs.stringify({
      token: tokens.accessToken,
      token_type_hint: 'access_token',
      client_id: process.env.SALESFORCE_ID,
      client_secret: process.env.SALESFORCE_SECRET,
    });

    const tokenResponse = await axios({
      method: 'post',
      url: `${process.env.SALESFORCE_AUTHURL}/services/oauth2/introspect`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      data,
    });

    return await tokenResponse.data;
  } catch (error) {
    return {
      error: 'TokenIntrospectionError',
    };
  }
}
