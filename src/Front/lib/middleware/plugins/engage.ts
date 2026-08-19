import { NextRequest, NextResponse } from 'next/server';
import { MiddlewarePlugin } from '..';
import { IMiddlewareRequest } from '@sitecore/engage/types/lib/utils/interfaces';

import { engageServer } from 'utils/engage';

class SitecoreEngagePlugin implements MiddlewarePlugin {
  order = 30;

  /**
   * @param req<NextRequest>
   * @returns Promise<NextResponse>
   */
  async exec(req: NextRequest, res: NextResponse): Promise<NextResponse> {
    try {
      await engageServer.handleCookie(req, res as IMiddlewareRequest);
    } catch (error) {
      console.error('Error:', error);
    }

    return res;
  }
}

export const engagePlugin = new SitecoreEngagePlugin();
