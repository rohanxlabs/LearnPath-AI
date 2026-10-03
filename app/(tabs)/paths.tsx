import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import {
  Button,
  CacheNotice,
  Card,
  Screen,
  SectionHeader,
  TextLink,
  Typography,
} from "../../components";
import { useAuth } from "../../hooks/useAuth";
import type { BootstrapData } from "../../hooks/useAuth";
import { useActivePath } from "../../providers/ActivePathProvider";
import { colors, radii, spacing } from "../../theme/tokens";

type JsonRecord = Record<string, unknown>;
const record = (value: unknown): JsonRecord =>
  value && typeof value === "object" ? (value as JsonRecord) : {};
const list = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
const text = (value: unknown, fallback = ""): string =>
  typeof value === "string" ? value : fallback;
const percent = (value: unknown): number => {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.min(100, number)) : 0;
};

export default function PathsTab() {
  const router = useRouter();
  const { activeRoadmapId, setActiveRoadmapId } = useActivePath();
  const {
    bootstrap,
    bootstrapLoading,
    bootstrapError,
    bootstrapStale,
    bootstrapSavedAt,
    refreshBootstrap,
  } = useAuth();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const roadmaps = list((bootstrap as BootstrapData | null)?.roadmaps).map(
    record,
  );

  return (
    <Screen scroll contentContainerStyle={styles.screenContent}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Typography variant="label" color={colors.primary}>
            YOUR LEARNING
          </Typography>
          <Typography variant="heading">Paths</Typography>
        </View>
        <View style={styles.headerIcon}>
          <MaterialCommunityIcons
            name="map-marker-path"
            size={23}
            color={colors.primary}
          />
        </View>
      </View>

      <SectionHeader title="My paths" subtitle="Choose the goal you’re actively building" />
      {bootstrapStale ? (
        <CacheNotice savedAt={bootstrapSavedAt ?? undefined} />
      ) : null}

      {bootstrapError ? (
        <Card>
          <View style={styles.errorRow}>
            <MaterialCommunityIcons
              name="cloud-alert-outline"
              size={22}
              color={colors.error}
            />
            <Typography variant="bodyMedium" style={styles.errorText}>
              Your paths couldn’t load
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
        <Card>
          <View style={styles.loadingRow}>
            <MaterialCommunityIcons
              name="loading"
              size={21}
              color={colors.primary}
            />
            <Typography color={colors.textSecondary}>
              Loading your paths…
            </Typography>
          </View>
        </Card>
      ) : null}

      {!bootstrapLoading && !bootstrapError && roadmaps.length === 0 ? (
        <Card>
          <View style={styles.emptyIllustration}>
            <MaterialCommunityIcons
              name="map-outline"
              size={31}
              color={colors.primary}
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

      {roadmaps.map((roadmap, index) => {
        const id = text(roadmap.id, `${index}`);
        const active = id === activeRoadmapId;
        return (
          <Card
            key={id}
            selected={active}
            onPress={() =>
              router.push({
                pathname: "/(learning)/roadmap/[roadmapId]",
                params: { roadmapId: id },
              } as never)
            }
            accessibilityLabel={`Open ${text(roadmap.title || roadmap.goal, "learning path")}`}
          >
            <View style={styles.pathCardTopline}>
              <View style={styles.pathCardIcon}>
                <MaterialCommunityIcons
                  name="map-marker-path"
                  size={18}
                  color={active ? colors.primary : colors.textSecondary}
                />
              </View>
              <View style={styles.pathCardBody}>
                <Typography variant="label" color={active ? colors.primary : colors.textSecondary}>
                  {active ? "ACTIVE PATH" : "PATH"}
                </Typography>
                <Typography variant="bodyMedium">
                  {text(roadmap.title || roadmap.goal, "Untitled learning path")}
                </Typography>
                <Typography variant="caption" color={colors.textSecondary}>
                  {Math.round(percent(roadmap.progressPercent ?? roadmap.progress))}% complete
                </Typography>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={20}
                color={colors.textMuted}
              />
            </View>
            <View style={styles.pathCardActions}>
              <TextLink
                label={active ? "Current path" : "Set active"}
                onPress={() => void setActiveRoadmapId(id)}
              />
              <TextLink
                label="Overview"
                onPress={() => setExpandedId(expandedId === id ? null : id)}
              />
            </View>
            {expandedId === id ? (
              <View style={styles.phaseList}>
                {list(roadmap.phases).length ? (
                  list(roadmap.phases).map((item, phaseIndex) => {
                    const phase = record(item);
                    const phaseName = text(phase.name, `Phase ${phaseIndex + 1}`);
                    const modules = list(phase.levels ?? phase.modules);
                    const lessons = modules.flatMap((module) => list(record(module).lessons));
                    return (
                      <View key={text(phase.id, `${phaseIndex}`)} style={styles.phaseRow}>
                        <View style={styles.phaseNumber}>
                          <Typography variant="caption" color={colors.primary}>
                            {phaseIndex + 1}
                          </Typography>
                        </View>
                        <View style={styles.phaseCopy}>
                          <Typography variant="bodyMedium">{phaseName}</Typography>
                          <Typography variant="caption" color={colors.textSecondary}>
                            {lessons.length
                              ? `${lessons.length} ${lessons.length === 1 ? "lesson" : "lessons"}`
                              : `${modules.length} ${modules.length === 1 ? "module" : "modules"}`}
                          </Typography>
                        </View>
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
          </Card>
        );
      })}

      {roadmaps.length > 0 ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/(onboarding)" as never)}
          style={styles.addPath}
        >
          <MaterialCommunityIcons
            name="plus-circle-outline"
            size={22}
            color={colors.primary}
          />
          <Typography variant="bodyMedium" color={colors.primary}>
            Create another path
          </Typography>
        </Pressable>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenContent: { gap: spacing.md, paddingBottom: spacing.xl },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerCopy: { gap: spacing.xs },
  headerIcon: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.full,
    backgroundColor: colors.primarySoft,
  },
  intro: { marginTop: -spacing.xs, marginBottom: spacing.sm },
  pathTopline: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  pathIcon: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.md,
    backgroundColor: colors.primarySoft,
  },
  pathTitleWrap: { flex: 1, gap: 2 },
  pathTitle: { fontSize: 19, lineHeight: 25 },
  goal: { marginTop: spacing.md },
  progressMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  pathFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.md,
  },
  pathActions: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  phaseList: {
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    gap: spacing.xs,
  },
  phaseRow: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  phaseNumber: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.full,
    backgroundColor: colors.primarySoft,
  },
  phaseCopy: { flex: 1, gap: 2 },
  pathCardTopline: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  pathCardIcon: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.md,
    backgroundColor: colors.primarySoft,
  },
  pathCardBody: { flex: 1, gap: 2 },
  pathCardActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  emptyIllustration: {
    width: 60,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.full,
    backgroundColor: colors.primarySoft,
    alignSelf: "center",
    marginBottom: spacing.sm,
  },
  emptyTitle: { textAlign: "center" },
  emptyBody: { textAlign: "center", marginVertical: spacing.sm },
  addPath: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
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
