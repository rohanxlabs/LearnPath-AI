import { useState } from "react";
import { useRouter, type Href } from "expo-router";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { FontAwesome } from "@expo/vector-icons";

import { AuthError, AuthScreen } from "../../components/auth/AuthScreen";
import { AuthTextField } from "../../components/auth/AuthTextField";
import { Button, Typography } from "../../components";
import { useAuth } from "../../hooks/useAuth";
import { colors, radii, spacing, welcomeColors } from "../../theme/tokens";

export default function SignInScreen() {
  const router = useRouter();
  const { signIn, signInWithGoogle, authConfigError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const submit = async () => {
    setError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Enter your password to continue.");
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

  const continueWithGoogle = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      if (await signInWithGoogle()) router.replace("/(tabs)/home" as Href);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Google sign-in could not be completed.");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <AuthScreen welcome title={'Your learning journey\nstarts here.'} subtitle="Create your path and learn a little every day.">
      {authConfigError ? <AuthError message={__DEV__ ? authConfigError : "Sign-in is temporarily unavailable. Please try again later."} /> : null}
      {error ? <AuthError message={error} /> : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Continue with Google"
        onPress={() => void continueWithGoogle()}
        disabled={googleLoading || loading || Boolean(authConfigError)}
        style={({ pressed }) => [styles.googleButton, pressed && styles.pressed]}
      >
        {googleLoading ? <ActivityIndicator color={welcomeColors.white} /> : <>
          <FontAwesome name="google" size={22} color="#4285F4" />
          <Typography variant="bodyStrong" color={welcomeColors.white}>Continue with Google</Typography>
        </>}
      </Pressable>
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Typography color={colors.textMuted}>or</Typography>
        <View style={styles.dividerLine} />
      </View>
      <AuthTextField accessibilityLabel="Email" icon="email-outline" value={email} onChangeText={setEmail} placeholder="Enter your email" keyboardType="email-address" autoComplete="email" textContentType="emailAddress" returnKeyType="next" />
      <AuthTextField accessibilityLabel="Password" icon="lock-outline" value={password} onChangeText={setPassword} placeholder="Enter your password" secureTextEntry={!showPassword} onToggleSecureTextEntry={() => setShowPassword((value) => !value)} autoComplete="current-password" textContentType="password" returnKeyType="done" onSubmitEditing={() => void submit()} />
      <View style={styles.forgotRow}>
        <Typography accessibilityRole="button" accessibilityLabel="Forgot password?" color={welcomeColors.brandBlue} onPress={() => router.push("/(auth)/forgot-password" as Href)} style={styles.forgotLink}>
          Forgot password?
        </Typography>
      </View>
      <Button label="Continue" size="large" loading={loading} disabled={googleLoading || Boolean(authConfigError)} onPress={() => void submit()} />
      <View style={styles.footer}>
        <Typography color={colors.textSecondary}>Don&apos;t have an account? </Typography>
        <Pressable accessibilityRole="button" accessibilityLabel="Sign up" onPress={() => router.push("/(auth)/sign-up" as Href)} hitSlop={8}>
          <Typography variant="bodyStrong" color={welcomeColors.brandBlue}>Sign up</Typography>
        </Pressable>
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  googleButton: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    borderRadius: radii.full,
    backgroundColor: welcomeColors.nearBlack,
  },
  pressed: { opacity: 0.82 },
  divider: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginVertical: spacing.xs },
  dividerLine: { height: 1, flex: 1, backgroundColor: "#E2E3E9" },
  forgotRow: { alignItems: "flex-end", marginTop: -spacing.sm },
  forgotLink: { paddingVertical: spacing.sm, fontWeight: "600" },
  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: spacing.md, flexWrap: "wrap" },
});
