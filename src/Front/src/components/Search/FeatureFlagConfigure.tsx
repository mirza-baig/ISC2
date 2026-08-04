import React from 'react';
import { Configure, useSearchBox } from 'react-instantsearch-hooks-web';
import { useSearchFeatureFlags } from 'hooks/index';
import { Field } from '@sitecore-jss/sitecore-jss-nextjs';

interface FeatureFlagConfigureProps {
  filters: string;
  hitsPerPage: number;
  clickAnalytics: boolean;
  getRankingInfo: boolean;
  userToken: string;
  startSearchTriggerTypes?: Field<string>;
}

const FeatureFlagConfigure: React.FC<FeatureFlagConfigureProps> = ({
  filters,
  hitsPerPage,
  clickAnalytics,
  getRankingInfo,
  userToken,
  startSearchTriggerTypes,
}) => {
  const { query } = useSearchBox();

  const { shouldTriggerSearch } = useSearchFeatureFlags({
    startSearchTriggerTypes,
    hasUserPressedEnter: true,
  });

  if (!query || (query && !shouldTriggerSearch(query))) {
    return null;
  }

  return (
    <Configure
      {...({
        filters,
        hitsPerPage,
        clickAnalytics,
        getRankingInfo,
        userToken,
      } as Record<string, unknown>)}
    />
  );
};

export default FeatureFlagConfigure;
