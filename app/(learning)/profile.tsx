import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";

import {
  Button,
  Card,
  IconButton,
  Input,
  Screen,
  Typography,
} from "../../components";
import { useAuth } from "../../hooks/useAuth";
import { apiRequest } from "../../lib/api";
import { asRecord, asText } from "../../lib/learning";
import { colors, radii, spacing } from "../../theme/tokens";

function getInitials(displayName: string, email: string) {
  const source = displayName.trim() || email.split("@")[0] || "Learner";
  const words = source.split(/\s+/).filter(Boolean);
  return words.length > 1
    ? `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase()
    : source.slice(0, 2).toUpperCase();
}

export default function ProfileScreen() {
  const router = useRouter();
  const { bootstrap, refreshBootstrap, session, signOut, user } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const profile = asRecord(bootstrap?.profile);

  useEffect(() => {
    const task = setTimeout(
      () => setDisplayName(asText(profile.displayName ?? profile.name)),
      0,
    );
    return () => clearTimeout(task);
  }, [profile.displayName, profile.name]);

  useEffect(() => {
    if (!saved) return;
    const task = setTimeout(() => setSaved(false), 3500);
    return () => clearTimeout(task);
  }, [saved]);

  const save = async () => {
    if (!session?.access_token) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await apiRequest("/api/user-profile", {
        method: "PUT",
        accessToken: session.access_token,
        body: { profile: { displayName: displayName.trim() } },
      });
      await refreshBootstrap();
      setSaved(true);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Your profile could not be saved. Try again online.",
      );
    } finally {
      setSaving(false);
    }
  };

  const leave = async () => {
    setSigningOut(true);
    setError(null);
    try {
      await signOut();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Sign out did not complete.",
      );
      setSigningOut(false);
    }
  };

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <View style={styles.top}>
        <IconButton
          icon="arrow-left"
          label="Go back"
          onPress={() => router.back()}
        />
        <Typography variant="screenTitle">Profile</Typography>
        <View style={styles.spacer} />
      </View>
      <Card variant="outlined" style={styles.profileCard}>
        <View style={styles.identity}>
          <View style={styles.avatar}>
            <Typography
              variant="heading"
              color={colors.ink}
              style={styles.avatarText}
            >
              {getInitials(displayName, user?.email ?? "")}
            </Typography>
          </View>
          <View style={styles.identityCopy}>
            <Typography variant="bodyMedium" style={styles.email}>
              {user?.email ?? "Signed-in learner"}
            </Typography>
            <Typography variant="bodySmall" color={colors.textSecondary}>
              Your LearnPath account
            </Typography>
          </View>
        </View>
        <Input
          label="Display name"
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="How should we greet you?"
          maxLength={80}
          autoCapitalize="words"
          style={styles.nameInput}
        />
        <Button
          label="Save profile"
          onPress={() => void save()}
          loading={saving}
          disabled={!displayName.trim()}
        />
        {saved ? (
          <View style={styles.savedRow}>
            <MaterialCommunityIcons
              name="check"
              size={20}
              color={colors.success}
            />
            <Typography variant="bodyMedium" color={colors.success}>
              Profile saved.
            </Typography>
          </View>
        ) : null}
        {error ? (
          <Typography
            accessibilityRole="alert"
            variant="caption"
            color={colors.error}
          >
            {error}
          </Typography>
        ) : null}
      </Card>
      <Card
        variant="outlined"
        style={styles.preferenceCard}
        onPress={() => router.push("/(learning)/settings" as never)}
        accessibilityLabel="Open learning preferences"
      >
        <View style={styles.linkRow}>
          <View style={styles.linkIcon}>
            <MaterialCommunityIcons
              name="tune-variant"
              size={20}
              color={colors.primaryDark}
            />
          </View>
          <View style={styles.identityCopy}>
            <Typography variant="bodyMedium">Learning preferences</Typography>
            <Typography variant="caption" color={colors.textSecondary}>
              Study time, experience, and style
            </Typography>
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            size={20}
            color={colors.textMuted}
          />
        </View>
      </Card>
      <Card variant="outlined" style={styles.accountCard}>
        <Typography variant="bodyMedium">Account</Typography>
        <Typography
          variant="caption"
          color={colors.textSecondary}
          style={styles.accountText}
        >
          Your account is managed by LearnPath and Supabase. Password recovery
          is available from the sign-in screen. Account deletion is not
          currently available in the app.
        </Typography>
        <Pressable
          accessibilityLabel="Sign out"
          accessibilityRole="button"
          accessibilityState={{ busy: signingOut, disabled: signingOut }}
          disabled={signingOut}
          onPress={() => void leave()}
          style={({ pressed }) => [
            styles.signOutButton,
            pressed && styles.signOutPressed,
            signingOut && styles.signOutDisabled,
          ]}
        >
          {signingOut ? (
            <ActivityIndicator color={colors.ink} />
          ) : (
            <>
              <MaterialCommunityIcons
                name="logout-variant"
                size={22}
                color={colors.ink}
              />
              <Typography variant="button" color={colors.ink}>
                Sign out
              </Typography>
            </>
          )}
        </Pressable>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingBottom: spacing.xl },
  profileCard: { borderRadius: radii.card, padding: spacing.xl },
  preferenceCard: { borderRadius: radii.card, paddingVertical: spacing.mdPlus },
  accountCard: { borderRadius: radii.card, padding: spacing.xl },
  top: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  spacer: { width: 48 },
  identity: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 102,
    height: 102,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  email: { fontSize: 20, lineHeight: 25 },
  avatarText: { fontSize: 34, lineHeight: 40 },
  identityCopy: { flex: 1, gap: 3 },
  linkRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  linkIcon: {
    width: 56,
    height: 56,
    borderRadius: radii.lg,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primarySoft,
  },
  accountText: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    lineHeight: 27,
  },
  nameInput: {
    minHeight: 60,
    borderWidth: 0,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: spacing.lg,
    fontSize: 18,
  },
  signOutButton: {
    minHeight: 60,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceSubtle,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  signOutPressed: { opacity: 0.78 },
  signOutDisabled: { opacity: 0.55 },
  savedRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    marginTop: spacing.md,
  },
});
