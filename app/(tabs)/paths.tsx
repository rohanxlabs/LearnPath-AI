import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import {
  Button,
  CacheNotice,
  Card,
  ProgressBar,
  Screen,
  Typography,
} from "../../components";
import { useAuth } from "../../hooks/useAuth";
import type { BootstrapData } from "../../hooks/useAuth";
import { asList, asRecord, asText, normalizeRoadmap } from "../../lib/learning";
import { useActivePath } from "../../providers/ActivePathProvider";
import { colors, radii, spacing } from "../../theme/tokens";

export default function PathsTab() {
  const router = useRouter();
  const { activeRoadmapId, setActiveRoadmapId, ready: activePathReady } =
    useActivePath();
  const {
    bootstrap,
    bootstrapLoading,
    bootstrapError,
    bootstrapStale,
    bootstrapSavedAt,
    refreshBootstrap,
  } = useAuth();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [settingActiveId, setSettingActiveId] = useState<string | null>(null);

  const roadmaps = useMemo(
    () =>
      asList((bootstrap as BootstrapData | null)?.roadmaps).map(
        normalizeRoadmap,
      ),
    [bootstrap],
  );
  const selectedRoadmap = roadmaps.find((roadmap) => roadmap.id === activeRoadmapId);
  const activeRoadmap =
    selectedRoadmap ??
    roadmaps.find((roadmap) => roadmap.status !== "completed") ??
    roadmaps[0];

  const openPath = (roadmapId: string) =>
    router.push({
      pathname: "/(learning)/roadmap/[roadmapId]",
      params: { roadmapId },
    } as never);

  const setActive = async (roadmapId: string) => {
    if (settingActiveId || roadmapId === activeRoadmap?.id) return;
    setSettingActiveId(roadmapId);
    try {
      await setActiveRoadmapId(roadmapId);
    } finally {
      setSettingActiveId(null);
    }
  };

  const toggleOverview = (roadmapId: string, isExpanded: boolean) =>
    setExpandedId(isExpanded ? `collapsed:${roadmapId}` : roadmapId);

  return (
    <Screen scroll contentContainerStyle={styles.screenContent}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Typography variant="label" color={colors.primaryDark} style={styles.eyebrow}>
            YOUR LEARNING
          </Typography>
          <Typography variant="display" style={styles.screenTitle}>
            Paths
          </Typography>
          <Typography color={colors.textSecondary} style={styles.subtitle}>
            Choose the goal you&apos;re actively building.
          </Typography>
        </View>
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={styles.headerIcon}
        >
          <MaterialCommunityIcons
            name="transit-connection-variant"
            size={31}
            color={colors.ink}
          />
        </View>
      </View>

      {bootstrapStale ? (
        <CacheNotice savedAt={bootstrapSavedAt ?? undefined} />
      ) : null}

      {bootstrapError ? (
        <Card variant="outlined">
          <View style={styles.errorRow}>
            <MaterialCommunityIcons
              name="cloud-alert-outline"
              size={22}
              color={colors.error}
            />
            <Typography variant="bodyMedium" style={styles.errorText}>
              Your paths couldn&apos;t load
            </Typography>
          </View>
          <Typography
            variant="caption"
            color={colors.textSecondary}
            style={styles.errorDetail}
          >
            {bootstrapError}
          </Typography>
          <Button
            label="Try again"
            variant="secondary"
            onPress={() => void refreshBootstrap()}
          />
        </Card>
      ) : null}

      {bootstrapLoading && roadmaps.length === 0 ? (
        <Card variant="outlined">
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.primaryDark} />
            <Typography color={colors.textSecondary}>
              Loading your paths�
            </Typography>
          </View>
        </Card>
      ) : null}

      {!bootstrapLoading && !bootstrapError && roadmaps.length === 0 ? (
        <Card variant="outlined">
          <View style={styles.emptyIllustration}>
            <MaterialCommunityIcons
              name="transit-connection-variant"
              size={31}
              color={colors.primaryDark}
            />
          </View>
          <Typography variant="title" style={styles.emptyTitle}>
            Your next goal starts here
          </Typography>
          <Typography color={colors.textSecondary} style={styles.emptyBody}>
            Create a learning path around something you want to understand or
            achieve.
          </Typography>
          <Button
            label="Create a learning path"
            onPress={() => router.push("/(onboarding)" as never)}
          />
        </Card>
      ) : null}

      {roadmaps.map((roadmap) => {
        const active = roadmap.id === activeRoadmap?.id;
        const expanded = expandedId === roadmap.id || (expandedId === null && active);
        const progress = Math.round(roadmap.progressPercent);
        const phases = roadmap.phases;

        return (
          <View
            key={roadmap.id}
            style={[styles.pathCard, active ? styles.activeCard : styles.inactiveCard]}
          >
            <View style={styles.pathHeader}>
              <View style={[styles.pathIcon, !active && styles.inactiveIcon]}>
                <MaterialCommunityIcons
                  name="transit-connection-variant"
                  size={25}
                  color={active ? colors.ink : colors.primaryDark}
                />
              </View>
              <View style={styles.pathHeading}>
                <Typography
                  variant="label"
                  color={active ? colors.primaryDark : colors.textSecondary}
                  style={styles.cardEyebrow}
                >
                  {active ? "ACTIVE PATH" : "PATH"}
                </Typography>
                <Typography variant="title" numberOfLines={2} style={styles.pathTitle}>
                  {roadmap.title || asText(asRecord(roadmap).goal, "Learning path")}
                </Typography>
              </View>
              <Typography variant="sectionTitle" color={active ? colors.primaryDark : colors.textSecondary} style={styles.percentage}>
                {progress}%
              </Typography>
            </View>

            {active ? (
              <View style={styles.progressWrap}>
                <ProgressBar
                  value={roadmap.progressPercent / 100}
                  label={`${roadmap.title}, ${progress} percent complete`}
                />
              </View>
            ) : null}

            {expanded ? (
              <View style={styles.phaseList}>
                {phases.length ? (
                  phases.slice(0, 3).map((phase, index) => {
                    const lessonCount = phase.modules.reduce(
                      (total, module) => total + module.lessons.length,
                      0,
                    );
                    const detail = lessonCount
                      ? `${lessonCount} ${lessonCount === 1 ? "lesson" : "lessons"}`
                      : `${phase.modules.length} ${phase.modules.length === 1 ? "module" : "modules"}`;
                    return (
                      <View key={phase.id || `${roadmap.id}-phase-${index}`} style={styles.phaseRow}>
                        <View style={styles.phaseNumber}>
                          <Typography variant="bodyMedium" color={colors.primaryDark}>
                            {index + 1}
                          </Typography>
                        </View>
                        <Typography variant="bodyMedium" numberOfLines={2} style={styles.phaseName}>
                          {phase.name}
                        </Typography>
                        <Typography variant="caption" color={colors.textSecondary} style={styles.lessonCount}>
                          {detail}
                        </Typography>
                      </View>
                    );
                  })
                ) : (
                  <Typography variant="caption" color={colors.textSecondary}>
                    This path is ready. Its roadmap will appear here when available.
                  </Typography>
                )}
              </View>
            ) : null}

            <View style={styles.actions}>
              {active ? (
                <View style={styles.primaryAction}>
                  <Button
                    label="Open path"
                    variant="dark"
                    size="large"
                    onPress={() => openPath(roadmap.id)}
                    accessibilityHint={`Open ${roadmap.title}`}
                  />
                </View>
              ) : (
                <View style={styles.primaryAction}>
                  <Button
                    label={settingActiveId === roadmap.id ? "Setting active" : "Set active"}
                    variant="primary"
                    size="large"
                    disabled={settingActiveId !== null || !activePathReady}
                    loading={settingActiveId === roadmap.id}
                    onPress={() => void setActive(roadmap.id)}
                    accessibilityHint={`Set ${roadmap.title} as active`}
                  />
                </View>
              )}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${expanded ? "Hide" : "Show"} overview for ${roadmap.title}`}
                accessibilityState={{ expanded }}
                onPress={() => toggleOverview(roadmap.id, expanded)}
                style={({ pressed }) => [styles.overviewButton, active ? styles.activeOverview : styles.inactiveOverview, pressed && styles.pressed]}
              >
                <Typography variant="bodyMedium" color={colors.primaryDark}>
                  Overview
                </Typography>
                <MaterialCommunityIcons
                  name={expanded ? "chevron-up" : "chevron-down"}
                  size={22}
                  color={colors.primaryDark}
                />
              </Pressable>
            </View>
          </View>
        );
      })}

      {roadmaps.length > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Create another learning path"
          onPress={() => router.push("/(onboarding)" as never)}
          style={({ pressed }) => [styles.addPath, pressed && styles.pressed]}
        >
          <MaterialCommunityIcons
            name="plus"
            size={24}
            color={colors.primaryDark}
          />
          <Typography variant="bodyMedium" color={colors.primaryDark}>
            Create another path
          </Typography>
        </Pressable>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenContent: { gap: spacing.lg, paddingBottom: spacing.xl },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  headerCopy: { flex: 1, gap: spacing.xs },
  eyebrow: { letterSpacing: 1 },
  screenTitle: { fontSize: 42, lineHeight: 48, letterSpacing: -1 },
  subtitle: { fontSize: 17, lineHeight: 25, marginTop: spacing.xs },
  headerIcon: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.full,
    backgroundColor: colors.primary,
  },
  pathCard: {
    padding: spacing.mdPlus,
    borderWidth: 1.5,
    borderRadius: 30,
    gap: spacing.md,
  },
  activeCard: {
    backgroundColor: colors.surfaceSelected,
    borderColor: colors.primaryDark,
    borderWidth: 2,
  },
  inactiveCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  pathHeader: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  pathIcon: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.lg,
    backgroundColor: colors.primary,
  },
  inactiveIcon: { backgroundColor: colors.surfaceSubtle },
  pathHeading: { flex: 1, gap: 1 },
  cardEyebrow: { letterSpacing: 0.8 },
  pathTitle: { fontSize: 21, lineHeight: 27 },
  percentage: { alignSelf: "center", fontSize: 20 },
  progressWrap: { marginTop: spacing.xs },
  phaseList: {
    borderTopWidth: 1,
    borderTopColor: "rgba(51, 71, 194, 0.10)",
    paddingTop: spacing.sm,
    gap: spacing.xs,
  },
  phaseRow: { minHeight: 56, flexDirection: "row", alignItems: "center", gap: spacing.md },
  phaseNumber: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.full,
    backgroundColor: colors.surface,
  },
  phaseName: { flex: 1, fontSize: 17 },
  lessonCount: { minWidth: 74, textAlign: "right", fontSize: 14 },
  actions: { flexDirection: "row", alignItems: "center", gap: spacing.smPlus },
  primaryAction: { flex: 1 },
  overviewButton: {
    minHeight: 54,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.smPlus,
    borderRadius: radii.full,
  },
  activeOverview: { backgroundColor: colors.surface },
  inactiveOverview: { backgroundColor: colors.surfaceSubtle },
  pressed: { opacity: 0.82 },
  addPath: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: colors.borderStrong,
    borderRadius: radii.full,
    backgroundColor: colors.surface,
  },
  emptyIllustration: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.full,
    backgroundColor: colors.primarySoft,
    alignSelf: "center",
    marginBottom: spacing.sm,
  },
  emptyTitle: { textAlign: "center" },
  emptyBody: { textAlign: "center", marginVertical: spacing.sm },
  loadingRow: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  errorRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  errorText: { color: colors.error },
  errorDetail: { marginTop: spacing.xs, marginBottom: spacing.md },
});
