import { useRouter, type Href } from "expo-router";
import { StyleSheet, View } from "react-native";

import { AuthError, AuthScreen } from "../../components/auth/AuthScreen";
import { Button, Card, Typography } from "../../components";
import { useAuth } from "../../hooks/useAuth";
import { spacing } from "../../theme/tokens";

export default function WelcomeScreen() {
  const router = useRouter();
  const { authConfigError } = useAuth();
  return (
    <AuthScreen title="A clearer way to learn." subtitle="Build a path around what you want to learn, then take it one useful step at a time.">
      {authConfigError ? <AuthError message={authConfigError} /> : null}
      <Card>
        <Typography variant="bodyMedium">Your goal becomes a learning path</Typography>
        <Typography color="#686575" style={styles.body}>
          Lessons, practice, and progress stay connected as you learn.
        </Typography>
        <View style={styles.actions}>
          <Button label="Create your account" onPress={() => router.push("/(auth)/sign-up" as Href)} />
          <Button label="I already have an account" variant="secondary" onPress={() => router.push("/(auth)/sign-in" as Href)} />
        </View>
      </Card>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  body: { marginTop: spacing.xs },
  actions: { gap: spacing.sm, marginTop: spacing.lg },
});