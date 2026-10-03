import { ApiError, apiRequest } from "./api";
import { readCached, writeCached, type CachedValue } from "./mobileCache";

export type CachedApiResult<T> = CachedValue<T> & { stale: boolean };

function canUseCachedResponse(error: unknown) {
  // Fetch uses TypeError for transport failures in React Native. Other unexpected
  // errors should remain visible instead of being hidden by a stale cache.
  if (error instanceof TypeError) return true;
  if (!(error instanceof ApiError)) return false;
  if (error.code === "API_NOT_CONFIGURED") return false;
  if (
    error.status === 401 ||
    error.status === 403 ||
    error.status === 404 ||
    error.status === 429
  )
    return false;
  return error.status === 0 || error.status >= 500;
}

/** Cache only explicitly selected authenticated GET data; mutations always stay online-only. */
export async function cachedApiRequest<T>(
  userId: string,
  key: string,
  path: string,
  options: {
    accessToken?: string | null;
    cacheTransform?: (data: T) => unknown;
  } = {},
): Promise<CachedApiResult<T>> {
  try {
    const data = await apiRequest<T>(path, {
      accessToken: options.accessToken,
    });
    const value: CachedValue<T> = { data, savedAt: new Date().toISOString() };
    await writeCached(userId, key, options.cacheTransform?.(data) ?? data);
    return { ...value, stale: false };
  } catch (error) {
    if (!canUseCachedResponse(error)) throw error;
    const cached = await readCached<T>(userId, key);
    if (!cached) throw error;
    return { ...cached, stale: true };
  }
}
