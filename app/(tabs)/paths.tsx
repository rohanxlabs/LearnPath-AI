import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

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

function RoadmapCard({
  roadmap,
  expanded,
  onToggle,
  onOpen,
  active,
  onSetActive,
}: {
  roadmap: JsonRecord;
  expanded: boolean;
  onToggle: () => void;
  onOpen: () => void;
  active: boolean;
  onSetActive: () => void;
}) {
  const phases = list(roadmap.phases);
  const title = text(roadmap.title || roadmap.goal, "Untitled learning path");
  const progress = percent(roadmap.progressPercent ?? roadmap.progress);

  return (
    <Card>
      <View style={styles.pathTopline}>
        <View style={styles.pathIcon}>
          <MaterialCommunityIcons
            name="map-marker-path"
            size={21}
            color={colors.primary}
          />
        </View>
        <View style={styles.pathTitleWrap}>
          <Typography variant="label" color={colors.primary}>
            LEARNING PATH
          </Typography>
          <Typography variant="title" style={styles.pathTitle}>
            {title}
          </Typography>
        </View>
        <MaterialCommunityIcons
          name="dots-horizontal"
          size={22}
          color={colors.textMuted}
          accessibilityElementsHidden
        />
      </View>
      {roadmap.goal && roadmap.title ? (
        <Typography color={colors.textSecondary} style={styles.goal}>
          {text(roadmap.goal)}
        </Typography>
      ) : null}
      <View style={styles.progressMeta}>
        <Typography variant="caption" color={colors.textSecondary}>
          {text(
            roadmap.status,
            progress > 0 ? "In progress" : "Ready to begin",
          )}
        </Typography>
        <Typography variant="caption" color={colors.textSecondary}>
          {Math.round(progress)}%
        </Typography>
      </View>
      <ProgressBar
        value={progress / 100}
        label={`${title}, ${Math.round(progress)} percent complete`}
      />
      <View style={styles.pathFooter}>
        <Typography variant="caption" color={colors.textMuted}>
          {active
            ? "Active path"
            : phases.length
              ? `${phases.length} ${phases.length === 1 ? "phase" : "phases"}`
              : "Learning path"}
        </Typography>
        <View style={styles.pathActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded }}
            onPress={onToggle}
            style={styles.viewButton}
          >
            <Typography variant="caption" color={colors.primary}>
              {expanded ? "Hide overview" : "Overview"}
            </Typography>
            <MaterialCommunityIcons
              name={expanded ? "chevron-up" : "chevron-down"}
              size={19}
              color={colors.primary}
            />
          </Pressable>
          {!active ? (
            <Pressable
              accessibilityRole="button"
              onPress={onSetActive}
              style={styles.viewButton}
            >
              <Typography variant="caption" color={colors.primary}>
                Set active
              </Typography>
            </Pressable>
          ) : null}
          <Pressable
            accessibilityRole="button"
            onPress={onOpen}
            style={styles.viewButton}
          >
            <Typography variant="caption" color={colors.primary}>
              Open path
            </Typography>
            <MaterialCommunityIcons
              name="chevron-right"
              size={19}
              color={colors.primary}
            />
          </Pressable>
        </View>
      </View>
      {expanded ? (
        <View style={styles.phaseList}>
          {phases.length ? (
            phases.map((item, index) => {
              const phase = record(item);
              const phaseName = text(phase.name, `Phase ${index + 1}`);
              const modules = list(phase.levels ?? phase.modules);
              const lessons = modules.flatMap((module) =>
                list(record(module).lessons),
              );
              return (
                <View key={text(phase.id, `${index}`)} style={styles.phaseRow}>
                  <View style={styles.phaseNumber}>
                    <Typography variant="caption" color={colors.primary}>
                      {index + 1}
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
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={20}
                    color={colors.textMuted}
                  />
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
}

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
      <Typography color={colors.textSecondary} style={styles.intro}>
        Every goal gets a clear sequence of lessons and practice.
      </Typography>
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
          <RoadmapCard
            key={id}
            roadmap={roadmap}
            expanded={expandedId === id}
            onToggle={() => setExpandedId(expandedId === id ? null : id)}
            onOpen={() =>
              router.push({
                pathname: "/(learning)/roadmap/[roadmapId]",
                params: { roadmapId: id },
              } as never)
            }
            active={active}
            onSetActive={() => void setActiveRoadmapId(id)}
          />
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
  viewButton: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingLeft: spacing.sm,
  },
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
