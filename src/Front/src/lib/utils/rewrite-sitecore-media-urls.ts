import { LayoutServiceData } from '@sitecore-jss/sitecore-jss-nextjs';
import config from 'temp/config';
export function shouldRewriteLayoutMediaForPreviewEnv(): boolean {
  const v = process.env.APPLICATION_ENV?.trim();
  return v === 'preview';
}
function getOriginsToStripBeforeMediaPath(): string[] {
  const origins = new Set<string>();

  const add = (value: string | undefined) => {
    if (!value) return;
    try {
      origins.add(new URL(value).origin);
    } catch {
      // ignore
    }
  };

  add(config.publicUrl);
  add('https://www.isc2.org');
  add('https://isc2.org');

  if (config.sites) {
    try {
      const sites = JSON.parse(config.sites) as { hostName?: string }[];
      for (const site of sites) {
        if (site.hostName) {
          add(`https://${site.hostName}`);
        }
      }
    } catch {
      // ignore
    }
  }

  return [...origins];
}
export function rewriteAbsoluteSitecoreMediaInString(value: string): string {
  if (!value.includes('/-/')) {
    return value;
  }

  let result = value;
  for (const origin of getOriginsToStripBeforeMediaPath()) {
    const escaped = origin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`${escaped}(?=\\/\\-\\/)`, 'gi');
    result = result.replace(re, '');
  }
  return result;
}

function deepRewrite(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }
  if (typeof value === 'string') {
    return rewriteAbsoluteSitecoreMediaInString(value);
  }
  if (Array.isArray(value)) {
    return value.map(deepRewrite);
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(obj)) {
      out[key] = deepRewrite(obj[key]);
    }
    return out;
  }
  return value;
}

export function rewriteLayoutServiceMediaUrls(layoutData: LayoutServiceData): LayoutServiceData {
  return deepRewrite(layoutData) as LayoutServiceData;
}
