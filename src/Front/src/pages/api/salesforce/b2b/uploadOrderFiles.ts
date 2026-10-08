import { NextApiRequest, NextApiResponse } from 'next';

import { getExternalMulesoftOrderFilesUrl } from 'constants/urls';
import { setAPIRouteHeaders, validateApiRequest } from 'utils/index';

const MAX_FILES_PER_REQUEST = 10;

const ORDER_NUMBER_PATTERN = /^\d+$/;

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

export default async function uploadOrderFiles(req: NextApiRequest, res: NextApiResponse) {
  setAPIRouteHeaders(res, 'POST', req);

  if (req.method !== 'POST') {
    return res.status(405).send({ error: 'Method not allowed' });
  }

  let orderNumber: string | undefined;
  let muleUrl: string | undefined;

  try {
    const identity = await validateApiRequest(req, res);
    if (!identity) return;

    const { externalID, email } = req.query ?? {};

    if (typeof externalID !== 'string' || !externalID || typeof email !== 'string' || !email) {
      console.error('[uploadOrderFiles] Missing externalID or email query params', {
        hasExternalID: Boolean(externalID),
        hasEmail: Boolean(email),
      });
      return res.status(400).send({ error: 'externalID and email query params are required.' });
    }

    ({ orderNumber } = req.body ?? {});
    const { files } = req.body ?? {};

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

    muleUrl = getExternalMulesoftOrderFilesUrl(orderNumber, externalID, email);

    if (!process.env.SALESFORCE_CLOUDHUB_URL) {
      console.error('[uploadOrderFiles] SALESFORCE_CLOUDHUB_URL is not set', { muleUrl });
      return res.status(500).send({ error: 'Mule endpoint is not configured.' });
    }
    const response = await fetch(muleUrl, {
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

    const rawBody = await response.text().catch(() => '');

    const muleResponseLog = {
      orderNumber,
      url: muleUrl,
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type'),
      correlationId:
        response.headers.get('x-correlation-id') || response.headers.get('x-request-id'),
      files: files.map(({ filename, data }: OrderFile) => ({
        filename,
        base64Length: data.length,
      })),
      rawBody,
    };

    if (!response.ok) {
      console.error('[uploadOrderFiles] Mule rejected the upload', muleResponseLog);

      let errorBody = null;
      try {
        errorBody = rawBody ? JSON.parse(rawBody) : null;
      } catch {
        errorBody = null;
      }

      return res
        .status(response.status)
        .send(errorBody ?? { error: `Request failed with status ${response.status}` });
    }

    console.info('[uploadOrderFiles] Mule accepted the upload', muleResponseLog);

    return res.status(200).json({});
  } catch (error) {
    console.error('[uploadOrderFiles] Upload request failed', { orderNumber, url: muleUrl, error });
    return res.status(500).send({ error: 'Files could not be uploaded.' });
  }
}
