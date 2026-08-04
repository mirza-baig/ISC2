import { RestDictionaryService } from '@sitecore-jss/sitecore-jss-nextjs';
import { useSitecoreContext } from '@sitecore-jss/sitecore-jss-nextjs';
import { DictionaryPhrases } from '@sitecore-jss/sitecore-jss-nextjs';

import config from 'temp/config';

export function DictionaryRestServiceWrapper() {
  const context = useSitecoreContext();
  const dictionaryService = new RestDictionaryService({
    apiHost: config.sitecoreApiHost,
    apiKey: config.sitecoreApiKey,
    siteName: config.sitecoreSiteName,
  });

  const fetchDictionaryData = (
    language: string = context?.sitecoreContext?.language || config?.defaultLanguage
  ): Promise<DictionaryPhrases> => {
    return dictionaryService.fetchDictionaryData(language);
  };

  return {
    fetchDictionaryData,
  };
}
