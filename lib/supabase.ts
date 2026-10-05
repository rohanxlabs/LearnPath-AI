import "react-native-url-polyfill/auto";

import { AppState, Platform } from "react-native";
import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";

import { sessionStorage } from "./sessionStorage";

const mobileConfig = Constants.expoConfig?.extra?.mobile as
  Record<string, unknown> | undefined;

function readConfigString(name: string): string | null {
  const value = mobileConfig?.[name];
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

const supabaseUrl = readConfigString("supabaseUrl");
const supabasePublishableKey = readConfigString("supabaseKey");

export const supabaseConfigError =
  !supabaseUrl || !supabasePublishableKey
    ? "Authentication is not configured. Add the Supabase URL and publishable key to the local Expo environment."
    : null;

export const supabase = supabaseConfigError
  ? null
  : createClient(supabaseUrl!, supabasePublishableKey!, {
      auth: {
        storage: sessionStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        flowType: "pkce",
      },
    });

if (supabase && Platform.OS !== "web") {
  AppState.addEventListener("change", (state) => {
    if (state === "active") supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
