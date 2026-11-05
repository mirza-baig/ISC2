import { NextApiRequest, NextApiResponse } from 'next';
import type { AuthOptions } from 'next-auth';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { setAPIRouteHeaders } from 'utils/apiUtils';
import config from 'temp/config';

interface SessionUser {
  custom_attributes?: {
    user_id?: string;
    memberFlag?: string;
    associateFlag?: string;
    email?: string;
    email_address?: string;
  };
}

const validateUserRole = (session: { user: SessionUser }): boolean => {
  const customAttrs = session.user?.custom_attributes;

  if (!customAttrs) {
    return false;
  }

  const isMember = customAttrs.memberFlag === 'true';
  const isAssociate = customAttrs.associateFlag === 'true';

  return isMember || isAssociate;
};

const getMediaItemByGuid = async (guid: string): Promise<{ name: string; path: string } | null> => {
  const graphQLEndpoint = config.graphQLEndpoint;

  const apiKey = process.env.SITECORE_API_KEY;

  const query = `
    query {
      item(path: "{${guid.toUpperCase()}}", language: "en") {
        name
        path
      }
    }
  `;

  try {
    const response = await fetch(graphQLEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        sc_apikey: apiKey || '',
      },
      body: JSON.stringify({
        query,
      }),
    });

    if (!response.ok) {
      console.error('[PROTECTED_DOWNLOAD] GraphQL request failed:', response.status);
      const errorText = await response.text();
      console.error('[PROTECTED_DOWNLOAD] GraphQL error response:', errorText);
      return null;
    }

    const data: { data?: { item?: { name: string; path: string } }; errors?: unknown[] } =
      await response.json();

    if (data.errors) {
      console.error('[PROTECTED_DOWNLOAD] GraphQL errors:', data.errors);
    }

    const item = data.data?.item;

    if (!item) {
      console.error('[PROTECTED_DOWNLOAD] Media item not found - ensure item is published to Edge');
      return null;
    }

    return {
      name: item.name,
      path: item.path,
    };
  } catch (error) {
    console.error('[PROTECTED_DOWNLOAD] Error querying GraphQL:', error);
    return null;
  }
};

const getMediaDownloadUrl = (mediaPath: string, extension = ''): string => {
  const siteIdentifier = process.env.SITECORE_ENVIRONMENT;

  if (!siteIdentifier) {
    console.error(
      '[PROTECTED_DOWNLOAD] SITECORE_ENVIRONMENT environment variable is not set. ' +
        'This is required for Edge media downloads. ' +
        'Example value: internation15d1-xmcfa72-dev541a-14de'
    );
  }

  const edgeBaseUrl = 'https://edge.sitecorecloud.io';

  let urlPath = mediaPath.replace('/sitecore/media library', '/media');

  urlPath = urlPath.replace(/ /g, '-');

  const mediaUrl = siteIdentifier
    ? `${edgeBaseUrl}/${siteIdentifier}${urlPath}${extension}`
    : `${edgeBaseUrl}${urlPath}${extension}`;

  return mediaUrl;
};

const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/["\\\r\n]/g, '')
    .replace(/[^\x20-\x7E]/g, '')
    .substring(0, 255);
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  setAPIRouteHeaders(res, 'GET');

  if (req.method !== 'GET') {
    return res.status(405).end();
  }

  const session = await getServerSession(req, res, authOptions(req) as AuthOptions);

  if (!session) {
    console.warn(
      '[PROTECTED_DOWNLOAD_AUDIT]',
      JSON.stringify({
        event: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        timestamp: new Date().toISOString(),
        userRole: 'unauthenticated',
        guid: req.query.path ? req.query.path[0] : 'unknown',
        result: 'denied',
      })
    );
    const callbackUrl = encodeURIComponent(req.url || '');
    return res.redirect(302, `/protected-page?callbackUrl=${callbackUrl}`);
  }

  if (!validateUserRole(session as { user: SessionUser })) {
    const customAttrs = (session.user as SessionUser)?.custom_attributes;
    const userRole =
      customAttrs?.memberFlag === 'true'
        ? 'member'
        : customAttrs?.associateFlag === 'true'
        ? 'associate'
        : 'unknown';

    console.warn(
      '[PROTECTED_DOWNLOAD_AUDIT]',
      JSON.stringify({
        event: 'FORBIDDEN_ACCESS_ATTEMPT',
        timestamp: new Date().toISOString(),
        userRole: userRole,
        guid: req.query.path ? req.query.path[0] : 'unknown',
        result: 'denied',
      })
    );
    return res.redirect(302, '/protected-summary');
  }

  const { path } = req.query;

  if (!path || !Array.isArray(path) || path.length === 0) {
    return res.status(400).end();
  }

  const guidWithExtension = path[0];
  let guid = guidWithExtension.replace(/\.(pdf|docx?|xlsx?|pptx?|zip|jpg|jpeg|png|gif|ashx)$/i, '');

  const extensionMatch = guidWithExtension.match(
    /\.(pdf|docx?|xlsx?|pptx?|zip|jpg|jpeg|png|gif|ashx)$/i
  );
  const fileExtension = extensionMatch ? extensionMatch[0] : '';

  guid = decodeURIComponent(guid);
  guid = guid.replace(/[{}\-]/g, '');

  if (!/^[0-9a-f]{32}$/i.test(guid)) {
    return res.status(400).end();
  }

  const formattedGuid = `${guid.slice(0, 8)}-${guid.slice(8, 12)}-${guid.slice(
    12,
    16
  )}-${guid.slice(16, 20)}-${guid.slice(20)}`;

  const mediaItem = await getMediaItemByGuid(formattedGuid);

  if (!mediaItem) {
    return res.redirect(302, '/404');
  }

  const downloadUrl = getMediaDownloadUrl(mediaItem.path, fileExtension);

  const fileName = sanitizeFilename(mediaItem.name);

  const apiKey = process.env.SITECORE_API_KEY;

  try {
    const fetchOptions: RequestInit = {
      method: 'GET',
      headers: {
        'User-Agent': 'ISC2-Protected-Download-Service/1.0',
        ...(apiKey && { sc_apikey: apiKey }),
      },
    };

    const fileResponse = await fetch(downloadUrl, fetchOptions);

    if (!fileResponse.ok) {
      if (fileResponse.status === 404) {
        return res.status(404).end();
      }

      return res.status(502).end();
    }

    const contentType = fileResponse.headers.get('content-type') || 'application/octet-stream';
    const contentLength = fileResponse.headers.get('content-length');

    if (contentType.includes('text/html')) {
      return res.status(404).json({ error: 'Media item not found' });
    }

    const customAttrs = (session.user as SessionUser)?.custom_attributes;
    const userRole =
      customAttrs?.memberFlag === 'true'
        ? 'member'
        : customAttrs?.associateFlag === 'true'
        ? 'associate'
        : 'unknown';

    console.log(
      '[PROTECTED_DOWNLOAD_AUDIT]',
      JSON.stringify({
        event: 'PROTECTED_FILE_ACCESS_SUCCESS',
        timestamp: new Date().toISOString(),
        userRole: userRole,
        guid: guid,
        fileName: fileName,
        fileSize: contentLength || 'unknown',
        contentType: contentType,
        result: 'success',
      })
    );

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }

    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');

    if (!fileResponse.body) {
      return res.status(500).end();
    }

    const reader = fileResponse.body.getReader();

    const stream = async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          res.write(value);
        }
        res.end();
      } catch (error) {
        console.error('[PROTECTED_DOWNLOAD] Error streaming file', {
          error: error instanceof Error ? error.message : String(error),
          guid: guid,
        });

        if (!res.headersSent) {
          res.status(500).end();
        }
      }
    };

    await stream();
  } catch (error) {
    console.error('[PROTECTED_DOWNLOAD] Unexpected error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      guid: guid,
    });

    if (!res.headersSent) {
      return res.status(500).end();
    }
  }
}
