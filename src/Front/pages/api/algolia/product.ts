import { NextApiRequest, NextApiResponse } from 'next';
import algoliasearch from 'algoliasearch';

import { setAPIRouteHeaders } from 'utils/index';
import { LineItemAlgoliaData } from 'types/index';

const algoliaIndexName = process.env.ALGOLIA_INDEX_NAME || '';
const algoliaApiKey = process.env.ALGOLIA_API_KEY || '';
const algoliaAppId = process.env.ALGOLIA_APP_ID || '';

const searchClient = algoliasearch(algoliaAppId, algoliaApiKey);
const algoliaIndex = searchClient.initIndex(algoliaIndexName);

export default async function product(req: NextApiRequest, res: NextApiResponse) {
  setAPIRouteHeaders(res, 'GET');

  const { sku } = req.query;

  if (typeof sku !== 'string') {
    return res.status(404).send({ error: `SKU value is not a string` });
  }

  try {
    const product = await algoliaIndex.getObject<LineItemAlgoliaData>(sku);

    return res.status(200).send(product);
  } catch (err) {
    return res.status(404).send({ error: `Product data not found for sku ${sku}` });
  }
}
