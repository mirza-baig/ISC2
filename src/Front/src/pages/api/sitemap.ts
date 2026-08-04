import type { NextApiRequest, NextApiResponse } from 'next';
import { GraphQLSitemapXmlService } from '@sitecore-jss/sitecore-jss-nextjs';
import { siteResolver } from 'lib/site-resolver';
import config from 'temp/config';
import clientFactory from 'lib/graphql-client-factory';

const ABSOLUTE_URL_REGEXP = '^(?:[a-z]+:)?//';

const SITEMAP_FETCH_TIMEOUT_MS = Number(process.env.SITEMAP_FETCH_TIMEOUT_MS || 15_000);

const sitemapApi = async (
  req: NextApiRequest,
  res: NextApiResponse
): Promise<NextApiResponse | void> => {
  const {
    query: { id },
  } = req;

  // Resolve site based on hostname
  const hostName = req.headers['host']?.split(':')[0] || 'localhost';
  const site = siteResolver.getByHost(hostName);

  // create sitemap graphql service
  const sitemapXmlService = new GraphQLSitemapXmlService({
    clientFactory,
    siteName: site.name,
  });

  // if url has sitemap-{n}.xml type. The id - can be null if it's sitemap.xml request
  const sitemapPath = await sitemapXmlService.getSitemap(id as string);

  // if sitemap is match otherwise redirect to 404 page
  if (sitemapPath) {
    const isAbsoluteUrl = sitemapPath.match(ABSOLUTE_URL_REGEXP);
    const sitemapUrl = isAbsoluteUrl ? sitemapPath : `${config.sitecoreApiHost}${sitemapPath}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), SITEMAP_FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(sitemapUrl, { signal: controller.signal });

      if (!response.ok) {
        console.error('SITEMAP UPSTREAM NOT OK', { sitemapUrl, status: response.status });
        return res.status(502).end();
      }

      const xml = await response.text();

      if (!xml) {
        console.error('SITEMAP UPSTREAM EMPTY BODY', { sitemapUrl });
        return res.status(502).end();
      }

      res.setHeader('Content-Type', 'text/xml;charset=utf-8');
      res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');

      return res.status(200).send(xml);
    } catch (err) {
      console.error('SITEMAP PROXY FAILED', { sitemapUrl, siteName: site.name, err });
      if (!res.headersSent) {
        return res.status(502).end();
      }
      return res.end();
    } finally {
      clearTimeout(timeout);
    }
  }

  // this approache if user go to /sitemap.xml - under it generate xml page with list of sitemaps
  let sitemaps: string[] = [];

  try {
    sitemaps = (await sitemapXmlService.fetchSitemaps()) || [];
  } catch (err) {
    console.error('SITEMAP FETCH LIST FAILED', { siteName: site.name, err });
    return res.status(502).end();
  }

  if (!sitemaps.length) {
    console.error('SITEMAP LIST EMPTY', { siteName: site.name, hostName });
    return res.status(404).end();
  }

  const reqtHost = req.headers.host;
  const reqProtocol = req.headers['x-forwarded-proto'] || 'https';
  const SitemapLinks = sitemaps
    .map((item) => {
      const parseUrl = item.split('/');
      const lastSegment = parseUrl[parseUrl.length - 1];

      return `<sitemap>
        <loc>${reqProtocol}://${reqtHost}/${lastSegment}</loc>
      </sitemap>`;
    })
    .join('');

  res.setHeader('Content-Type', 'text/xml;charset=utf-8');

  return res.send(`
  <sitemapindex xmlns="http://sitemaps.org/schemas/sitemap/0.9" encoding="UTF-8">${SitemapLinks}</sitemapindex>
  `);
};

export default sitemapApi;
