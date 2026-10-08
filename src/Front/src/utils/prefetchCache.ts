const STORAGE_KEY = 'prefetchedHrefs';

const memoryCache = new Set<string>();

const readStoredSet = (): Set<string> => {
  if (typeof window === 'undefined') {
    return new Set();
  }

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return new Set();
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed) : new Set();
  } catch {
    return new Set();
  }
};

const writeStoredSet = (hrefs: Set<string>): void => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...hrefs]));
  } catch {}
};

export function hasPrefetched(href: string): boolean {
  if (memoryCache.has(href)) {
    return true;
  }

  const stored = readStoredSet();
  if (stored.has(href)) {
    memoryCache.add(href);
    return true;
  }

  return false;
}

export function markPrefetched(href: string): void {
  if (memoryCache.has(href)) {
    return;
  }

  memoryCache.add(href);

  const stored = readStoredSet();
  stored.add(href);
  writeStoredSet(stored);
}
