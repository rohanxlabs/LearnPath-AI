import AsyncStorage from "@react-native-async-storage/async-storage";

const CACHE_PREFIX = "learnpath-mobile-cache-v1";
const safePart = (value: string) => value.replace(/[^a-zA-Z0-9._-]/g, "_");

export type CachedValue<T> = { data: T; savedAt: string };

export function userCacheStorageKey(userId: string, key: string) {
  return `${CACHE_PREFIX}.${safePart(userId)}.${safePart(key)}`;
}

export async function readCached<T>(
  userId: string,
  key: string,
): Promise<CachedValue<T> | null> {
  try {
    const value = await AsyncStorage.getItem(userCacheStorageKey(userId, key));
    if (!value) return null;
    const parsed = JSON.parse(value) as CachedValue<T>;
    if (!parsed || typeof parsed.savedAt !== "string" || !("data" in parsed))
      return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function writeCached<T>(
  userId: string,
  key: string,
  data: T,
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      userCacheStorageKey(userId, key),
      JSON.stringify({
        data,
        savedAt: new Date().toISOString(),
      } satisfies CachedValue<T>),
    );
  } catch {
    // A cache failure should never turn a successful server request into an error.
  }
}

export async function clearUserCache(userId: string): Promise<void> {
  try {
    const prefix = `${CACHE_PREFIX}.${safePart(userId)}.`;
    const keys = (await AsyncStorage.getAllKeys()).filter((key) =>
      key.startsWith(prefix),
    );
    if (keys.length) await AsyncStorage.multiRemove(keys);
  } catch {
    // Cache cleanup is best effort; cache keys are scoped to the auth user ID.
  }
}

/** Drop lesson payloads and generated content from a cached bootstrap roadmap. */
export function stripLessonBodies<T>(value: T): T {
  if (Array.isArray(value)) return value.map(stripLessonBodies) as T;
  if (!value || typeof value !== "object") return value;
  const record = value as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(record)) {
    if (
      [
        "content",
        "markdownContent",
        "markdown_content",
        "summary",
        "quizQuestions",
        "codingExercise",
      ].includes(key)
    )
      continue;
    result[key] = stripLessonBodies(nested);
  }
  return result as T;
}
