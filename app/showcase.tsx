import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

import {
  Avatar,
  Badge,
  Button,
  Card,
  CacheNotice,
  Chip,
  Divider,
  IconButton,
  Input,
  ProgressBar,
  Screen,
  SectionHeader,
  Skeleton,
  Typography,
  LearningState,
  FeedbackState,
} from "../components";
import {
  colors,
  elevation,
  learningColors,
  radii,
  spacing,
} from "../theme/tokens";

export default function DesignSystemShowcase() {
  return (
    <Screen scroll keyboardAvoiding>
      <Typography variant="label" color={colors.primary}>
        LEARNPATH DESIGN SYSTEM · PHASE 1
      </Typography>
      <Typography variant="display" style={styles.title}>
        Clarity builds momentum.
      </Typography>
      <Typography color={colors.textSecondary} style={styles.intro}>
        A calm, reusable mobile foundation for focused learning.
      </Typography>

      <SectionHeader title="Type scale" />
      <Card variant="outlined">
        <Typography variant="display">Display</Typography>
        <Typography variant="screenTitle">Screen title</Typography>
        <Typography variant="sectionHeading">Section heading</Typography>
        <Typography variant="cardTitle">Card title</Typography>
        <Typography variant="body">
          Body text supports longer learning content and readable line lengths.
        </Typography>
        <Typography variant="bodyMedium">Emphasized body</Typography>
        <Typography variant="bodySmall" color={colors.textSecondary}>
          Supporting body copy
        </Typography>
        <Typography variant="label">LABEL</Typography>
        <Typography variant="caption" color={colors.textMuted}>
          Caption · secondary detail
        </Typography>
        <Typography variant="button">Button text · 15 / 20</Typography>
        <Typography variant="numeric" color={colors.primary}>
          68%
        </Typography>
        <Typography variant="navigation" color={colors.textSecondary}>
          Navigation label
        </Typography>
      </Card>

      <SectionHeader title="Semantic colors" />
      <View style={styles.swatches}>
        {[
          ["Brand", colors.primary],
          ["Brand soft", colors.primarySoft],
          ["Background", colors.background],
          ["Surface", colors.surface],
          ["Text", colors.text],
          ["Secondary", colors.textSecondary],
          ["Success", colors.successSoft],
          ["Warning", colors.warningSoft],
          ["Error", colors.errorSoft],
          ["Info", colors.infoSoft],
          ["Focus", colors.focus],
        ].map(([label, color]) => (
          <View key={label} style={styles.swatchItem}>
            <View
              style={[
                styles.swatch,
                { backgroundColor: color, borderColor: colors.border },
              ]}
            />
            <Typography variant="caption">{label}</Typography>
          </View>
        ))}
      </View>

      <SectionHeader title="Buttons" />
      <View style={styles.column}>
        <Button label="Primary action" size="large" />
        <Button label="Secondary action" variant="secondary" />
        <Button label="Outline action" variant="outline" />
        <View style={styles.row}>
          <Button label="Ghost" variant="ghost" size="small" />
          <Button label="Destructive" variant="destructive" size="small" />
        </View>
        <View style={styles.row}>
          <Button label="Loading" loading />
          <Button label="Disabled" disabled />
        </View>
        <Button
          label="Continue learning"
          accessibilityHint="Opens the next lesson in your path"
        />
      </View>

      <SectionHeader title="Surfaces and depth" />
      <View style={styles.column}>
        <Card>
          <Typography variant="cardTitle">Default surface</Typography>
          <Typography variant="bodySmall" color={colors.textSecondary}>
            Quiet content surface with clear hierarchy.
          </Typography>
        </Card>
        <Card variant="elevated">
          <Typography variant="cardTitle">Elevated surface</Typography>
          <Typography variant="bodySmall" color={colors.textSecondary}>
            Used sparingly for content that needs separation.
          </Typography>
        </Card>
        <Card variant="outlined">
          <Typography variant="cardTitle">Outlined surface</Typography>
        </Card>
        <Card variant="subtle">
          <Typography variant="cardTitle">Subtle surface</Typography>
        </Card>
        <Card
          selected
          onPress={() => undefined}
          accessibilityLabel="Selected interactive card"
        >
          <Typography variant="cardTitle">Selected interactive card</Typography>
        </Card>
      </View>

      <SectionHeader title="Inputs" />
      <View style={styles.column}>
        <Input
          label="Learning goal"
          placeholder="e.g. Build a portfolio website"
        />
        <Input
          label="Focused example"
          placeholder="Focus state uses the semantic focus color"
        />
        <Input
          label="Needs attention"
          placeholder="Correct the highlighted field"
          error="Add a little more detail to continue."
        />
        <Input
          label="Unavailable"
          value="Not currently editable"
          editable={false}
        />
      </View>

      <SectionHeader title="Chips, badges and icons" />
      <View style={styles.row}>
        <Chip label="All topics" selected />
        <Chip label="Design" onPress={() => undefined} />
        <Chip label="Disabled" disabled />
      </View>
      <View style={styles.row}>
        <Badge label="Available" />
        <Badge label="Complete" tone="success" />
        <Badge label="In progress" tone="inProgress" />
        <Badge label="Review" tone="needsReview" />
        <Badge label="Recommended" tone="recommended" />
        <Badge label="Locked" tone="locked" />
        <Badge label="Mastered" tone="mastered" />
        <Badge label="Info" tone="info" />
      </View>
      <View style={styles.row}>
        <IconButton icon="bookmark-outline" label="Save learning path" />
        <IconButton icon="check" label="Selected example" selected />
        <IconButton icon="delete-outline" label="Delete item" size="small" />
        <Avatar initials="LP" label="LearnPath avatar" />
      </View>

      <SectionHeader title="Learning states" />
      <View style={styles.column}>
        {(Object.keys(learningColors) as (keyof typeof learningColors)[]).map(
          (status) => (
            <LearningState
              key={status}
              status={status}
              supportingText={
                status === "recommended"
                  ? "A useful next step based on your goal."
                  : undefined
              }
            />
          ),
        )}
      </View>

      <SectionHeader title="Progress" />
      <Card variant="outlined">
        <Typography variant="cardTitle">Learning path</Typography>
        <Typography
          variant="bodySmall"
          color={colors.textSecondary}
          style={styles.progressLabel}
        >
          68% · 8 of 12 lessons
        </Typography>
        <ProgressBar value={0.68} label="Learning path 68 percent" />
        <Divider />
        <Typography variant="caption" color={colors.textSecondary}>
          Lesson · phase · roadmap · skill use the same accessible progress
          primitive.
        </Typography>
        <ProgressBar value={1} tone="success" label="Skill completed" />
      </Card>

      <SectionHeader title="Loading, empty, error and offline" />
      <View style={styles.column}>
        <FeedbackState
          kind="loading"
          message="Loading your learning content…"
        />
        <Skeleton width="100%" height={18} label="Loading lesson title" />
        <Skeleton width="72%" height={14} label="Loading lesson summary" />
        <FeedbackState
          kind="empty"
          message="Your saved learning paths will appear here."
          actionLabel="Explore paths"
          onAction={() => undefined}
        />
        <FeedbackState
          kind="error"
          message="We couldn’t load this content. Your progress has not been changed."
          actionLabel="Try again"
          onAction={() => undefined}
        />
        <FeedbackState
          kind="offline"
          message="This saved lesson is available offline. Sending answers requires an internet connection."
        />
        <CacheNotice>
          Offline copy available. Some actions require an internet connection.
        </CacheNotice>
      </View>

      <SectionHeader title="Layout tokens and controls" />
      <Card variant="subtle">
        <Typography variant="bodyMedium">Spacing scale</Typography>
        <Typography variant="caption" color={colors.textSecondary}>
          4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64
        </Typography>
        <Divider />
        <Typography variant="bodyMedium">Radii</Typography>
        <View style={styles.row}>
          <View style={[styles.radiusSample, { borderRadius: radii.sm }]} />
          <View style={[styles.radiusSample, { borderRadius: radii.md }]} />
          <View style={[styles.radiusSample, { borderRadius: radii.lg }]} />
          <View style={[styles.radiusSample, { borderRadius: radii.xl }]} />
          <View style={[styles.radiusSample, { borderRadius: radii.full }]} />
        </View>
        <Typography variant="caption" color={colors.textSecondary}>
          Depth stays soft: subtle, card, and floating elevations.
        </Typography>
      </Card>
      <Card variant="elevated">
        <Typography variant="cardTitle">Icon sizing</Typography>
        <View style={styles.row}>
          {[16, 20, 24, 32].map((size) => (
            <MaterialCommunityIcons
              key={size}
              name="school-outline"
              size={size}
              color={colors.primary}
            />
          ))}
          <Typography variant="caption">16 · 20 · 24 · 32</Typography>
        </View>
      </Card>
      <SectionHeader title="Navigation and header foundation" />
      <Card variant="outlined">
        <Typography variant="cardTitle">Learning header</Typography>
        <View style={styles.row}>
          <IconButton icon="arrow-left" label="Go back" />
          <View style={styles.headerCopy}>
            <Typography variant="bodyMedium" numberOfLines={1}>
              Foundations of data science
            </Typography>
            <Typography variant="caption" color={colors.textSecondary}>
              Module 2 · Lesson 4
            </Typography>
          </View>
          <IconButton icon="dots-horizontal" label="More lesson actions" />
        </View>
        <Divider />
        <View style={styles.row}>
          {["Home", "Paths", "Mentor", "Progress"].map((label, index) => (
            <View key={label} style={styles.navItem}>
              <MaterialCommunityIcons
                name={
                  (
                    [
                      "home-variant-outline",
                      "map-marker-path",
                      "message-text-outline",
                      "chart-line",
                    ] as const
                  )[index]
                }
                size={24}
                color={index === 0 ? colors.primary : colors.textMuted}
              />
              <Typography
                variant="navigation"
                color={index === 0 ? colors.primary : colors.textMuted}
              >
                {label}
              </Typography>
            </View>
          ))}
        </View>
      </Card>
      <Typography
        variant="caption"
        color={colors.textMuted}
        style={styles.footer}
      >
        System fonts scale with accessibility settings. Interactive controls
        keep a 44pt minimum target.
      </Typography>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: spacing.sm },
  intro: { marginTop: spacing.sm, marginBottom: spacing.xl },
  column: { gap: spacing.md, marginBottom: spacing.lg },
  row: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  progressLabel: { marginTop: spacing.xs, marginBottom: spacing.md },
  swatches: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  swatchItem: { alignItems: "center", gap: spacing.xs, width: 76 },
  swatch: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderRadius: radii.md,
    ...elevation.subtle,
  },
  radiusSample: {
    width: 36,
    height: 36,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  headerCopy: { flex: 1 },
  navItem: { flex: 1, alignItems: "center", gap: spacing.xs },
  footer: {
    marginTop: spacing.md,
    marginBottom: spacing.xl,
    textAlign: "center",
  },
});
