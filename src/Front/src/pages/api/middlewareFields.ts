import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import { MIDDLEWARE_LAYOUT_FIELDS, MIDDLEWARE_LAYOUT_SITE } from 'queries/searchSettings';
import { postSitecoreGraphQL } from 'utils/sitecoreApiRoute';
import { setAPIRouteHeaders } from 'utils/apiUtils';
import { fromQuery } from 'lib/api/extractors';
import { isUrlPath } from 'lib/api/urlPath';
import { validating, type ValidatedHandler } from 'lib/api/validating';
import { wrap } from 'lib/api/wrap';
import { errorCatching } from 'lib/api/errorCatching';

const MAX_ROUTE_PATH_LENGTH = 400;
export const schema = z.object({
  page: z
    .string()
    .min(1)
    .max(MAX_ROUTE_PATH_LENGTH)
    .startsWith('/', 'page must be a url path')
    .refine(isUrlPath, 'page contains characters that are not valid in a url path'),
});

export const handler: ValidatedHandler<z.infer<typeof schema>> = async (input, _req, res) => {
  const result = await postSitecoreGraphQL(MIDDLEWARE_LAYOUT_FIELDS, {
    site: MIDDLEWARE_LAYOUT_SITE,
    routePath: input.page,
    language: 'en',
  });

  setAPIRouteHeaders(res, 'GET,DELETE,PATCH,POST,PUT');

  const maxAge = process.env.MIDDLEWARE_FIELDS_CACHE_MAX_AGE || '300';
  const swr = process.env.MIDDLEWARE_FIELDS_CACHE_SWR || '600';
  res.setHeader('Cache-Control', `public, s-maxage=${maxAge}, stale-while-revalidate=${swr}`);

  return res.status(200).send(result.data);
};

export default wrap(validating({ schema, handler, extractor: fromQuery })).in(
  errorCatching({ label: 'api/middlewareFields' })
) as (req: NextApiRequest, res: NextApiResponse) => Promise<void>;
