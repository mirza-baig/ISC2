import type { NextApiRequest, NextApiResponse } from 'next';
import { getArticleRssFeed } from 'queries/searchSettings';
import { Builder } from 'xml2js';
import sanitizeHtml from 'sanitize-html';
import { getGraphQLResult } from 'utils/graphQLFunctions';
export interface Article {
  name: string;
  fields: Array<{
    name: string;
    value: string;
  }>;
  url: {
    path: string;
  };
  thumbnailImage?: {
    src: string;
  };
}

export interface GraphQLResponse {
  search: {
    results: Article[];
  };
}

export interface ArticleDetails {
  articleBody: string;
  thumbnailImage: string;
  articleHeading: string;
  articleDate: string;
  articleUrl: string;
}

interface Channel extends AtomLink {
  title: string;
  description: string;
  link: string | undefined;
  item: {
    title: string;
    description: string;
    link: string;
    pubDate: string;
    enclosure: {
      $: {
        url: string;
        type: string;
      };
    }[];
  }[];
}

interface AtomLink {
  'atom:link': {
    $: {
      href: string;
      rel: string;
      type: string;
    };
  }[];
}

interface RSSObject {
  rss: {
    $: {
      version: string;
      'xmlns:atom': string;
    };
    channel: Channel[];
  };
}

export const extractArticleDetails = (response: GraphQLResponse): ArticleDetails[] => {
  console.log('response', response);

  return response.search.results.map((article) => {
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

function getImageMimeType(url: string): string {
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
}

function convertToRFC822(dateString: string): string {
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

const insightsApi = async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
  try {
    const { articlePath } = req.query;
    const decodedUrl = decodeURIComponent(articlePath as string);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    const urlObj = new URL(decodedUrl, 'https://isc2.org');

    const slug = urlObj.pathname.split('/').filter(Boolean).pop() as string;

    const query = getArticleRssFeed(slug);
    const response = await getGraphQLResult<GraphQLResponse>(query);

    const articleDetails = extractArticleDetails(response);

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
              link: entry.articleUrl,
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

    res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
    res.status(200).end(xml);
  } catch (err) {
    console.error('ERROR DURING fetch REQUEST', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export default insightsApi;
