import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";

import {
  Button,
  CacheNotice,
  Card,
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
      icon: "check-circle-outline",
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
      icon: isRecommended ? "play-circle-outline" : "circle-outline",
      label: isRecommended ? "Recommended" : "Ready",
      color: isRecommended ? colors.primaryDark : colors.primary,
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
        {complete ? (
          <MaterialCommunityIcons
            name="check"
            size={18}
            color={colors.surface}
          />
        ) : locked ? (
          <MaterialCommunityIcons
            name="lock-outline"
            size={16}
            color={colors.textMuted}
          />
        ) : (
          <Typography style={styles.phaseNumber}>{index + 1}</Typography>
        )}
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
          : "Your roadmap couldn't load. Please try again.",
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
      {/* Custom Header */}
      <View style={styles.customHeader}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to paths"
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.ink} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Typography variant="label" style={styles.eyebrow}>LEARNING PATH</Typography>
          <Typography style={styles.roadmapTitle}>{roadmap?.title ?? 'Loading\u2026'}</Typography>
        </View>
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
              Your path could not load
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
          {/* Progress Card */}
          <View style={styles.progressCard}>
            <View style={styles.progressRow}>
              <View style={styles.progressIcon}>
                <MaterialCommunityIcons
                  name="chart-timeline-variant"
                  size={22}
                  color={colors.primaryDark}
                />
              </View>
              <View style={styles.progressCopy}>
                <Typography variant="bodyMedium">Your progress</Typography>
                <Typography variant="caption" color={colors.textSecondary}>
                  {completed} of {lessonCount} lessons complete
                </Typography>
              </View>
              <Typography style={styles.progressPercent}>
                {Math.round(roadmap.progressPercent)}%
              </Typography>
            </View>
            <ProgressBar
              value={roadmap.progressPercent / 100}
              label={`${roadmap.title} ${Math.round(roadmap.progressPercent)} percent complete`}
            />
          </View>

          {/* Next Step Card */}
          {nextLesson ? (
            <View style={styles.nextCard} accessibilityLabel="Your next lesson">
              <View style={styles.nextEyebrow}>
                <MaterialCommunityIcons
                  name="creation"
                  size={15}
                  color={colors.ink}
                />
                <Typography variant="label" style={styles.nextEyebrowText}>
                  YOUR NEXT STEP
                </Typography>
              </View>
              <Typography style={styles.nextTitle}>
                {recommendedTitle || nextLesson.name}
              </Typography>
              <Typography variant="caption" style={styles.nextMeta}>
                {recommendationReason ||
                  `About ${nextLesson.estimatedMinutes} minutes · ${nextLesson.xpReward} XP`}
              </Typography>
              <Button
                label="Continue this lesson"
                variant="dark"
                onPress={() => openLesson(nextLesson.id, nextLesson.status)}
              />
            </View>
          ) : null}

          {/* Your Journey Section */}
          <View style={styles.journeyHeading}>
            <Typography style={styles.journeyTitle}>Your journey</Typography>
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
  customHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceSubtle,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  eyebrow: {
    color: colors.primaryDark,
    letterSpacing: 1,
  },
  roadmapTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.ink,
    letterSpacing: -0.2,
    lineHeight: 34,
  },
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
  progressCard: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radii.card,
    padding: spacing.lg,
    gap: spacing.md,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  progressIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  progressCopy: { flex: 1, gap: 2 },
  progressPercent: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.primaryDark,
  },
  nextCard: {
    backgroundColor: colors.primary,
    borderRadius: radii.card,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  nextEyebrow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  nextEyebrowText: { color: colors.ink },
  nextTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.ink,
    lineHeight: 32,
    letterSpacing: -0.2,
    marginTop: spacing.xs,
  },
  nextMeta: {
    color: "rgba(14,14,18,0.65)",
    marginBottom: spacing.sm,
  },
  journeyHeading: {
    gap: spacing.xs,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  journeyTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.ink,
  },
  phaseShell: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: spacing.md,
    minHeight: 64,
  },
  journeyRail: {
    position: "absolute",
    left: 38 / 2 - 2 / 2, // (markerWidth / 2) - (railWidth / 2) = 19 - 1 = 18
    top: 48,
    bottom: -spacing.md,
    width: 2,
    backgroundColor: colors.border,
  },
  phaseMarker: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    zIndex: 1,
    marginTop: 10,
  },
  phaseMarkerComplete: {
    backgroundColor: colors.success,
  },
  phaseMarkerLocked: {
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
  },
  phaseNumber: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.ink,
  },
  phaseContent: {
    flex: 1,
    marginBottom: spacing.md,
    padding: spacing.md,
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
  recommendedLesson: {
    backgroundColor: colors.primaryTint,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },

  lessonCopy: { flex: 1, gap: 2 },
  emptyCopy: { marginVertical: spacing.md },
});
