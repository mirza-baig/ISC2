/* eslint-disable @typescript-eslint/ban-ts-comment */
import NextAuth from 'next-auth';
import SalesforceProvider from 'next-auth/providers/salesforce';

import tokenIntrospection from './tokenIntrospection';
import refreshAccessToken from './refreshAccessToken';

import { engageServer, getUserFlag, getLoggedInUserSalesforceData } from 'utils/index';
import encrypt from 'utils/encrypt';

const extendGuestData = async (profile) => {
  const Authorization = `Basic ${Buffer.from(
    `${process.env.NEXT_PUBLIC_ENGAGE_CLIENT_KEY}:${process.env.NEXT_PUBLIC_ENGAGE_API_TOKEN}`,
    'binary'
  ).toString('base64')}`;

  const headers = { Authorization, Accept: 'application/json', 'Content-Type': 'application/json' };
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_ENGAGE_TARGET_URL}/v2/guests?email=${profile.email}`,
    {
      method: 'GET',
      headers,
    }
  );

  const { items } = await res.json();
  const customAttributes = profile.custom_attributes;
  const sessionObject = { user: profile };

  console.log('CDP post method -', 'guestId>', items, 'userFlag>', getUserFlag(sessionObject));
  console.log('Profile', profile);
  if (items.length) {
    const res = await Promise.all(
      items.map((item) =>
        fetch(`${item.href}/extext`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            key: 'default',
            userFlag: getUserFlag(sessionObject),
            certificationsOfInterest: customAttributes.certofinterest,
            certifications: customAttributes.CertificationList,
          }),
        })
      )
    );
    return res;
  }

  await fetch(`${process.env.NEXT_PUBLIC_ENGAGE_TARGET_URL}/v2/guests`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      guestType: 'customer',
      userFlag: getUserFlag(sessionObject),
      ...profile,
    }),
  });
};

export const authOptions = (req) => ({
  callbacks: {
    async jwt({ token, account, profile, user }) {
      if (user) {
        token.idToken = user.idToken;
      }

      if (account && profile) {
        // Set access and refresh token
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.instanceUrl = account.instance_url;
        token.profile = profile;

        // Get the Expire Date
        const { exp } = await tokenIntrospection(token);
        token.accessTokenExpires = exp;

        return Promise.resolve(token);
      }

      // @ts-ignored
      if (Date.now() < token.accessTokenExpires * 1000) {
        return Promise.resolve(token);
      }

      const refreshedToken = await refreshAccessToken(token);

      return {
        ...refreshedToken,
        profile: token.profile,
      };
    },
    async signIn({ profile }) {
      try {
        const userData = {
          email: profile.email,
          firstName: profile.given_name,
          lastName: profile.family_name,
          phone: profile.custom_attributes?.primaryPhone,
          postalCode: profile.custom_attributes?.zipCode,
          state: profile.custom_attributes?.state,
          street: profile.custom_attributes?.streetAddress,
          custom_attributes: profile.custom_attributes,
        };

        await Promise.all([
          getLoggedInUserSalesforceData({
            externalID: profile.custom_attributes?.user_id,
            email: profile.custom_attributes?.email || profile.custom_attributes?.email_address,
            sync: true,
          }),
          extendGuestData(userData),
          engageServer.identity(
            {
              ...userData,
              channel: 'WEB',
              currency: 'USD',
              language: 'EN',
              identifiers: [{ id: profile.email, provider: 'email' }],
            },
            req
          ),
        ]);

        return true;
      } catch (err) {
        console.error('ERROR while logging in:', err);

        if (process.env.SITECORE_ENVIRONMENT === 'local') {
          return true;
        }
      }
    },
    session: ({ session, token }) => {
      return {
        ...session,
        user: {
          ...session.user,
          ...token.profile,
          accessToken: token.accessToken ? encrypt(token.accessToken) : null,
        },
      };
    },
  },
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === 'production'
          ? '__Secure-next-auth.session-token'
          : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  providers: [
    SalesforceProvider({
      clientId: process.env.SALESFORCE_ID || '',
      clientSecret: process.env.SALESFORCE_SECRET || '',
      wellKnown: process.env.SALESFORCE_AUTHURL
        ? process.env.SALESFORCE_AUTHURL + '/.well-known/openid-configuration'
        : '',
      authorization: { params: { scope: 'openid api refresh_token' } },
      token: process.env.SALESFORCE_AUTHURL
        ? process.env.SALESFORCE_AUTHURL + '/services/oauth2/token'
        : '',
      userinfo: process.env.SALESFORCE_AUTHURL
        ? process.env.SALESFORCE_AUTHURL + '/services/oauth2/userinfo'
        : '',
      idToken: true,
      profile: (profile, tokens) => {
        return {
          id: profile.email,
          email: profile.email,
          idToken: tokens.id_token,
        };
      },
    }),
  ],
});

export default (req, res) => NextAuth(req, res, authOptions(req));
