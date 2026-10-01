import { NextApiRequest, NextApiResponse } from 'next';

import { getExternalMulesoftOrderFilesUrl } from 'constants/urls';
import { setAPIRouteHeaders, validateApiRequest } from 'utils/index';

/** Mule has no documented cap on file count yet; 10 per request is the agreed start. */
const MAX_FILES_PER_REQUEST = 10;

const ORDER_NUMBER_PATTERN = /^\d+$/;

// Files arrive base64-encoded (~4/3 of their raw size), so this allows ~15 MB of files.
// Mule itself rejects anything over 100 MB.
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '20mb',
    },
  },
};

type OrderFile = { filename: string; data: string };

const isOrderFile = (value: unknown): value is OrderFile =>
  typeof (value as OrderFile)?.filename === 'string' &&
  (value as OrderFile).filename.trim() !== '' &&
  typeof (value as OrderFile)?.data === 'string' &&
  (value as OrderFile).data !== '';

/**
 * Attaches files (the business buyer's PO attachment) to a placed commercetools order.
 * Mule stores them against the matching Salesforce order and answers 200 with no body.
 */
export default async function uploadOrderFiles(req: NextApiRequest, res: NextApiResponse) {
  setAPIRouteHeaders(res, 'POST', req);

  if (req.method !== 'POST') {
    return res.status(405).send({ error: 'Method not allowed' });
  }

  const identity = await validateApiRequest(req, res);
  if (!identity) return;

  const { orderNumber, files } = req.body ?? {};

  if (typeof orderNumber !== 'string' || !ORDER_NUMBER_PATTERN.test(orderNumber)) {
    return res.status(400).send({ error: 'A valid orderNumber is required' });
  }

  if (
    !Array.isArray(files) ||
    !files.length ||
    files.length > MAX_FILES_PER_REQUEST ||
    !files.every(isOrderFile)
  ) {
    return res
      .status(400)
      .send({ error: `files must be 1-${MAX_FILES_PER_REQUEST} items of { filename, data }` });
  }

  try {
    const response = await fetch(getExternalMulesoftOrderFilesUrl(orderNumber), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        client_id: process.env.SALESFORCE_CLOUDHUB_ID ?? '',
        client_secret: process.env.SALESFORCE_CLOUDHUB_SECRET ?? '',
      },
      body: JSON.stringify(
        files.map(({ filename, data }: OrderFile) => ({ filename: filename.trim(), data }))
      ),
    });

    if (!response.ok) {
      // Mule's 4xx/500 bodies are `{ error, description }`; pass them through when present.
      const errorBody = await response.json().catch(() => null);
      console.error('[uploadOrderFiles] Mule rejected the upload', {
        orderNumber,
        status: response.status,
        errorBody,
      });

      return res
        .status(response.status)
        .send(errorBody ?? { error: `Request failed with status ${response.status}` });
    }

    return res.status(200).json({});
  } catch (error) {
    console.error('[uploadOrderFiles] Upload request failed', { orderNumber, error });
    return res.status(500).send({ error: 'Files could not be uploaded.' });
  }
}
