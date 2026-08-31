import axios from 'axios';
import { FetchedSearchWrapperWithQueryStringFields } from 'types/algoliaSearch';
import config from 'temp/config';

export const fetchSearchWrapperSettings = async (
  settingsRef: string
): Promise<FetchedSearchWrapperWithQueryStringFields> => {
  const response = await axios.get<FetchedSearchWrapperWithQueryStringFields>(
    '/api/algoliaSettings',
    {
      params: { id: settingsRef },
      headers: {
        'x-api-key': config.sitecoreApiKey,
      },
    }
  );

  return response.data;
};
