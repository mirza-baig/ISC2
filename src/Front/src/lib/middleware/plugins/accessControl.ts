import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import { MiddlewarePlugin } from '..';

import { getIsUserB2bAdmin, getUserFlag } from 'utils/userRoles';
import { UserRole, UserSession } from 'types/index';
import { USER_ROLES } from 'constants/index';

interface LayoutFields {
  membersOnly: { value: string };
  candidateOnly: { value: string };
  nonMemberOnly: { value: string };
  b2bAdminOnly: { value: string };
  associateOnly: { value: string };
}

interface ApiResponse {
  data: {
    layout: {
      item: LayoutFields | null;
    };
  };
}

interface FetchError extends Error {
  response?: Response;
}

const NOT_AUTH_PATH = new URL('/unauthorized-access', process.env.REAL_PUBLIC_URL);

const PROTECTED_PATH = (path: string) =>
  new URL(`/protected-page?callbackUrl=${path}`, process.env.NEXTAUTH_URL_INTERNAL);

const DEFAULT_RESPONSE: LayoutFields = {
  membersOnly: {
    value: '',
  },
  candidateOnly: {
    value: '',
  },
  associateOnly: {
    value: '',
  },
  b2bAdminOnly: {
    value: '',
  },
  nonMemberOnly: {
    value: '',
  },
};

class AccessControlPlugin implements MiddlewarePlugin {
  order = 1;

  private isFetchError(error: unknown): error is FetchError {
    return (error as FetchError).response !== undefined;
  }

  private async fetchPageFields(req: NextRequest): Promise<LayoutFields | null> {
    const urlPath = req.nextUrl.pathname;

    const domain = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.PUBLIC_URL;

    try {
      if (!process.env.VERCEL_AUTOMATION_BYPASS_SECRET) {
        console.error('Vercel Protection Bypass for Automation must be enabled');
        return DEFAULT_RESPONSE;
      }

      const response = await fetch(`${domain}/api/middlewareFields?page=${urlPath}`, {
        headers: {
          'Content-Type': 'application/json',
          'x-vercel-protection-bypass': process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
        },
      });

      if (!response.ok) {
        return DEFAULT_RESPONSE;
      }

      const data: ApiResponse = await response.json();

      if (data.data.layout === null || data.data.layout.item === null) {
        return DEFAULT_RESPONSE;
      }

      return data.data.layout.item;
    } catch (error: unknown) {
      if (this.isFetchError(error)) {
        console.error('Error during fetch operation:', error.message, error.response?.statusText);
      } else if (error instanceof Error) {
        console.error('Error during fetch operation:', error.message);
      } else {
        console.error('Error during fetch operation:', error);
      }

      return DEFAULT_RESPONSE;
    }
  }

  private redirectToSignIn(req: NextRequest) {
    return NextResponse.redirect(PROTECTED_PATH(req.nextUrl.href));
  }

  private redirectToNotAuthorized() {
    return NextResponse.redirect(NOT_AUTH_PATH);
  }

  private getRolesForPage(pageFields: LayoutFields | null): UserRole[] {
    const roles = [] as UserRole[];

    if (!pageFields) {
      return [];
    }

    if (pageFields.nonMemberOnly.value === '1') {
      roles.push(USER_ROLES.REGISTERED);
    }

    if (pageFields.membersOnly.value === '1') {
      roles.push(USER_ROLES.MEMBER);
    }

    if (pageFields.candidateOnly.value === '1') {
      roles.push(USER_ROLES.CANDIDATE);
    }

    if (pageFields.associateOnly.value === '1') {
      roles.push(USER_ROLES.ASSOCIATE);
    }

    if (pageFields.b2bAdminOnly?.value === '1') {
      roles.push(USER_ROLES.B2B_ADMIN);
    }

    return roles;
  }

  public async exec(
    req: NextRequest,
    res: NextResponse = NextResponse.next()
  ): Promise<NextResponse> {
    const candidateParam = req.nextUrl.searchParams.get('Candidate');
    if (candidateParam === 'true') {
      const url = req.nextUrl.clone();
      url.searchParams.delete('Candidate');
      return NextResponse.redirect(PROTECTED_PATH(url.href));
    }

    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    const isEmailChangedPath = req.nextUrl.pathname.endsWith('/email-changed');
    if (isEmailChangedPath && token) {
      const basePath = req.nextUrl.pathname.replace('/email-changed', '');
      const profileUrl = new URL(`${basePath}/Profile`, req.nextUrl.origin);
      return NextResponse.redirect(PROTECTED_PATH(profileUrl.href));
    }

    const pageFields = await this.fetchPageFields(req);
    const rolesForPage = this.getRolesForPage(pageFields);

    if (!rolesForPage.length || process.env.NODE_ENV === 'development') {
      return res;
    }

    if (!token) {
      return this.redirectToSignIn(req);
    }

    const userFlag = getUserFlag({ user: token.profile } as UserSession);
    const userIsB2BAdmin = getIsUserB2bAdmin({ user: token.profile } as UserSession);

    if (userIsB2BAdmin) {
      if (!rolesForPage.includes(USER_ROLES.B2B_ADMIN) && !rolesForPage.includes(userFlag)) {
        return this.redirectToNotAuthorized();
      }
    } else if (!rolesForPage.includes(userFlag)) {
      return this.redirectToNotAuthorized();
    }

    return res;
  }
}

export const accessControlPlugin = new AccessControlPlugin();
