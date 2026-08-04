import { getToken } from 'next-auth/jwt';


export default async function federatedSignOut(req, res) {
  const baseUrl = req.headers.referer;
  const SALESFORCE_FEDERATED_AUTHURL = process.env.SALESFORCE_AUTHURL;  
  try {
    // We need to grab the session to get at the id token
    //const session = await getServerSession(req, res, authOptions);
    const token = await getToken({req});

    if (!token) {
      // If the user isn't logged in, just redirect to root      
      return res.redirect(baseUrl);
    }
    console.log(token);
    const endSessionParams = new URLSearchParams({
      // Pass the original id tok the to the provider
      id_token_hint: token.idToken,
      // Pass the redirect url
      post_logout_redirect_uri: `${baseUrl}/logout`,
    });
    //console.log(`${SALESFORCE_FEDERATED_AUTHURL}/services/auth/idp/oidc/logout?${endSessionParams.toString()}`);
    return res.redirect(`${SALESFORCE_FEDERATED_AUTHURL}/services/auth/idp/oidc/logout?${endSessionParams.toString()}`);
  } catch (error) {
    res.redirect(baseUrl);
  }
}
