import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";

import {
  Button,
  CacheNotice,
  Card,
  IconButton,
  ProgressBar,
  Screen,
  Typography,
} from "../../../components";
import { useAuth } from "../../../hooks/useAuth";
import { cachedApiRequest } from "../../../lib/cachedApi";
import {
  asText,
  flattenLessons,
  normalizeRoadmap,
  type LearningPhase,
  type LearningRoadmap,
} from "../../../lib/learning";
import { stripLessonBodies } from "../../../lib/mobileCache";
import { colors, radii, spacing } from "../../../theme/tokens";

type NextActionResponse = {
  target?: { lessonId?: string; phaseId?: string; title?: string } | null;
  decision?: { reason?: string; rationale?: string; type?: string };
};

function lessonStatus(lessonStatus: string, isRecommended: boolean) {
  if (lessonStatus === "completed")
    return {
      icon: "check-circle",
      label: "Completed",
      color: colors.success,
    } as const;
  if (
    isRecommended ||
    lessonStatus === "available" ||
    lessonStatus === "current" ||
    lessonStatus === "in_progress"
  ) {
    return {
      icon: isRecommended ? "play-circle" : "circle-outline",
      label: isRecommended ? "Recommended" : "Ready",
      color: colors.primary,
    } as const;
  }
  return {
    icon: "lock-outline",
    label: "Locked",
    color: colors.textMuted,
  } as const;
}

function PhaseCard({
  phase,
  index,
  expanded,
  currentLessonId,
  onToggle,
  onOpenLesson,
}: {
  phase: LearningPhase;
  index: number;
  expanded: boolean;
  currentLessonId: string | null;
  onToggle: () => void;
  onOpenLesson: (lessonId: string, status: string) => void;
}) {
  const lessons = phase.modules.flatMap((module) => module.lessons);
  const completedCount = lessons.filter(
    (lesson) => lesson.status === "completed",
  ).length;
  const complete =
    phase.status === "completed" ||
    (lessons.length > 0 && completedCount === lessons.length);
  const locked =
    phase.status === "locked" ||
    (lessons.length > 0 &&
      lessons.every((lesson) => lesson.status === "locked"));
  const icon = complete
    ? "check"
    : locked
      ? "lock"
      : expanded
        ? "circle-slice-8"
        : "circle-outline";
  const iconColor = complete
    ? colors.success
    : locked
      ? colors.textMuted
      : colors.primary;

  return (
    <View style={styles.phaseShell}>
      <View style={styles.journeyRail} />
      <View
        style={[
          styles.phaseMarker,
          complete && styles.phaseMarkerComplete,
          locked && styles.phaseMarkerLocked,
        ]}
      >
        <MaterialCommunityIcons
          name={icon}
          size={18}
          color={complete ? colors.surface : iconColor}
        />
      </View>
      <View style={styles.phaseContent}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded, disabled: locked }}
          disabled={locked}
          onPress={onToggle}
          style={styles.phaseHeader}
        >
          <View style={styles.phaseHeadingCopy}>
            <Typography
              variant="label"
              color={
                complete
                  ? colors.success
                  : locked
                    ? colors.textMuted
                    : colors.primary
              }
            >
              {complete
                ? "COMPLETED"
                : locked
                  ? "LOCKED"
                  : `PHASE ${index + 1}`}
            </Typography>
            <Typography variant="title" style={locked && styles.lockedText}>
              {phase.name}
            </Typography>
            <Typography variant="caption" color={colors.textSecondary}>
              {locked
                ? "Unlocks as you complete earlier lessons"
                : `${completedCount} of ${lessons.length} ${lessons.length === 1 ? "lesson" : "lessons"}${phase.estimatedHours ? ` · about ${phase.estimatedHours}h` : ""}`}
            </Typography>
          </View>
          {!locked ? (
            <MaterialCommunityIcons
              name={expanded ? "chevron-up" : "chevron-down"}
              size={23}
              color={colors.textMuted}
            />
          ) : null}
        </Pressable>
        {!locked && phase.description ? (
          <Typography
            variant="caption"
            color={colors.textSecondary}
            style={styles.phaseDescription}
          >
            {phase.description}
          </Typography>
        ) : null}
        {expanded && !locked ? (
          <View style={styles.moduleList}>
            {phase.modules.map((module) => (
              <View key={module.id} style={styles.moduleBlock}>
                <View style={styles.moduleHeader}>
                  <MaterialCommunityIcons
                    name="layers-outline"
                    size={18}
                    color={colors.textSecondary}
                  />
                  <Typography variant="bodyMedium" style={styles.moduleName}>
                    {module.name}
                  </Typography>
                  <Typography variant="caption" color={colors.textMuted}>
                    {module.lessons.length}
                  </Typography>
                </View>
                {module.lessons.map((lesson) => {
                  const recommended = lesson.id === currentLessonId;
                  const status = lessonStatus(lesson.status, recommended);
                  const disabled = status.label === "Locked" || !lesson.id;
                  return (
                    <Pressable
                      key={lesson.id}
                      accessibilityRole={disabled ? "text" : "button"}
                      accessibilityState={{ disabled, selected: recommended }}
                      onPress={() =>
                        !disabled &&
                        lesson.id &&
                        onOpenLesson(lesson.id, lesson.status)
                      }
                      style={[
                        styles.lessonRow,
                        recommended && styles.recommendedLesson,
                        disabled && styles.lockedLesson,
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={status.icon}
                        size={21}
                        color={status.color}
                      />
                      <View style={styles.lessonCopy}>
                        <Typography
                          variant="bodyMedium"
                          style={disabled && styles.lockedText}
                        >
                          {lesson.name}
                        </Typography>
                        <Typography
                          variant="caption"
                          color={colors.textSecondary}
                        >
                          {recommended ? "Recommended next" : status.label}
                          {lesson.estimatedMinutes
                            ? ` · ${lesson.estimatedMinutes} min`
                            : ""}
                        </Typography>
                      </View>
                      {!disabled ? (
                        <MaterialCommunityIcons
                          name="chevron-right"
                          size={20}
                          color={colors.textMuted}
                        />
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

export default function RoadmapScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ roadmapId?: string | string[] }>();
  const roadmapId = Array.isArray(params.roadmapId)
    ? params.roadmapId[0]
    : params.roadmapId;
  const { session, user } = useAuth();
  const [roadmap, setRoadmap] = useState<LearningRoadmap | null>(null);
  const [targetLessonId, setTargetLessonId] = useState<string | null>(null);
  const [recommendedTitle, setRecommendedTitle] = useState<string | null>(null);
  const [recommendationReason, setRecommendationReason] = useState<
    string | null
  >(null);
  const [cachedAt, setCachedAt] = useState<string | null>(null);
  const [expandedPhaseId, setExpandedPhaseId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRoadmap = useCallback(async () => {
    if (!roadmapId || !session?.access_token || !user?.id) {
      setError(
        "This roadmap link is missing information. Return to Paths and open it again.",
      );
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [roadmapResult, nextActionResult] = await Promise.all([
        cachedApiRequest<{ roadmap?: unknown }>(
          user.id,
          `roadmap:${roadmapId}`,
          `/api/roadmaps/${encodeURIComponent(roadmapId)}`,
          {
            accessToken: session.access_token,
            cacheTransform: (data) => ({
              ...data,
              roadmap: stripLessonBodies(data.roadmap),
            }),
          },
        ),
        cachedApiRequest<NextActionResponse>(
          user.id,
          `next-action:${roadmapId}`,
          `/api/roadmaps/${encodeURIComponent(roadmapId)}/next-action`,
          { accessToken: session.access_token },
        ).catch(() => null),
      ]);
      const nextActionResponse = nextActionResult?.data;
      const nextAction = nextActionResponse?.target;
      const normalized = normalizeRoadmap(roadmapResult.data.roadmap);
      if (!normalized.id)
        throw new Error("This learning path could not be found.");
      const lessons = flattenLessons(normalized);
      const resolvedTargetId =
        nextAction?.lessonId ||
        lessons.find((lesson) =>
          ["available", "current", "in_progress"].includes(lesson.status),
        )?.id ||
        null;
      setRoadmap(normalized);
      setCachedAt(
        roadmapResult.stale
          ? roadmapResult.savedAt
          : nextActionResult?.stale
            ? nextActionResult.savedAt
            : null,
      );
      setTargetLessonId(resolvedTargetId);
      setRecommendedTitle(asText(nextAction?.title));
      setRecommendationReason(
        asText(
          nextActionResponse?.decision?.reason ||
            nextActionResponse?.decision?.rationale,
        ),
      );
      const target = lessons.find((lesson) => lesson.id === resolvedTargetId);
      setExpandedPhaseId(
        target?.phaseId ||
          normalized.phases.find((phase) => phase.status !== "completed")?.id ||
          normalized.phases[0]?.id ||
          null,
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Your roadmap couldn’t load. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, [roadmapId, session, user]);

  useEffect(() => {
    const task = setTimeout(() => {
      void loadRoadmap();
    }, 0);
    return () => clearTimeout(task);
  }, [loadRoadmap]);

  const nextLesson = useMemo(
    () =>
      roadmap
        ? (flattenLessons(roadmap).find(
            (lesson) => lesson.id === targetLessonId,
          ) ?? null)
        : null,
    [roadmap, targetLessonId],
  );
  const completed = roadmap
    ? flattenLessons(roadmap).filter((lesson) => lesson.status === "completed")
        .length
    : 0;
  const lessonCount = roadmap ? flattenLessons(roadmap).length : 0;

  const openLesson = (lessonId: string, status = "available") =>
    router.push({
      pathname: "/(learning)/lesson/[lessonId]",
      params: { lessonId, roadmapId: roadmapId ?? "", status },
    } as Href);

  return (
    <Screen scroll contentContainerStyle={styles.screenContent}>
      <View style={styles.topBar}>
        <IconButton
          icon="arrow-left"
          label="Back to paths"
          onPress={() => router.back()}
        />
        <Typography variant="caption" color={colors.textSecondary}>
          LEARNING ROADMAP
        </Typography>
        <View style={styles.topBarSpacer} />
      </View>

      {loading ? (
        <Card>
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} />
            <Typography color={colors.textSecondary}>
              Loading your roadmap…
            </Typography>
          </View>
        </Card>
      ) : null}
      {cachedAt ? <CacheNotice savedAt={cachedAt} /> : null}
      {error ? (
        <Card>
          <View style={styles.errorHeading}>
            <MaterialCommunityIcons
              name="cloud-alert-outline"
              size={23}
              color={colors.error}
            />
            <Typography variant="bodyMedium" style={styles.errorText}>
              Your path couldn’t load
            </Typography>
          </View>
          <Typography
            variant="caption"
            color={colors.textSecondary}
            style={styles.errorCopy}
          >
            {error}
          </Typography>
          <Button
            label="Try again"
            variant="secondary"
            loading={loading}
            onPress={() => void loadRoadmap()}
          />
        </Card>
      ) : null}

      {!loading && !error && roadmap ? (
        <>
          <Typography variant="heading">{roadmap.title}</Typography>
          {roadmap.goal && roadmap.goal !== roadmap.title ? (
            <Typography color={colors.textSecondary}>{roadmap.goal}</Typography>
          ) : null}
          <Card>
            <View style={styles.progressHeading}>
              <View style={styles.progressIcon}>
                <MaterialCommunityIcons
                  name="chart-timeline-variant"
                  size={21}
                  color={colors.primary}
                />
              </View>
              <View style={styles.progressCopy}>
                <Typography variant="bodyMedium">Your progress</Typography>
                <Typography variant="caption" color={colors.textSecondary}>
                  {completed} of {lessonCount} lessons complete
                </Typography>
              </View>
              <Typography variant="title" color={colors.primary}>
                {Math.round(roadmap.progressPercent)}%
              </Typography>
            </View>
            <ProgressBar
              value={roadmap.progressPercent / 100}
              label={`${roadmap.title} ${Math.round(roadmap.progressPercent)} percent complete`}
            />
          </Card>

          {nextLesson ? (
            <Card>
              <View style={styles.nextEyebrow}>
                <MaterialCommunityIcons
                  name="creation"
                  size={17}
                  color={colors.primary}
                />
                <Typography variant="label" color={colors.primary}>
                  YOUR NEXT STEP
                </Typography>
              </View>
              <Typography variant="title" style={styles.nextTitle}>
                {recommendedTitle || nextLesson.name}
              </Typography>
              <Typography
                variant="caption"
                color={colors.textSecondary}
                style={styles.nextReason}
              >
                {recommendationReason ||
                  `About ${nextLesson.estimatedMinutes} minutes · ${nextLesson.xpReward} XP`}
              </Typography>
              <Button
                label="Continue this lesson"
                onPress={() => openLesson(nextLesson.id, nextLesson.status)}
              />
            </Card>
          ) : null}

          <View style={styles.journeyHeading}>
            <Typography variant="title">Your journey</Typography>
            <Typography variant="caption" color={colors.textSecondary}>
              Open a phase to see its lessons.
            </Typography>
          </View>
          {roadmap.phases.map((phase, index) => (
            <PhaseCard
              key={phase.id}
              phase={phase}
              index={index}
              expanded={expandedPhaseId === phase.id}
              currentLessonId={targetLessonId}
              onToggle={() =>
                setExpandedPhaseId(
                  expandedPhaseId === phase.id ? null : phase.id,
                )
              }
              onOpenLesson={openLesson}
            />
          ))}
          {roadmap.phases.length === 0 ? (
            <Card>
              <Typography variant="bodyMedium">
                Your roadmap is being prepared
              </Typography>
              <Typography
                variant="caption"
                color={colors.textSecondary}
                style={styles.emptyCopy}
              >
                There are no phases to show yet. Try refreshing in a moment.
              </Typography>
              <Button
                label="Refresh roadmap"
                variant="secondary"
                onPress={() => void loadRoadmap()}
              />
            </Card>
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenContent: { gap: spacing.md, paddingBottom: spacing.xl },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  topBarSpacer: { width: 48 },
  loading: {
    minHeight: 100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  errorHeading: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  errorText: { color: colors.error },
  errorCopy: { marginTop: spacing.sm, marginBottom: spacing.md },
  progressHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  progressIcon: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.md,
    backgroundColor: colors.primarySoft,
  },
  progressCopy: { flex: 1, gap: 2 },
  nextEyebrow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  nextTitle: { marginTop: spacing.sm },
  nextReason: { marginTop: spacing.xs, marginBottom: spacing.md },
  journeyHeading: {
    gap: spacing.xs,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  phaseShell: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: spacing.md,
    minHeight: 64,
  },
  journeyRail: {
    position: "absolute",
    left: 16,
    top: 34,
    bottom: -spacing.md,
    width: 2,
    backgroundColor: colors.border,
  },
  phaseMarker: {
    zIndex: 1,
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: radii.full,
    backgroundColor: colors.background,
    marginTop: spacing.sm,
  },
  phaseMarkerComplete: {
    borderColor: colors.success,
    backgroundColor: colors.success,
  },
  phaseMarkerLocked: {
    borderColor: colors.borderStrong,
    backgroundColor: colors.background,
  },
  phaseContent: {
    flex: 1,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
  },
  phaseHeader: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  phaseHeadingCopy: { flex: 1, gap: 3 },
  lockedText: { color: colors.textMuted },
  phaseDescription: { marginTop: spacing.sm },
  moduleList: {
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  moduleBlock: { marginTop: spacing.sm },
  moduleHeader: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  moduleName: { flex: 1 },
  lessonRow: {
    minHeight: 60,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
  },
  recommendedLesson: { backgroundColor: colors.primaryTint },
  lockedLesson: { opacity: 0.75 },
  lessonCopy: { flex: 1, gap: 2 },
  emptyCopy: { marginVertical: spacing.md },
});
