type CacheKey = string; // `${projectId}:${mediaId}`

const urlCache = new Map<CacheKey, string>();
const pendingCache = new Map<CacheKey, Promise<string | null>>();
const MAX_CACHE_SIZE = 100; // LRU limit to prevent unbounded growth

function makeKey(projectId: string, mediaId: string): CacheKey {
  return `${projectId}:${mediaId}`;
}

export function setPreviewUrl(projectId: string, mediaId: string, blob: Blob): string {
  const key = makeKey(projectId, mediaId);
  revokePreviewUrl(projectId, mediaId);
  const url = URL.createObjectURL(blob);
  urlCache.set(key, url);

  // Enforce LRU limit - evict oldest entries when cache exceeds limit
  if (urlCache.size > MAX_CACHE_SIZE) {
    const oldestKey = urlCache.keys().next().value;
    if (oldestKey) {
      const oldestUrl = urlCache.get(oldestKey);
      if (oldestUrl) URL.revokeObjectURL(oldestUrl);
      urlCache.delete(oldestKey);
      pendingCache.delete(oldestKey);
    }
  }

  return url;
}

export function getCachedPreviewUrl(projectId: string, mediaId: string): string | undefined {
  return urlCache.get(makeKey(projectId, mediaId));
}

export async function getOrCreatePreviewUrl(
  projectId: string,
  mediaId: string,
  loader: () => Promise<Blob | null>
): Promise<string | null> {
  const key = makeKey(projectId, mediaId);
  const cached = urlCache.get(key);
  if (cached) return cached;

  const pending = pendingCache.get(key);
  if (pending) {
    return pending;
  }

  const promise = loader().then((blob) => {
    pendingCache.delete(key);
    if (!blob) return null;
    return setPreviewUrl(projectId, mediaId, blob);
  });

  pendingCache.set(key, promise);
  return promise;
}

export function revokePreviewUrl(projectId: string, mediaId: string) {
  const key = makeKey(projectId, mediaId);
  const existing = urlCache.get(key);
  if (existing) {
    URL.revokeObjectURL(existing);
    urlCache.delete(key);
  }
  pendingCache.delete(key);
}

export function revokeProjectPreviewUrls(projectId: string) {
  for (const key of Array.from(urlCache.keys())) {
    if (key.startsWith(`${projectId}:`)) {
      const url = urlCache.get(key);
      if (url) URL.revokeObjectURL(url);
      urlCache.delete(key);
      pendingCache.delete(key);
    }
  }
}

export function clearPreviewCache() {
  for (const [, url] of urlCache) {
    URL.revokeObjectURL(url);
  }
  urlCache.clear();
  pendingCache.clear();
}
