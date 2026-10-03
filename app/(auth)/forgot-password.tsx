import { useState } from "react";
import { useRouter, type Href } from "expo-router";

import { AuthError, AuthScreen } from "../../components/auth/AuthScreen";
import { Button, Card, Input, Typography } from "../../components";
import { useAuth } from "../../hooks/useAuth";
import { colors, spacing } from "../../theme/tokens";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { sendPasswordReset, authConfigError } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter the email address for your account.");
      return;
    }
    setLoading(true);
    try {
      await sendPasswordReset(email);
      setSent(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The recovery email could not be sent. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreen title="Reset your password" subtitle="We’ll send a secure link to the email address on your account.">
      {authConfigError ? <AuthError message={authConfigError} /> : null}
      {error ? <AuthError message={error} /> : null}
      {sent ? (
        <Card>
          <Typography variant="bodyMedium">Check your inbox</Typography>
          <Typography color={colors.textSecondary} style={{ marginTop: spacing.xs }}>If an account uses {email.trim()}, a password reset link is on its way.</Typography>
        </Card>
      ) : (
        <>
          <Input label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" onSubmitEditing={() => void submit()} />
          <Button label="Send reset link" loading={loading} disabled={Boolean(authConfigError)} onPress={() => void submit()} />
        </>
      )}
      <Typography accessibilityRole="button" accessibilityLabel="Return to sign in" color={colors.primary} onPress={() => router.replace("/(auth)/sign-in" as Href)} style={{ textAlign: "center", padding: spacing.sm }}>
        Back to sign in
      </Typography>
    </AuthScreen>
  );
}