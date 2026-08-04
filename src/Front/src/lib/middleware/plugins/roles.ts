import { NextRequest, NextResponse } from 'next/server';
import { MiddlewarePlugin } from '..';
import { getToken } from 'next-auth/jwt';

import { getUserFlag } from 'utils/userRoles';
import { UserSession } from 'types/index';
import { USER_ROLES } from 'constants/index';

const memberUrl = process.env.MEMBER_PROTECTED_URL;
const candidateUrl = process.env.CANDIDATE_PROTECTED_URL;

class RolesPlugin implements MiddlewarePlugin {
  order = 0;

  redirectToSignIn(req: NextRequest) {
    const { basePath, origin, pathname, search } = req.nextUrl;
    const signInUrl = new URL(`${basePath}/protected-page`, origin);

    signInUrl.searchParams.append('callbackUrl', `${basePath}${pathname}${search}`);

    return NextResponse.redirect(signInUrl);
  }

  /**
   * exec async method - validates that the user's role has permission to access the requested page
   * @param req<NextRequest>
   * @returns Promise<NextResponse>
   */
  async exec(req: NextRequest): Promise<NextResponse> {
    const res = NextResponse.next();

    if (!memberUrl && !candidateUrl) {
      return res;
    }

    const redirectURL = new URL(process.env.PROTECTED_URL_REDIRECT || '/', req.url);
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const userFlag = getUserFlag({ user: token } as UserSession);

    if (req.url.includes(memberUrl!)) {
      if (!token) {
        return this.redirectToSignIn(req);
      }

      if (userFlag !== USER_ROLES.MEMBER) {
        return NextResponse.redirect(redirectURL);
      }
    }

    if (req.url.includes(candidateUrl!)) {
      if (!token) {
        return this.redirectToSignIn(req);
      }

      // if (userFlag !== USER_ROLES.CANDIDATE) {
      //   return NextResponse.redirect(redirectURL);
      // }
    }

    return res;
  }
}

export const rolesPlugin = new RolesPlugin();
