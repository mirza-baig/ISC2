import algoliasearch from 'algoliasearch';
import { getGraphQLResult } from 'utils/graphQLFunctions';
import { SEARCH_SETTINGS_QUERY_FOR_INSIGHT_LISTING } from 'queries/searchSettings';
import { AlgoliaSettingsForInsightListing } from 'src/types';

export type AlgoliaInsightResult = {
  objectID: string;
  articleTitle: string;
  url: string;
  createdDate: string;
  thumbnailImage: string;
  genericType: string;
  _highlightResult?: {
    title?: {
      value: string;
    };
  };
};

export async function fetchInsightsFromAlgolia(searchTag: string): Promise<AlgoliaInsightResult[]> {
  const startTime = Date.now();

  try {
    console.log(`[ALGOLIA-FETCH] Starting fetch for tag: "${searchTag}"`);

    const algoliaSettings = await getGraphQLResult<AlgoliaSettingsForInsightListing>(
      SEARCH_SETTINGS_QUERY_FOR_INSIGHT_LISTING
    );

    if (!algoliaSettings?.algoliaDetails) {
      console.error(`[ALGOLIA-FETCH] ✗ Algolia settings not found for tag: "${searchTag}"`);
      return [];
    }

    const {
      algoliaDetails: { algoliaSortDescByDateIndexName, algoliaApiKey, algoliaAppId },
    } = algoliaSettings;

    if (!algoliaApiKey?.value || !algoliaAppId?.value || !algoliaSortDescByDateIndexName?.value) {
      console.error(`[ALGOLIA-FETCH] ✗ Invalid Algolia configuration for tag: "${searchTag}"`);
      return [];
    }

    const client = algoliasearch(algoliaAppId.value, algoliaApiKey.value);
    const index = client.initIndex(algoliaSortDescByDateIndexName.value);

    const algoliaStartTime = Date.now();

    const searchResult = await index.search('', {
      hitsPerPage: 4,
      facetFilters: [`topics:${searchTag}`],
      attributesToRetrieve: ['articleTitle', 'createdDate', 'url', 'thumbnailImage', 'genericType'],
    });

    const algoliaDuration = Date.now() - algoliaStartTime;
    const algoliaRequestId =
      'requestID' in searchResult ? String(searchResult.requestID) : 'unknown';

    const results = searchResult.hits as AlgoliaInsightResult[];

    const minimizedResults = results.map((result) => ({
      objectID: result.objectID,
      articleTitle: result.articleTitle,
      url: result.url,
      createdDate: result.createdDate,
      thumbnailImage: result.thumbnailImage,
      genericType: result.genericType,
      _highlightResult: result._highlightResult,
    }));

    const totalDuration = Date.now() - startTime;
    const dataSize = JSON.stringify(minimizedResults).length;
    const sizeKB = (dataSize / 1024).toFixed(2);

    console.log(
      `[ALGOLIA-FETCH] ✅ Completed | Tag: "${searchTag}" | Request ID: ${algoliaRequestId} | Results: ${results.length} articles | Size: ${sizeKB}KB | Algolia time: ${algoliaDuration}ms | Total time: ${totalDuration}ms`
    );

    return minimizedResults;
  } catch (error) {
    const totalDuration = Date.now() - startTime;
    console.error(
      `[ALGOLIA-FETCH] ✗ Error fetching results for "${searchTag}" (${totalDuration}ms):`,
      error
    );
    return [];
  }
}
