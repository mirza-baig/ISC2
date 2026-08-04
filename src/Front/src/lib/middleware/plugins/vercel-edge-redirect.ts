import { NextRequest, NextResponse } from 'next/server';
import { get, has } from '@vercel/edge-config';
import { MiddlewarePlugin } from '..';

class VercelEdgeRedirectPlugin implements MiddlewarePlugin {
  order = 9;
  async exec(req: NextRequest, res: NextResponse): Promise<NextResponse> {
    try {
      const pathname = req.nextUrl.pathname.replaceAll('/', '__').toLowerCase();
      //   const startTimestamp = Date.now();
      console.log('PathName-' + pathname);
      if (process.env.EDGE_CONFIG && process.env.EDGE_CONFIG != '') {
        if (await has(pathname)) {
          const redirect = await get(pathname);
          if (redirect != undefined) {
            const redirectVal = redirect?.toString();
            console.log('Found Redirect for ' + pathname + ' Value is ' + redirectVal);
            const url = req.nextUrl.clone();
            const absoluteUrlRegex = new RegExp('^(?:[a-z]+:)?//', 'i');

            if (absoluteUrlRegex.test(redirectVal)) {
              url.href = redirectVal;
              url.locale = req.nextUrl.locale;
            } else {
              url.pathname = redirectVal.replace(/^\/\//, '/');
            }
            const redirectUrl = decodeURIComponent(url.href);
            console.log('Redirect to ' + redirectUrl);
            return NextResponse.redirect(redirectUrl, 301);
          }
        }
      } else {
        console.log('Vercel edge redirect disabled. Path is ' + pathname);
      }

      return res || NextResponse.next();
    } catch (error) {
      console.log('Vercel Edge Redirect middleware failed:');
      console.log(error);
      return res || NextResponse.next();
    }
  }
}

export const vercelEdgeRedirectPlugin = new VercelEdgeRedirectPlugin();
