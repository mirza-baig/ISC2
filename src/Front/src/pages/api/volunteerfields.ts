import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import { VOLUNTEER_PAGE_FIELDS, VOLUNTEER_PAGE_ROOT } from 'queries/volunteerSettings';
import { postSitecoreGraphQL } from 'utils/sitecoreApiRoute';
import { setAPIRouteHeaders } from 'utils/apiUtils';
import { fromQuery } from 'lib/api/extractors';
import { isUrlPath, stripQueryAndFragment } from 'lib/api/urlPath';
import { validating, type ValidatedHandler } from 'lib/api/validating';
import { wrap } from 'lib/api/wrap';
import { errorCatching } from 'lib/api/errorCatching';

const MAX_PAGEPATH_LENGTH = 200;

/**
 * The caller is OpportunityDetail, which passes `router.asPath` — a leading slash,
 * and sometimes a campaign query string. Both are normalized away before the path
 * is validated against the URL path charset (see lib/api/urlPath.ts).
 *
 * Anchored to the Home subtree: no traversal segments, bounded length, and no
 * quotes or braces. The query document is parameterized regardless.
 */
export const schema = z.object({
  pagepath: z
    .string()
    .min(1)
    .max(MAX_PAGEPATH_LENGTH)
    .transform((value) => stripQueryAndFragment(value).replace(/^\/+/, ''))
    .refine((path) => path.length > 0, 'pagepath is required')
    .refine(isUrlPath, 'pagepath contains characters that are not valid in a url path')
    .refine(
      (path) => !path.split('/').some((segment) => segment === '.' || segment === '..'),
      'pagepath may not traverse outside the Home subtree'
    ),
});

export const handler: ValidatedHandler<z.infer<typeof schema>> = async (input, _req, res) => {
  const result = await postSitecoreGraphQL(VOLUNTEER_PAGE_FIELDS, {
    path: `${VOLUNTEER_PAGE_ROOT}/${input.pagepath}`,
    language: 'en',
  });

  setAPIRouteHeaders(res, 'GET,DELETE,PATCH,POST,PUT');

  return res.status(200).send(result.data);
};

export default wrap(validating({ schema, handler, extractor: fromQuery })).in(
  errorCatching({ label: 'api/volunteerfields' })
) as (req: NextApiRequest, res: NextApiResponse) => Promise<void>;
