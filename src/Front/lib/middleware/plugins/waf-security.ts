import { NextRequest, NextResponse } from 'next/server';
import { MiddlewarePlugin } from '..';

class WAFSecurityPlugin implements MiddlewarePlugin {
  order = 10;

  /**
   * exec async method - to find coincidence in url.pathname and redirects of site
   * @param req<NextRequest>
   * @returns Promise<NextResponse>
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async exec(req: NextRequest, res: NextResponse): Promise<NextResponse> {
    //console.log('Inside WAF Security');
    const enableVercelAuth = process.env.ENABLE_VERCELAUTH;
    let enableVercelAuthValue = false;
    if (enableVercelAuth) {
      enableVercelAuthValue = enableVercelAuth.toLowerCase() === 'true';
      if (enableVercelAuthValue) {
        //console.log('vercel security enabled');
        const vercelAuthHeaderValue = req.headers.get('vercelauth');
        if (!(vercelAuthHeaderValue === process.env.VERCELAUTH_VALUE)) {
          const url = req.nextUrl.clone();
          url.pathname = '/notauthorized';
          console.log('redirecting to not authorized' + url);
          return NextResponse.rewrite(url);
        }
      }
    }
    return res;
  }
}

export const wafSecurityPlugin = new WAFSecurityPlugin();
