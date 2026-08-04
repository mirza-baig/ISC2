import type { NextApiRequest, NextApiResponse } from 'next';
import { revalidateTag } from 'next/cache';

interface XMCloudWebhookPayload {
  Id: string;
  Name: string;
  Path: string;
  Language: string;
  Version: number;
  Database: string;
}

interface SitecorePublishingWebhookPayload {
  EventName: string;
  PublisherOptions: {
    SourceDatabaseName: string;
    TargetDatabaseName: string;
    RootItemId: string;
    Languages: string[];
    UserName: string;
    Mode: string;
    PublishDate: string;
    [key: string]: unknown;
  };
  WebhookItemId: string;
  WebhookItemName: string;
}

function isXMCloudWebhook(payload: unknown): payload is XMCloudWebhookPayload {
  if (!payload || typeof payload !== 'object' || payload === null) {
    return false;
  }

  const payloadObj = payload as Record<string, unknown>;

  return (
    typeof payloadObj.Id === 'string' &&
    typeof payloadObj.Name === 'string' &&
    typeof payloadObj.Path === 'string' &&
    typeof payloadObj.Language === 'string' &&
    typeof payloadObj.Database === 'string'
  );
}

function isSitecorePublishingWebhook(
  payload: unknown
): payload is SitecorePublishingWebhookPayload {
  if (!payload || typeof payload !== 'object' || payload === null) {
    return false;
  }

  const payloadObj = payload as Record<string, unknown>;

  return (
    typeof payloadObj.EventName === 'string' &&
    typeof payloadObj.PublisherOptions === 'object' &&
    payloadObj.PublisherOptions !== null &&
    typeof payloadObj.WebhookItemId === 'string' &&
    typeof payloadObj.WebhookItemName === 'string'
  );
}

function logInfo(message: string, data?: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  if (data) {
    console.log(`[CACHE-INVALIDATE] ${timestamp} - ${message}`);
    console.log('Data:', JSON.stringify(data, null, 2));
  } else {
    console.log(`[CACHE-INVALIDATE] ${timestamp} - ${message}`);
  }
}

function logError(message: string, error?: unknown) {
  const timestamp = new Date().toISOString();
  console.error(`[CACHE-INVALIDATE ERROR] ${timestamp} - ${message}`);
  if (error) {
    console.error(
      'Error details:',
      typeof error === 'string' ? error : JSON.stringify(error, null, 2)
    );
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const startTime = Date.now();
  const requestId = `cache_inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  logInfo(`[${requestId}] Cache invalidation request received`, {
    method: req.method,
    headers: {
      'content-type': req.headers['content-type'],
      'user-agent': req.headers['user-agent'],
      'x-revalidate-secret': req.headers['x-revalidate-secret'] ? '[REDACTED]' : 'not-provided',
    },
    query: req.query,
  });

  if (req.method !== 'POST') {
    logError(`[${requestId}] Method not allowed`, { method: req.method });
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const secret = req.query.secret || req.headers['x-revalidate-secret'];
    if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
      logError(`[${requestId}] Invalid or missing revalidation secret`);
      return res.status(401).json({ message: 'Invalid token' });
    }

    let body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    logInfo(`[${requestId}] Request body parsed`, { bodyType: typeof req.body, parsedBody: body });

    if (body.bodyType === 'object' && body.parsedBody) {
      logInfo(`[${requestId}] Detected double-wrapped payload, extracting inner payload`);
      body = body.parsedBody;
    }

    let itemPath: string;
    let webhookType: 'xm-cloud' | 'sitecore-publishing' | 'unknown';

    logInfo(`[${requestId}] Checking webhook type for payload`, body);

    if (isXMCloudWebhook(body)) {
      webhookType = 'xm-cloud';
      itemPath = body.Path;

      logInfo(`[${requestId}] XM Cloud webhook detected`, {
        itemId: body.Id,
        itemName: body.Name,
        itemPath: body.Path,
        language: body.Language,
        database: body.Database,
      });
    } else if (isSitecorePublishingWebhook(body)) {
      webhookType = 'sitecore-publishing';
      itemPath = '/Insights'; // Default to Insights for publishing webhooks

      logInfo(`[${requestId}] Sitecore publishing webhook detected`, {
        eventName: body.EventName,
        rootItemId: body.PublisherOptions.RootItemId,
        publishMode: body.PublisherOptions.Mode,
      });
    } else {
      webhookType = 'unknown';
      itemPath = '';

      logInfo(`[${requestId}] Unknown webhook type, skipping cache invalidation`, {
        bodyKeys: Object.keys(body),
      });

      return res.status(200).json({
        message: 'Unknown webhook type, no cache cleared',
        requestId,
        webhookType,
      });
    }

    const isInsightsPath = /\/Insights\//i.test(itemPath) || itemPath === '/Insights';

    if (!isInsightsPath) {
      logInfo(`[${requestId}] Not an Insights path, skipping cache invalidation`, {
        itemPath,
        webhookType,
      });

      return res.status(200).json({
        message: 'Not an Insights article, no cache cleared',
        itemPath,
        webhookType,
        requestId,
      });
    }

    logInfo(`[${requestId}] Insights article detected, revalidating all insights cache`);

    try {
      // Revalidate the 'insights' cache tag (this clears all cached insights)
      revalidateTag('insights');

      const totalDuration = Date.now() - startTime;

      logInfo(`[${requestId}] ✓ Cache tag 'insights' revalidated successfully`, {
        itemPath,
        webhookType,
        duration: `${totalDuration}ms`,
      });

      return res.status(200).json({
        success: true,
        message: 'Insights cache revalidated - next request will fetch fresh data',
        revalidated: 'insights-cache-tag',
        itemPath,
        webhookType,
        duration: totalDuration,
        requestId,
      });
    } catch (revalidateError) {
      logError(`[${requestId}] Failed to revalidate cache tag`, revalidateError);

      const totalDuration = Date.now() - startTime;

      return res.status(200).json({
        success: true,
        message: 'Webhook received - cache will expire naturally in 1 hour',
        note: 'Revalidation not available, relying on TTL expiration',
        itemPath,
        webhookType,
        duration: totalDuration,
        requestId,
      });
    }
  } catch (error: unknown) {
    const totalDuration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : 'No stack trace';

    logError(`[${requestId}] Cache invalidation failed with exception`, {
      error: errorMessage,
      stack: errorStack,
      duration: `${totalDuration}ms`,
      requestBody: req.body,
    });

    return res.status(500).json({
      message: 'Internal error',
      error: errorMessage,
      duration: totalDuration,
      requestId,
    });
  }
}
