import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { Button, Card, IconButton, Screen, Typography } from "../../components";
import { useAuth } from "../../hooks/useAuth";
import { apiRequest } from "../../lib/api";
import { asRecord } from "../../lib/learning";
import { colors, radii, spacing } from "../../theme/tokens";

const stylesOptions = [
  "Hands-on Projects",
  "Hands-on",
  "Theory First",
  "Theoretical",
  "Mixed",
  "Video Tutorials",
  "Visual",
];
const experienceOptions = [
  "Complete Beginner",
  "Beginner",
  "Some Experience",
  "Intermediate",
  "Advanced",
  "Expert",
];
const weeklyOptions = [2, 5, 8, 12, 20];
const sessionOptions = [15, 25, 30, 45, 60];

function ChoiceRow<T extends string | number>({
  label,
  options,
  value,
  onChange,
  render,
}: {
  label: string;
  options: T[];
  value: T;
  onChange: (value: T) => void;
  render: (value: T) => string;
}) {
  return (
    <View style={styles.choiceGroup}>
      <Typography variant="sectionTitle">{label}</Typography>
      <View style={styles.options}>
        {options.map((option) => (
          <Pressable
            key={String(option)}
            accessibilityRole="radio"
            accessibilityState={{ checked: value === option }}
            onPress={() => onChange(option)}
            style={[styles.option, value === option && styles.selected]}
          >
            {value === option ? (
              <MaterialCommunityIcons
                name="check"
                size={16}
                color={colors.primaryDark}
              />
            ) : null}
            <Typography
              variant="bodyMedium"
              color={
                value === option ? colors.primaryDark : colors.textSecondary
              }
            >
              {render(option)}
            </Typography>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { bootstrap, refreshBootstrap, session } = useAuth();
  const profile = asRecord(bootstrap?.profile);
  const learnerProfile = asRecord(profile.learnerProfile);
  const preferences = asRecord(learnerProfile.preferences);
  const background = asRecord(learnerProfile.background);
  const [experience, setExperience] = useState("Beginner");
  const [weeklyHours, setWeeklyHours] = useState(5);
  const [sessionLength, setSessionLength] = useState(25);
  const [learningStyle, setLearningStyle] = useState("Mixed");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const task = setTimeout(() => {
      const nextExperience =
        typeof background.experienceLevel === "string"
          ? background.experienceLevel
          : "Beginner";
      setExperience(
        experienceOptions.includes(nextExperience)
          ? nextExperience
          : "Beginner",
      );
      const nextHours = Number(preferences.weeklyHours) || 5;
      setWeeklyHours(weeklyOptions.includes(nextHours) ? nextHours : 5);
      const nextLength = Number(preferences.sessionLength) || 25;
      setSessionLength(sessionOptions.includes(nextLength) ? nextLength : 25);
      const nextStyle =
        typeof preferences.learningStyle === "string"
          ? preferences.learningStyle
          : "Mixed";
      setLearningStyle(stylesOptions.includes(nextStyle) ? nextStyle : "Mixed");
    }, 0);
    return () => clearTimeout(task);
  }, [
    background.experienceLevel,
    preferences.learningStyle,
    preferences.sessionLength,
    preferences.weeklyHours,
  ]);

  useEffect(() => {
    if (!saved) return;
    const task = setTimeout(() => setSaved(false), 3500);
    return () => clearTimeout(task);
  }, [saved]);

  const save = async () => {
    if (!session?.access_token) return;
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      await apiRequest("/api/user-profile", {
        method: "PUT",
        accessToken: session.access_token,
        body: {
          learnerProfile: {
            background: { experienceLevel: experience },
            preferences: { weeklyHours, sessionLength, learningStyle },
          },
        },
      });
      await refreshBootstrap();
      setSaved(true);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Your preferences could not be saved. Check your connection and retry.",
      );
    } finally {
      setSaving(false);
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
        <Typography variant="screenTitle" style={styles.headerTitle}>
          Learning preferences
        </Typography>
        <View style={styles.spacer} />
      </View>
      <Typography variant="body" color={colors.textSecondary} style={styles.intro}>
        These choices can guide future learning paths. Change them whenever your
        schedule or experience changes.
      </Typography>
      <Card variant="outlined" style={styles.preferencesCard}>
        <ChoiceRow
          label="Your experience"
          options={experienceOptions}
          value={experience}
          onChange={setExperience}
          render={(value) => value}
        />
        <ChoiceRow
          label="Time available each week"
          options={weeklyOptions}
          value={weeklyHours}
          onChange={setWeeklyHours}
          render={(value) => `${value} hr${value === 1 ? "" : "s"}`}
        />
        <ChoiceRow
          label="Preferred session length"
          options={sessionOptions}
          value={sessionLength}
          onChange={setSessionLength}
          render={(value) => `${value} min`}
        />
        <ChoiceRow
          label="Learning style preference"
          options={stylesOptions}
          value={learningStyle}
          onChange={setLearningStyle}
          render={(value) => value}
        />
        <Typography
          variant="caption"
          color={colors.textMuted}
          style={styles.note}
        >
          Learning style is a preference you control, not a fixed learning type.
        </Typography>
        <Button
          label="Save preferences"
          size="large"
          loading={saving}
          onPress={() => void save()}
        />
        {saved ? (
          <View style={styles.savedRow}>
            <MaterialCommunityIcons
              name="check"
              size={19}
              color={colors.success}
            />
            <Typography variant="bodyMedium" color={colors.success}>
              Preferences saved.
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
      <Card variant="outlined" style={styles.infoCard}>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons
            name="bell-outline"
            size={20}
            color={colors.textMuted}
          />
          <View style={styles.infoCopy}>
            <Typography variant="bodyMedium">Study reminders</Typography>
            <Typography variant="caption" color={colors.textSecondary}>
              Reminders are not enabled yet. The app will not request
              notification permission.
            </Typography>
          </View>
        </View>
      </Card>
      <Card variant="outlined" style={styles.infoCard}>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons
            name="theme-light-dark"
            size={20}
            color={colors.textMuted}
          />
          <View style={styles.infoCopy}>
            <Typography variant="bodyMedium">Appearance</Typography>
            <Typography variant="caption" color={colors.textSecondary}>
              LearnPath currently follows the app’s light appearance.
            </Typography>
          </View>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingBottom: spacing.xl },
  top: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  spacer: { flex: 1 },
  headerTitle: { flexShrink: 1 },
  intro: { lineHeight: 28, marginBottom: spacing.sm },
  preferencesCard: { borderRadius: radii.card, padding: spacing.mdPlus },
  infoCard: { borderRadius: radii.card, padding: spacing.lg },
  choiceGroup: { gap: spacing.sm, marginBottom: spacing.xl },
  options: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  option: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  selected: {
    borderColor: colors.primaryDark,
    backgroundColor: colors.primarySoft,
  },
  note: { marginBottom: spacing.md, marginTop: -spacing.md, lineHeight: 21 },
  infoRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  infoCopy: { flex: 1, gap: spacing.xs },
  savedRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
});
