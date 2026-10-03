import type { ExpoConfig, ConfigContext } from "expo/config";

/**
 * Expose only the mobile client's public configuration from the shared .env.
 * Never add service-role keys, database credentials, or AI provider keys here.
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: config.name ?? "learnpath-mobile",
  slug: config.slug ?? "learnpath-mobile",
  extra: {
    ...config.extra,
    mobile: {
      supabaseUrl:
        process.env.EXPO_PUBLIC_SUPABASE_URL ||
        process.env.SUPABASE_URL ||
        process.env.VITE_SUPABASE_URL ||
        null,
      supabaseKey:
        process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
        process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
        process.env.SUPABASE_ANON_KEY ||
        process.env.VITE_SUPABASE_ANON_KEY ||
        null,
      apiUrl: process.env.EXPO_PUBLIC_API_URL || null,
    },
  },
});
