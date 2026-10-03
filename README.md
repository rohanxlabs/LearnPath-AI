# LearnPath AI mobile

Expo + React Native frontend for LearnPath AI. The app uses the existing LearnPath API for product data and Supabase Auth for identity.

## Local setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env` and set `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_SUPABASE_URL`, and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
   - `EXPO_PUBLIC_API_URL` is the API origin, such as `https://your-service.example.com`, without `/api` at the end.
   - For a physical device on a local network, use the computer's LAN IP and port instead of `localhost`.
   - These `EXPO_PUBLIC_` values are bundled into the client. Never put service-role keys, database URLs, or AI provider keys here.
3. In Supabase Auth URL configuration, allow the app callback URLs `learnpath://callback` and `learnpath://reset-password`. Add the active Expo development redirect URL while testing email links in development.
4. Start Expo with `npx expo start`.

The mobile app sends the Supabase access token as `Authorization: Bearer <token>` to the configured LearnPath API. The API must allow the app's auth redirect URIs in the Supabase project. Session token fields are stored using Expo SecureStore; the remaining Supabase session metadata uses AsyncStorage.

## Checks

- `npm run typecheck`
- `npm run lint`