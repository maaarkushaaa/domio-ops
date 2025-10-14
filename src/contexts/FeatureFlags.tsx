import React, { createContext, useContext, useMemo } from 'react';

export type FeatureFlags = {
  enableCharts: boolean;
  enableAI: boolean;
  enableRealtimeInvalidations: boolean;
};

const defaultFlags: FeatureFlags = {
  enableCharts: true,
  enableAI: false,
  enableRealtimeInvalidations: true,
};

const FeatureFlagsContext = createContext<FeatureFlags>(defaultFlags);

export function FeatureFlagsProvider({ children, value }: { children: React.ReactNode; value?: Partial<FeatureFlags> }) {
  const flags = useMemo(() => ({ ...defaultFlags, ...(value || {}) }), [value]);
  return <FeatureFlagsContext.Provider value={flags}>{children}</FeatureFlagsContext.Provider>;
}

export function useFeatureFlags() {
  return useContext(FeatureFlagsContext);
}
