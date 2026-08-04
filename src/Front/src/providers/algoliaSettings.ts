import axios from 'axios';
import { FetchedSearchWrapperWithQueryStringFields } from 'types/algoliaSearch';
import config from 'temp/config';

export const fetchSearchWrapperSettings =
  async (): Promise<FetchedSearchWrapperWithQueryStringFields> => {
    try {
      const response = await axios.get<FetchedSearchWrapperWithQueryStringFields>(
        '/api/algoliaSettings',
        {
          headers: {
            'x-api-key': config.sitecoreApiKey,
          },
        }
      );

      const parsedSettings = response.data;

      return parsedSettings;
    } catch (error) {
      throw error;
    }
  };
