import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { AuthError, AuthScreen } from "../../components/auth/AuthScreen";
import { Button } from "../../components";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";
import { colors } from "../../theme/tokens";

const invalidLinkMessage = "This sign-in link is incomplete or has expired. Request a new link and open it on this device.";

export default function AuthCallbackScreen() {
  const params = useLocalSearchParams<{ code?: string | string[] }>();
  const code = Array.isArray(params.code) ? params.code[0] : params.code;
  const router = useRouter();
  const { refreshSession } = useAuth();
  const [exchangeError, setExchangeError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(true);
  const hasLink = Boolean(supabase && code);
  const error = exchangeError || (!hasLink ? invalidLinkMessage : null);
  const busy = hasLink && isBusy;

  useEffect(() => {
    let active = true;
    if (!supabase || !code) return;
    void (async () => {
      const { error: cause } = await supabase.auth.exchangeCodeForSession(code);
      if (!active) return;
      if (cause) {
        setExchangeError("This sign-in link could not be verified. Request a new link and try again.");
        return;
      }
      await refreshSession();
      if (active) router.replace("/(onboarding)" as Href);
    })().catch(() => {
      if (active) setExchangeError("This sign-in link could not be verified. Request a new link and try again.");
    }).finally(() => {
      if (active) setIsBusy(false);
    });
    return () => { active = false; };
  }, [code, refreshSession, router]);

  return (
    <AuthScreen title={error ? "Link unavailable" : "Finishing sign in"} subtitle={error ? "Your account is safe. You can return to sign in and request another link." : "We’re securely connecting this device to your account."}>
      {busy ? <View style={{ alignItems: "center", padding: 24 }}><ActivityIndicator color={colors.primary} /></View> : null}
      {error ? <AuthError message={error} /> : null}
      {error ? <Button label="Return to sign in" onPress={() => router.replace("/(auth)/sign-in" as Href)} /> : null}
    </AuthScreen>
  );
}
