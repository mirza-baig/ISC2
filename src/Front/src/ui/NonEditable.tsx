import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { DictionaryRestServiceWrapper } from 'utils/dictionary-service-wrapper';

interface DictionaryData {
  NonEditableMessage: string;
}

const NonEditable: React.FC = () => {
  const dictionaryService = useMemo(() => DictionaryRestServiceWrapper(), []);
  const [dictionaryData, setDictionaryData] = useState<DictionaryData | null>(null);

  const dictionaryServiceResponse = useCallback(async () => {
    try {
      const response = await dictionaryService.fetchDictionaryData();
      const NonEditableMessage: string = response['NonEditableMessage']
        ? response['NonEditableMessage']
        : 'Error fetching data.';
      setDictionaryData({ NonEditableMessage });
    } catch (err) {
      console.error('Error fetching dictionary data:', err);
      setDictionaryData({ NonEditableMessage: 'Error fetching data.' });
    }
  }, [dictionaryService]);

  useEffect(() => {
    dictionaryServiceResponse();
  }, [dictionaryServiceResponse]);

  return (
    <div>
      <h1>{dictionaryData?.NonEditableMessage}</h1>
    </div>
  );
};

export default NonEditable;
