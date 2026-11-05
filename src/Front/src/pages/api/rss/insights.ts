import { NextApiRequest, NextApiResponse } from 'next';
import { Builder } from 'xml2js';
import sanitizeHtml from 'sanitize-html';
import { insightsRssFeedQuery } from 'queries/searchSettings';
import { RssArticle, RssGraphQLResponse, RSSObject, RssArticleDetails } from 'types/index';
import { getGraphQLResult } from 'utils/graphQLFunctions';

const getImageMimeType = (url: string): string => {
  const extension = url.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'png':
      return 'image/png';
    case 'jpeg':
    case 'jpg':
      return 'image/jpeg';
    case 'gif':
      return 'image/gif';
    default:
      return 'image/jpeg'; // Default to JPEG if the extension is unknown
  }
};

function convertToRFC822(dateString: string): string {
  if (dateString) {
    const year = dateString.substring(0, 4);
    const month = dateString.substring(4, 6);
    const day = dateString.substring(6, 8);
    const hours = dateString.substring(9, 11);
    const minutes = dateString.substring(11, 13);
    const seconds = dateString.substring(13, 15);

    const date = new Date(
      Date.UTC(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hours),
        parseInt(minutes),
        parseInt(seconds)
      )
    );

    return date.toUTCString();
  }
  return '';
}

function processDescription(description: string): string {
  const cleanedDescription = description.replace(/â€/g, '');

  const fixedDescription = cleanedDescription.replace(/src="(\/[^"]+)"/g, (_, path) => {
    return `src="${process.env.NEXTAUTH_URL_INTERNAL}${path}"`;
  });

  const absoluteDescription = fixedDescription.replace(/href="(\/[^"]+)"/g, (_, path) => {
    return `href="${process.env.NEXTAUTH_URL_INTERNAL}${path}"`;
  });

  return sanitizeHtml(absoluteDescription, {
    allowedTags: sanitizeHtml.defaults.allowedTags.filter((tag) => tag !== 'iframe'),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ['src', 'alt', 'title', 'width', 'height', 'style'],
      a: ['href', 'title', 'target'],
    },
  });
}

export const extractArticleDetails = (response: RssGraphQLResponse): RssArticleDetails[] => {
  return response.search.results
    .filter((article) =>
      article.fields.some((field) => field.name === 'Show in RSS Feed' && field.value === '1')
    )
    .map((article) => {
      const fields = article.fields.reduce((articleFields, field) => {
        articleFields[field.name] = field.value;
        return articleFields;
      }, {} as Record<string, string>);

      const thumbnailUrl = article.thumbnailImage ? article.thumbnailImage.src : '';

      return {
        articleBody: processDescription(fields.articleBody),
        thumbnailImage:
          thumbnailUrl != null && thumbnailUrl.startsWith('http')
            ? thumbnailUrl
            : process.env.NEXTAUTH_URL_INTERNAL + thumbnailUrl,
        articleHeading: fields.articleHeading,
        articleDate: convertToRFC822(fields.articleDate),
        articleUrl: process.env.NEXTAUTH_URL_INTERNAL + article.url.path,
      };
    });
};

const Insights = async (_req: NextApiRequest, res: NextApiResponse) => {
  try {
    let allArticles: RssArticle[] = [];
    let endCursor: string | null = null;
    let hasNext = true;
    let loopCount = 0;

    while (hasNext) {
      loopCount++;
      console.log(`Fetching Insights page number: ${loopCount}`);

      const query = insightsRssFeedQuery(40, endCursor);
      const response = await getGraphQLResult<RssGraphQLResponse>(query);
      const results: RssArticle[] = response.search.results;
      const pageInfo = response.search.pageInfo;

      allArticles = allArticles.concat(results);
      endCursor = pageInfo.endCursor;
      hasNext = pageInfo.hasNext;
    }

    const articleDetails = extractArticleDetails({
      search: {
        results: allArticles,
        pageInfo: { endCursor: '', hasNext: false },
        total: allArticles.length,
      },
    });

    const rssObj: RSSObject = {
      rss: {
        $: { version: '2.0', 'xmlns:atom': 'http://www.w3.org/2005/Atom' },
        channel: [
          {
            title: 'ISC2',
            description:
              'The International Information System Security Certification Consortium, or ISC2, is a non-profit organization which specializes in training and certifications for cybersecurity professionals. It has been described as the "world\'s largest IT security organization" © Copyright 1996-2024. ISC2, Inc. All Rights Reserved. All contents of this site constitute the property of ISC2, Inc. and may not be copied, reproduced or distributed without prior written permission. ISC2, CISSP, SSCP, CCSP, CGRC, CSSLP, HCISPP, ISSAP, ISSEP, ISSMP and CBK are registered marks of ISC2, Inc.',
            link: process.env.NEXTAUTH_URL_INTERNAL,
            'atom:link': [
              {
                $: {
                  href: process.env.NEXTAUTH_URL_INTERNAL + '/api/rss/insights',
                  rel: 'self',
                  type: 'application/rss+xml',
                },
              },
            ],
            item: articleDetails.map((entry) => ({
              title: entry.articleHeading,
              description: entry.articleBody,
              link: entry.articleUrl + '?utm_source=rss-feed',
              guid: entry.articleUrl,
              pubDate: entry.articleDate,
              enclosure: [
                {
                  $: {
                    url: entry.thumbnailImage,
                    type: getImageMimeType(entry.thumbnailImage),
                    length: '0',
                  },
                },
              ],
            })),
          },
        ],
      },
    };

    const builder = new Builder({ cdata: true });
    const xml = builder.buildObject(rssObj);

    console.log('RSS feed updated successfully.');
    res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
    res.status(200).send(xml);
  } catch (error) {
    console.error('Failed to update RSS feed:', error);
    res.status(500).json({ error: 'Failed to update RSS feed.' });
  }
};

export default Insights;
