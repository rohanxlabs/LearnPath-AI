import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";

import { AuthError, AuthScreen } from "../../components/auth/AuthScreen";
import { Button, Input, Typography } from "../../components";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";
import { colors, spacing } from "../../theme/tokens";

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{ code?: string | string[] }>();
  const code = Array.isArray(params.code) ? params.code[0] : params.code;
  const router = useRouter();
  const { status, updatePassword, refreshSession } = useAuth();
  const [verified, setVerified] = useState(false);
  const [exchangeError, setExchangeError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const ready = verified || (!code && status === "authenticated");
  const error = exchangeError || (!supabase && code ? "This reset link could not be verified. Request a new link and try again." : null) || (!code && status !== "loading" && status !== "authenticated" ? "Open the password reset link from your email on this device." : null);

  useEffect(() => {
    let active = true;
    if (!code || !supabase) return;
    void (async () => {
      const { error: cause } = await supabase.auth.exchangeCodeForSession(code);
      if (!active) return;
      if (cause) {
        setExchangeError("This reset link is invalid or expired. Request another link to continue.");
        return;
      }
      await refreshSession();
      if (active) setVerified(true);
    })().catch(() => {
      if (active) setExchangeError("This reset link is invalid or expired. Request another link to continue.");
    });
    return () => { active = false; };
  }, [code, refreshSession]);

  const submit = async () => {
    setExchangeError(null);
    setMessage(null);
    if (password.length < 10 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
      setExchangeError("Use at least 10 characters with a letter, a number, and a symbol.");
      return;
    }
    if (password !== confirmPassword) {
      setExchangeError("Those passwords don’t match yet.");
      return;
    }
    setLoading(true);
    try {
      await updatePassword(password);
      setMessage("Your password has been updated.");
      setPassword("");
      setConfirmPassword("");
    } catch (cause) {
      setExchangeError(cause instanceof Error ? cause.message : "Your password could not be updated. Request a new reset link and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreen title="Choose a new password" subtitle="Use a strong password you haven’t used here before.">
      {error ? <AuthError message={error} /> : null}
      {message ? <Typography color={colors.success}>{message}</Typography> : null}
      {ready && !message ? (
        <>
          <Input label="New password" value={password} onChangeText={setPassword} placeholder="Create a strong password" secureTextEntry autoCapitalize="none" autoComplete="new-password" textContentType="newPassword" />
          <Input label="Confirm new password" value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Enter it again" secureTextEntry autoCapitalize="none" autoComplete="new-password" textContentType="newPassword" onSubmitEditing={() => void submit()} />
          <Typography variant="caption" color={colors.textSecondary}>At least 10 characters, including a letter, number, and symbol.</Typography>
          <Button label="Update password" loading={loading} onPress={() => void submit()} />
        </>
      ) : null}
      {message ? <Button label="Continue to LearnPath" onPress={() => router.replace("/(tabs)/home" as Href)} /> : null}
      {error ? <Typography accessibilityRole="button" accessibilityLabel="Return to sign in" color={colors.primary} onPress={() => router.replace("/(auth)/sign-in" as Href)} style={{ textAlign: "center", padding: spacing.sm }}>Back to sign in</Typography> : null}
    </AuthScreen>
  );
}