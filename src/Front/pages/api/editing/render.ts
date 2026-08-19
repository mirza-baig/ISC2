import { EditingRenderMiddleware } from '@sitecore-jss/sitecore-jss-nextjs/editing';
import { NextApiRequest } from 'next';

/**
 * This Next.js API route is used to handle GET and POST requests from Sitecore editors.
 * GET requests are used with Metadata editing mode while POST ones are used with Chromes(legacy) mode.
 * This route should match the `serverSideRenderingEngineEndpointUrl` in your Sitecore configuration,
 * which is set to "http://<rendering_host>/api/editing/render" by default (see the settings item under /sitecore/content/<your/site/path>/Settings/Site Grouping).
 *
 * For Metadata mode, the `EditingRenderMiddleware` will
 *  1. Extract data about the route we need to rendr from the Sitecore editor GET request
 *  2. Enable Next.js Preview Mode, passing the route data as preview data
 *  3. Redirect the request to the route, passing along the Preview Mode cookies.
 *     This allows retrieval of the editing data in preview context (via an `EditingDataService`) - see `SitecorePagePropsFactory`
 *  4. The redirected request will render the page with editing markup in place
 *
 * For Chromes(legacy) mode, the `EditingRenderMiddleware` will
 *  1. Extract editing data from the Sitecore editor POST request
 *  2. Stash this data (for later use in the page render request) via an `EditingDataService`, which returns a key for retrieval
 *  3. Enable Next.js Preview Mode, passing our stashed editing data key as preview data
 *  4. Invoke the actual page render request, passing along the Preview Mode cookies.
 *     This allows retrieval of the editing data in preview context (via an `EditingDataService`) - see `SitecorePagePropsFactory`
 *  5. Return the rendered page HTML to the Sitecore editor
 *
 */

/**
 * [Chromes mode only] For Vercel deployments:
 * if you experience crashes in editing, you may need to use VercelEditingDataCache or a custom Redis data cache implementation with EditingRenderMiddleware
 * Please refer to documentation for a detailed guide.
 */

// [Chromes mode only] Bump body size limit (1mb by default) and disable response limit for Sitecore editor payloads
// See https://nextjs.org/docs/api-routes/request-helpers#custom-config
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '20mb',
    },
    responseLimit: false,
  },
};

// Wire up the EditingRenderMiddleware handler
// When hosting your Next.js JSS application on a platform other than Vercel, the integration with Experience Editor stops working because of a protocol mismatch error.
// Ref: https://doc.sitecore.com/xp/en/developers/hd/latest/sitecore-headless-development/override-default-protocols-using-the-editingrendermiddleware-in-next-js-jss-apps.html
const LOCALHOST_REGEXP = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i;

const handler = new EditingRenderMiddleware({
  resolveServerUrl: (req: NextApiRequest) => {
    const host = req.headers.host || '';
    const protocol = LOCALHOST_REGEXP.test(host) ? 'http' : 'https';
    return `${protocol}://${host}`;
  },
}).getHandler();

export default handler;
