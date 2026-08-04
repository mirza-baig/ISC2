import { useCallback, useEffect, useState } from 'react';
import { useLayout, usePersonalize } from 'providers/index';

interface PersonalizedData {
  fields?: unknown;
}

export default function usePersonalizeComponent<T extends PersonalizedData>(
  defaultProps: T,
  friendlyId?: string
) {
  const { isEditing } = useLayout();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<T>(defaultProps);

  const { engage, personalize } = usePersonalize();

  const personalizeContent = useCallback(async () => {
    if (engage && friendlyId) {
      try {
        const personalizedData = await personalize(friendlyId);

        if (!(personalizedData as T).fields) {
          console.log(`ERROR WITH SITECORE PERSONALIZE: ${JSON.stringify(personalizedData)}`);
          return;
        }

        setData(personalizedData as T);
      } catch (err) {
        console.log(`Request failed when personalizing ${friendlyId}`);
      } finally {
        setIsLoading(false);
      }
    }
  }, [engage, friendlyId, personalize]);

  useEffect(() => {
    if (friendlyId && !isEditing) {
      personalizeContent();
    } else {
      setIsLoading(false);
      setData(defaultProps);
    }
  }, [friendlyId, personalizeContent, defaultProps, isEditing]);

  return { isLoading, data };
}
