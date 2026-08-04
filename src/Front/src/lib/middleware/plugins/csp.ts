import { NextRequest, NextResponse } from 'next/server';
import { MiddlewarePlugin } from '..';
import config from 'temp/config';

interface CSPResponse {
  data: {
    item: {
      field: {
        value: string;
      };
    };
  };
}

interface CSPCache {
  csp: string | null;
  lastFetch: number;
}

class CSPPlugin implements MiddlewarePlugin {
  order = 1;

  private cache: CSPCache = {
    csp: null,
    lastFetch: 0,
  };
  private readonly cacheDuration = 5 * 60 * 1000;

  private readonly CSP_QUERY = `
    query GetCSPField {
      item(path: "/sitecore/content/ISC2/Main/Settings", language: "en") {
        id
        name
        path
        field(name: "CSP") {
          name
          value
        }
      }
    }
  `;

  private parseCSPArray(arrayString: string): string[] | null {
    try {
      const cleaned = arrayString.trim();
      if (!cleaned.startsWith('[') || !cleaned.endsWith(']')) {
        console.error('CSP Plugin: Invalid array format');
        return null;
      }

      const content = cleaned.slice(1, -1);
      const items = content
        .split(',')
        .map((item) => item.trim())
        .filter((item) => {
          return item.startsWith('"') && item.endsWith('"') && item.length > 2;
        })
        .map((item) => {
          return item.slice(1, -1);
        })
        .filter((item) => {
          return !item.startsWith('//') && item.length > 0;
        })
        .map((item) => {
          if (item.startsWith("'") && item.endsWith("'") && item.length > 2) {
            return `'${item.slice(1, -1)}'`;
          }
          return item;
        })
        .filter((item) => item.length > 0);

      return items;
    } catch (error) {
      console.error('CSP Plugin: Error parsing CSP array:', error);
      return null;
    }
  }

  private async fetchCSPFromSitecore(): Promise<string | null> {
    try {
      console.log('CSP Plugin: Fetching CSP configuration...');

      const response = await fetch(config.graphQLEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          sc_apikey: config.sitecoreApiKey,
        },
        body: JSON.stringify({
          query: this.CSP_QUERY,
        }),
      });

      if (!response.ok) {
        console.error('CSP Plugin: GraphQL request failed with status:', response.status);
        return null;
      }

      const data: CSPResponse = await response.json();
      console.log('CSP Plugin: GraphQL response received');

      if (data?.data?.item?.field?.value) {
        console.log('CSP Plugin: CSP field value found');

        const cspArray = this.parseCSPArray(data.data.item.field.value);
        if (!cspArray) {
          console.error('CSP Plugin: Failed to parse CSP array');
          return null;
        }

        const cspString = cspArray.join(' ');
        return cspString;
      }

      console.log('CSP Plugin: No CSP field value found in response');
      return null;
    } catch (error) {
      console.error('CSP Plugin: Error fetching CSP from Sitecore:', error);
      return null;
    }
  }

  private async getCSP(): Promise<string | null> {
    const now = Date.now();

    if (this.cache.csp && now - this.cache.lastFetch < this.cacheDuration) {
      console.log('CSP Plugin: Using cached CSP');
      return this.cache.csp;
    }

    console.log('CSP Plugin: Cache miss, fetching fresh CSP');
    const csp = await this.fetchCSPFromSitecore();

    if (csp) {
      console.log('CSP Plugin: CSP fetched successfully, updating cache');
      this.cache.csp = csp;
      this.cache.lastFetch = now;
    } else {
      console.log('CSP Plugin: Failed to fetch CSP');
    }

    return csp;
  }

  async exec(req: NextRequest, res: NextResponse): Promise<NextResponse> {
    console.log('CSP Plugin: Processing request');

    const csp = await this.getCSP();

    if (csp) {
      console.log('CSP Plugin: Applying CSP header');
      const finalCSP = csp.replace(/\s{2,}/g, ' ').trim();
      res.headers.set('Content-Security-Policy', finalCSP);
    } else {
      console.log('CSP Plugin: No CSP to apply');
    }

    res.headers.set('X-Frame-Options', 'SAMEORIGIN');
    res.headers.set('X-Content-Type-Options', 'nosniff');
    res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.headers.set('Cross-Origin-Embedder-Policy', 'unsafe-none');
    res.headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    res.headers.set('Cross-Origin-Resource-Policy', 'cross-origin');
    res.headers.set(
      'Permissions-Policy',
      'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()'
    );
    console.log('CSP Plugin: Applied additional security headers');

    const pathname = req.nextUrl.pathname;
    if (
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/salesforce/') ||
      pathname.startsWith('/api/auth/session/')
    ) {
      console.log('CSP Plugin: Applying CORS headers');
      const origin = req.headers.get('origin') || '';
      const allowedOrigin = process.env.PUBLIC_URL || '';

      res.headers.set('Access-Control-Allow-Credentials', 'true');
      res.headers.set(
        'Access-Control-Allow-Origin',
        origin && origin === allowedOrigin ? allowedOrigin : ''
      );
      res.headers.set('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
      res.headers.set(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
      );
    }

    console.log('CSP Plugin: Request processing complete');
    return res;
  }
}

export const cspPlugin = new CSPPlugin();
