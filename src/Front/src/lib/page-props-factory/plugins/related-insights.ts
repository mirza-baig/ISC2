import { GetServerSidePropsContext, GetStaticPropsContext } from 'next';
import { SitecorePageProps } from 'lib/page-props';
import { Plugin } from '..';
import { LayoutServiceData, ComponentRendering } from '@sitecore-jss/sitecore-jss-nextjs';
import { AlgoliaInsightResult } from 'utils/algoliaInsights';

type AlgoliaField = AlgoliaInsightResult & {
  _highlightResult?: {
    title?: {
      value: string;
    };
  };
};

interface ComponentWithPlaceholders extends ComponentRendering {
  placeholders?: {
    [key: string]: ComponentRendering[];
  };
}

function extractComponentsWithSearchTags(
  layoutData: LayoutServiceData
): Array<{ uid: string; searchTag: string }> {
  const components: Array<{ uid: string; searchTag: string }> = [];

  function traverseComponents(componentList: ComponentRendering[]) {
    if (!Array.isArray(componentList)) return;

    componentList.forEach((component: ComponentWithPlaceholders) => {
      if (component.componentName === 'DynamicRelatedInsights') {
        const primaryTagFieldValue = component.fields?.primaryTagForRelatedInsights as {
          value?: string;
        };

        const topicsField = component.fields?.topics as { fields?: { name?: { value?: string } } };

        const primaryTag = primaryTagFieldValue?.value;
        const topicTag = topicsField?.fields?.name?.value;
        const searchTag = primaryTag || topicTag;

        if (searchTag && component.uid) {
          components.push({ uid: component.uid, searchTag });
        }
      }

      if (component.componentName === 'ArticleBody') {
        const primaryTagField = component.fields?.primaryTagForRelatedInsights as {
          fields?: { name?: { value?: string } };
        };
        const articleTagsField = component.fields?.articleTags as Array<{
          fields?: { name?: { value?: string } };
        }>;

        const primaryTag = primaryTagField?.fields?.name?.value;
        const firstArticleTag = articleTagsField?.[0]?.fields?.name?.value;
        const searchTag = primaryTag || firstArticleTag;

        if (searchTag && component.uid) {
          components.push({ uid: component.uid, searchTag });
        }
      }

      if (component.placeholders) {
        Object.values(component.placeholders).forEach((placeholder: ComponentRendering[]) => {
          if (Array.isArray(placeholder)) {
            traverseComponents(placeholder);
          }
        });
      }
    });
  }

  if (layoutData?.sitecore?.route?.placeholders) {
    Object.values(layoutData.sitecore.route.placeholders).forEach((placeholder) => {
      if (Array.isArray(placeholder)) {
        traverseComponents(placeholder as ComponentRendering[]);
      }
    });
  }

  return components;
}

async function fetchAlgoliaResults(searchTag: string): Promise<AlgoliaField[]> {
  const fetchStartTime = Date.now();

  try {
    console.log(`[INSIGHTS-FETCH] Fetching insights for tag: "${searchTag}"`);

    const baseUrl = process.env.PUBLIC_URL || '';
    const response = await fetch(`${baseUrl}/api/insights/${searchTag}`);

    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const results = data.results || [];
    const fetchDuration = Date.now() - fetchStartTime;

    const dataSize = JSON.stringify(results).length;
    const sizeKB = (dataSize / 1024).toFixed(2);

    const requestId = response.headers.get('X-Request-ID') || 'no-id';

    const isCached = fetchDuration < 200;
    const cacheStatus = isCached ? 'CACHED' : 'FRESH';

    console.log(
      `[INSIGHTS-FETCH] ${cacheStatus} | Tag: "${searchTag}" | Request ID: ${requestId}${
        isCached ? ' (served from cache)' : ' (fresh fetch from Algolia)'
      } | Results: ${results.length} | Size: ${sizeKB}KB | Time: ${fetchDuration}ms`
    );

    return results;
  } catch (error) {
    const totalDuration = Date.now() - fetchStartTime;
    console.error(
      `[INSIGHTS-FETCH] ✗ Error fetching results for "${searchTag}" (${totalDuration}ms):`,
      error
    );
    return [];
  }
}

class RelatedInsightsPlugin implements Plugin {
  order = 10;

  async exec(
    props: SitecorePageProps,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _context: GetServerSidePropsContext | GetStaticPropsContext
  ): Promise<SitecorePageProps> {
    if (!props.layoutData?.sitecore?.route) {
      return props;
    }

    const components = extractComponentsWithSearchTags(props.layoutData);

    if (components.length === 0) {
      return props;
    }

    console.log(
      `[INSIGHTS-PLUGIN] Found ${components.length} DynamicRelatedInsights components for page build`
    );

    const searchTagsMap = new Map<string, AlgoliaField[]>();

    const uniqueSearchTags = [...new Set(components.map((c) => c.searchTag))];

    await Promise.all(
      uniqueSearchTags.map(async (searchTag) => {
        const hits = await fetchAlgoliaResults(searchTag);
        searchTagsMap.set(searchTag, hits);
      })
    );

    const componentProps = { ...props.componentProps };

    components.forEach(({ uid, searchTag }) => {
      const relatedInsights = searchTagsMap.get(searchTag) || [];
      componentProps[uid] = {
        ...(componentProps[uid] || {}),
        relatedInsights,
      };
    });

    return {
      ...props,
      componentProps,
    };
  }
}

export const relatedInsightsPlugin = new RelatedInsightsPlugin();
