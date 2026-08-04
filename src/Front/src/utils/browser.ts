export const isChromeOniOS = Boolean(
  typeof window !== 'undefined' &&
    /CriOS/.test(navigator.userAgent) &&
    /iPhone|iPad|iPod/.test(navigator.userAgent)
);
