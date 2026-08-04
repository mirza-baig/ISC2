import { useState, useEffect, useCallback } from 'react';
import { DictionaryRestServiceWrapper } from 'utils/dictionary-service-wrapper';

export const useDictionaryData = (keys: string[]) => {
  const [dictionaryData, setDictionaryData] = useState<Record<string, string> | null>(null);
  const [hasFetched, setHasFetched] = useState(false);
  const dictionaryService = DictionaryRestServiceWrapper();

  const fetchDictionaryData = useCallback(async () => {
    if (hasFetched) return;
    try {
      const response = await dictionaryService.fetchDictionaryData();
      if (response && Object.keys(response).length > 0) {
        const filteredData: Record<string, string> = {};
        keys.forEach((key) => {
          if (Object.prototype.hasOwnProperty.call(response, key)) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            filteredData[key] = response[key];
          } else {
            filteredData[key] = 'Error fetching data.';
          }
        });
        setDictionaryData(filteredData);
        setHasFetched(true);
      }
    } catch (err) {
      console.error('Error fetching dictionary data:', err);
      setHasFetched(true);
    }
  }, [dictionaryService, keys, hasFetched]);

  useEffect(() => {
    fetchDictionaryData();
  }, [fetchDictionaryData]);

  return dictionaryData;
};
