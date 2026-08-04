/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback } from 'react';
interface GAEvent {
  event?: string;
  [key: string]: string | number | boolean | undefined | null | Record<string, any>;
}

export const trackFunction = (event: any) => {
  if (typeof window !== 'undefined' && (window as any).dataLayer) {
    (window as any).dataLayer.push(event);
  }
};

export default function useAnalyticsTracking() {
  const track = useCallback((event: GAEvent) => {
    trackFunction(event);
  }, []);

  return { track };
}
