import { useState } from "react";
import { useRouter, type Href } from "expo-router";
import { View } from "react-native";

import { AuthError, AuthScreen } from "../../components/auth/AuthScreen";
import { Button, Input, Typography } from "../../components";
import { useAuth } from "../../hooks/useAuth";
import { colors, spacing } from "../../theme/tokens";

export default function SignInScreen() {
  const router = useRouter();
  const { signIn, authConfigError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError("Enter your email and password to continue.");
      return;
    }
    setLoading(true);
    try {
      await signIn(email, password);
      router.replace("/(tabs)/home" as Href);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Sign in could not be completed.";
      setError(/invalid login credentials/i.test(message) ? "That email and password combination wasn’t recognized." : message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreen title="Welcome back" subtitle="Sign in to continue your learning path.">
      {authConfigError ? <AuthError message={authConfigError} /> : null}
      {error ? <AuthError message={error} /> : null}
      <Input label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" returnKeyType="next" />
      <Input label="Password" value={password} onChangeText={setPassword} placeholder="Your password" secureTextEntry autoCapitalize="none" autoComplete="current-password" textContentType="password" returnKeyType="done" onSubmitEditing={() => void submit()} />
      <View style={{ alignItems: "flex-end" }}>
        <Typography accessibilityRole="button" accessibilityLabel="Forgot password" color={colors.primary} onPress={() => router.push("/(auth)/forgot-password" as Href)} style={{ paddingVertical: spacing.sm }}>
          Forgot password?
        </Typography>
      </View>
      <Button label="Sign in" loading={loading} disabled={Boolean(authConfigError)} onPress={() => void submit()} />
      <Button label="Create an account" variant="quiet" onPress={() => router.push("/(auth)/sign-up" as Href)} />
    </AuthScreen>
  );
}