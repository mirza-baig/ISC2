import { getToken } from 'next-auth/jwt';

function getBaseUrl(req) {
  const referer = req.headers.referer || req.headers.referrer;

  if (referer) {
    try {
      return new URL(referer).origin;
    } catch {
      // Fall through to host headers.
    }
  }

  if (process.env.NEXTAUTH_URL) {
    try {
      return new URL(process.env.NEXTAUTH_URL).origin;
    } catch {
      // Fall through to host headers.
    }
  }

  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;

  return `${proto}://${host}`;
}

function buildExpiredCookie(name) {
  const isHost = name.startsWith('__Host-');
  const isSecure = isHost || name.startsWith('__Secure-') || process.env.NODE_ENV === 'production';

  return [
    `${name}=`,
    'Path=/',
    'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
    'Max-Age=0',
    'HttpOnly',
    'SameSite=Lax',
    isSecure ? 'Secure' : '',
  ]
    .filter(Boolean)
    .join('; ');
}

/**
 * Clear NextAuth session cookies before IdP logout so the app session cannot
 * survive a failed/skipped Salesforce redirect.
 */
function clearNextAuthCookies(req, res) {
  const requestCookieNames = Object.keys(req.cookies || {}).filter((name) =>
    name.includes('next-auth')
  );

  const knownNames = [
    'next-auth.session-token',
    '__Secure-next-auth.session-token',
    'next-auth.callback-url',
    '__Secure-next-auth.callback-url',
    'next-auth.csrf-token',
    '__Host-next-auth.csrf-token',
    '__Secure-next-auth.csrf-token',
    'next-auth.pkce.code_verifier',
    '__Secure-next-auth.pkce.code_verifier',
    'next-auth.state',
    '__Secure-next-auth.state',
  ];

  const namesToExpire = new Set([...requestCookieNames, ...knownNames]);
  const expired = [];

  namesToExpire.forEach((name) => {
    expired.push(buildExpiredCookie(name));

    // NextAuth may chunk large JWTs across .0 / .1 / ... cookies.
    for (let i = 0; i < 5; i += 1) {
      expired.push(buildExpiredCookie(`${name}.${i}`));
    }
  });

  res.setHeader('Set-Cookie', expired);
}

export default async function federatedSignOut(req, res) {
  const baseUrl = getBaseUrl(req);
  const logoutUrl = `${baseUrl}/logout`;
  const SALESFORCE_FEDERATED_AUTHURL = process.env.SALESFORCE_AUTHURL;

  try {
    // Read token before clearing cookies — needed for IdP id_token_hint.
    const token = await getToken({ req });

    clearNextAuthCookies(req, res);

    if (!token || !SALESFORCE_FEDERATED_AUTHURL) {
      return res.redirect(logoutUrl);
    }

    const endSessionParams = new URLSearchParams({
      post_logout_redirect_uri: logoutUrl,
    });

    if (token.idToken) {
      endSessionParams.set('id_token_hint', token.idToken);
    }

    return res.redirect(
      `${SALESFORCE_FEDERATED_AUTHURL}/services/auth/idp/oidc/logout?${endSessionParams.toString()}`
    );
  } catch (error) {
    clearNextAuthCookies(req, res);
    res.redirect(logoutUrl);
  }
}
