import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const TOKEN_FIELDS = ["access_token", "refresh_token", "provider_token", "provider_refresh_token"] as const;
const SESSION_MARKER = "__learnpath_secure_fields";
const KEY_PREFIX = "learnpath-auth";
const webSession = new Map<string, string>();

type SessionRecord = Record<string, unknown> & { [SESSION_MARKER]?: string[] };

function secureKey(key: string, field = "value") {
  return `${KEY_PREFIX}.${key}.${field}`.replace(/[^a-zA-Z0-9._-]/g, "_");
}

/** Supabase's session blob can exceed native secure-store value limits. Keep token fields in SecureStore and the remaining session metadata in AsyncStorage. */
export const sessionStorage = {
  async getItem(key: string): Promise<string | null> {
    // Web preview sessions stay in memory; SecureStore is native-only.
    if (Platform.OS === "web") return webSession.get(key) ?? null;

    const stored = await AsyncStorage.getItem(key);
    if (stored !== null) {
      try {
        const record = JSON.parse(stored) as SessionRecord;
        const secureFields = record[SESSION_MARKER];
        if (Array.isArray(secureFields)) {
          for (const field of secureFields) {
            const value = await SecureStore.getItemAsync(secureKey(key, field));
            if (value === null) return null;
            record[field] = value;
          }
          delete record[SESSION_MARKER];
          return JSON.stringify(record);
        }
      } catch {
        // Non-JSON Supabase values such as PKCE verifiers are stored as-is.
      }
      return stored;
    }
    return SecureStore.getItemAsync(secureKey(key));
  },

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === "web") {
      webSession.set(key, value);
      return;
    }

    let record: SessionRecord | null = null;
    try {
      const parsed = JSON.parse(value) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) record = parsed as SessionRecord;
    } catch {
      // PKCE verifier and other scalar values are small and stored securely.
    }

    if (record && TOKEN_FIELDS.some((field) => typeof record?.[field] === "string")) {
      const secureFields: string[] = [];
      for (const field of TOKEN_FIELDS) {
        const token = record[field];
        if (typeof token === "string") {
          await SecureStore.setItemAsync(secureKey(key, field), token);
          secureFields.push(field);
          delete record[field];
        }
      }
      record[SESSION_MARKER] = secureFields;
      await AsyncStorage.setItem(key, JSON.stringify(record));
      await SecureStore.deleteItemAsync(secureKey(key)).catch(() => undefined);
      return;
    }

    await SecureStore.setItemAsync(secureKey(key), value);
    await AsyncStorage.removeItem(key);
  },

  async removeItem(key: string): Promise<void> {
    if (Platform.OS === "web") {
      webSession.delete(key);
      return;
    }

    await AsyncStorage.removeItem(key);

    await Promise.all([
      SecureStore.deleteItemAsync(secureKey(key)).catch(() => undefined),
      ...TOKEN_FIELDS.map((field) => SecureStore.deleteItemAsync(secureKey(key, field)).catch(() => undefined)),
    ]);
  },
};
