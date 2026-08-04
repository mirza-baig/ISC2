import { useCallback } from 'react';
import { Field } from '@sitecore-jss/sitecore-jss-nextjs';

interface UseSearchFeatureFlagsProps {
  startSearchTriggerTypes?: Field<string>;
  hasUserPressedEnter?: boolean;
}

interface UseSearchFeatureFlagsReturn {
  shouldTriggerSearch: (query: string) => boolean;
  isSearchBlocked: (query: string, hasSuggestions?: boolean) => boolean;
}

export const useSearchFeatureFlags = ({
  startSearchTriggerTypes,
  hasUserPressedEnter = false,
}: UseSearchFeatureFlagsProps): UseSearchFeatureFlagsReturn => {
  const shouldTriggerSearch = useCallback(
    (query: string) => {
      const triggerType = startSearchTriggerTypes?.value;

      if (triggerType === 'Enter Key') {
        return hasUserPressedEnter;
      }

      if (triggerType === 'Min 3 Character Search') {
        return query.length >= 3;
      }

      return true;
    },
    [startSearchTriggerTypes?.value, hasUserPressedEnter]
  );

  const isSearchBlocked = useCallback(
    (query: string, hasSuggestions = false) => {
      if (!query) return false;

      const triggerType = startSearchTriggerTypes?.value;

      return (
        (triggerType === 'Min 3 Character Search' && query.length < 3) ||
        (triggerType === 'Enter Key' && !hasSuggestions)
      );
    },
    [startSearchTriggerTypes?.value]
  );

  return {
    shouldTriggerSearch,
    isSearchBlocked,
  };
};
