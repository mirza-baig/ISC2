import React, { createContext, useContext, ReactNode } from 'react';

export type FeatureFlags = Record<string, boolean>;

const FeatureFlagsContext = createContext<FeatureFlags>({});

interface FeatureFlagsProviderProps {
  flags?: FeatureFlags;
  children: ReactNode;
}

export const FeatureFlagsProvider = ({ flags, children }: FeatureFlagsProviderProps) => (
  <FeatureFlagsContext.Provider value={flags ?? {}}>{children}</FeatureFlagsContext.Provider>
);

export const useFeatureFlag = (name: string): boolean => {
  const flags = useContext(FeatureFlagsContext);
  return Boolean(flags[name]);
};
