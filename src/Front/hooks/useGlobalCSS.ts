import { useEffect, useState } from 'react';
import { getGraphQLResult } from 'utils/graphQLFunctions';
import { getGlobalCSSQuery } from 'queries/globalCss';

interface GlobalCSSResponse {
  item: {
    id: string;
    name: string;
    path: string;
    field: {
      name: string;
      value: string;
    };
  };
}

export const useGlobalCSS = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAndInjectGlobalCSS = async () => {
      try {
        const query = getGlobalCSSQuery();
        const result = await getGraphQLResult<GlobalCSSResponse>(query);

        if (result?.item?.field?.value) {
          const globalCSS = result.item.field.value;

          let styleElement = document.getElementById('global-css-dynamic') as HTMLStyleElement;

          if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = 'global-css-dynamic';
            document.body.appendChild(styleElement);
          }

          styleElement.innerHTML = globalCSS;
          setIsLoaded(true);
        } else {
          setIsLoaded(true);
        }
      } catch (err) {
        console.error('Error fetching global CSS:', err);
        setError(err instanceof Error ? err.message : 'Failed to load global CSS');
        setIsLoaded(true);
      }
    };

    fetchAndInjectGlobalCSS();
  }, []);

  return { isLoaded, error };
};
