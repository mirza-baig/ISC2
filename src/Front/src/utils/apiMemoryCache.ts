type CacheEntry<T> = { value: T; expiresAt: number };

const cacheStore = new Map<string, CacheEntry<unknown>>();

export async function getWithCache<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const cached = cacheStore.get(key);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.value as T;
  }

  const value = await fetcher();
  cacheStore.set(key, { value, expiresAt: Date.now() + ttlMs });

  return value;
}
