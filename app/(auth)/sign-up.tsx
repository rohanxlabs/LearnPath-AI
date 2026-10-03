import { useState } from "react";
import { useRouter, type Href } from "expo-router";
import { View } from "react-native";

import { AuthError, AuthScreen } from "../../components/auth/AuthScreen";
import { Button, Card, Input, Typography } from "../../components";
import { useAuth } from "../../hooks/useAuth";
import { colors, spacing } from "../../theme/tokens";

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp, authConfigError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(null);
    setMessage(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    if (password.length < 10 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
      setError("Use at least 10 characters with a letter, a number, and a symbol.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Those passwords don’t match yet.");
      return;
    }

    setLoading(true);
    try {
      const signedIn = await signUp(email, password);
      if (signedIn) router.replace("/(onboarding)" as Href);
      else setMessage("Check your inbox for a verification link. Open it on this device to finish creating your account.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Your account could not be created. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreen title="Create your account" subtitle="Start with your goal. You can shape the details as you learn.">
      {authConfigError ? <AuthError message={authConfigError} /> : null}
      {error ? <AuthError message={error} /> : null}
      {message ? (
        <Card>
          <Typography variant="bodyMedium">Check your email</Typography>
          <Typography color={colors.textSecondary} style={{ marginTop: spacing.xs }}>{message}</Typography>
        </Card>
      ) : null}
      <Input label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" returnKeyType="next" />
      <Input label="Password" value={password} onChangeText={setPassword} placeholder="Create a strong password" secureTextEntry autoCapitalize="none" autoComplete="new-password" textContentType="newPassword" returnKeyType="next" />
      <Input label="Confirm password" value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Enter it again" secureTextEntry autoCapitalize="none" autoComplete="new-password" textContentType="newPassword" returnKeyType="done" onSubmitEditing={() => void submit()} />
      <Typography variant="caption" color={colors.textSecondary}>At least 10 characters, including a letter, number, and symbol.</Typography>
      <Button label="Create account" loading={loading} disabled={Boolean(authConfigError)} onPress={() => void submit()} />
      <View style={{ alignItems: "center" }}>
        <Typography accessibilityRole="button" accessibilityLabel="Sign in to an existing account" color={colors.primary} onPress={() => router.replace("/(auth)/sign-in" as Href)} style={{ padding: spacing.sm }}>
          Already have an account? Sign in
        </Typography>
      </View>
    </AuthScreen>
  );
}
