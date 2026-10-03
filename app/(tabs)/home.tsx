import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";

import {
  Button,
  Card,
  CacheNotice,
  ProgressBar,
  Screen,
  Typography,
  TextLink,
} from "../../components";
import { useActivePath } from "../../providers/ActivePathProvider";
import { useAuth } from "../../hooks/useAuth";
import { cachedApiRequest } from "../../lib/cachedApi";
import {
  flattenLessons,
  normalizeRoadmap,
  asRecord,
  asText,
} from "../../lib/learning";
import { colors, radii, spacing } from "../../theme/tokens";

type Recommendation = {
  decision?: { action?: string; reason?: string };
  target?: { lessonId?: string; title?: string } | null;
};

export default function HomeTab() {
  const router = useRouter();
  const {
    bootstrap,
    bootstrapLoading,
    bootstrapSavedAt,
    bootstrapStale,
    session,
    user,
  } = useAuth();
  const {
    activeRoadmapId,
    ready: activePathReady,
    setActiveRoadmapId,
  } = useActivePath();
  const [recommendation, setRecommendation] = useState<Recommendation | null>(
    null,
  );
  const [recommendationStaleAt, setRecommendationStaleAt] = useState<
    string | null
  >(null);
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [recommendationError, setRecommendationError] = useState<string | null>(
    null,
  );
  const roadmaps = useMemo(
    () => (bootstrap?.roadmaps ?? []).map(normalizeRoadmap),
    [bootstrap?.roadmaps],
  );
  const selectedRoadmap = roadmaps.find(
    (roadmap) => roadmap.id === activeRoadmapId,
  );
  const roadmap =
    selectedRoadmap ??
    roadmaps.find((item) => item.status !== "completed") ??
    roadmaps[0];
  const lessons = useMemo(
    () => (roadmap ? flattenLessons(roadmap) : []),
    [roadmap],
  );
  const localNextLesson =
    lessons.find((lesson) =>
      ["available", "current", "in_progress"].includes(lesson.status),
    ) ??
    lessons.find(
      (lesson) => lesson.status !== "completed" && lesson.status !== "locked",
    );
  const recommendedId = recommendation?.target?.lessonId;
  const nextLesson =
    lessons.find((lesson) => lesson.id === recommendedId) ?? localNextLesson;
  const profile = asRecord(bootstrap?.profile);
  const displayName = asText(
    profile.displayName ?? profile.name,
    user?.email?.split("@")[0] ?? "learner",
  );
  const activityLog = asRecord(bootstrap?.activityLog);
  const weekStart = new Date();
  weekStart.setUTCHours(0, 0, 0, 0);
  weekStart.setUTCDate(weekStart.getUTCDate() - 6);
  const weeklyLessons = Object.entries(activityLog).reduce(
    (count, [date, value]) =>
      date >= weekStart.toISOString().slice(0, 10)
        ? count + (Number(asRecord(value).lessonsCompleted) || 0)
        : count,
    0,
  );

  const loadRecommendation = useCallback(async () => {
    if (!roadmap || !user?.id || !session?.access_token) {
      setRecommendation(null);
      return;
    }
    setRecommendationLoading(true);
    setRecommendationError(null);
    try {
      const result = await cachedApiRequest<Recommendation>(
        user.id,
        `next-action:${roadmap.id}`,
        `/api/roadmaps/${encodeURIComponent(roadmap.id)}/next-action`,
        { accessToken: session.access_token },
      );
      setRecommendation(result.data);
      setRecommendationStaleAt(result.stale ? result.savedAt : null);
    } catch (error) {
      setRecommendationError(
        error instanceof Error
          ? error.message
          : "The recommendation is temporarily unavailable.",
      );
      setRecommendation(null);
      setRecommendationStaleAt(null);
    } finally {
      setRecommendationLoading(false);
    }
  }, [roadmap, session, user]);

  useEffect(() => {
    const task = setTimeout(() => void loadRecommendation(), 0);
    return () => clearTimeout(task);
  }, [loadRecommendation]);

  const openLesson = () => {
    if (!roadmap || !nextLesson) return;
    router.push({
      pathname: "/(learning)/lesson/[lessonId]",
      params: {
        lessonId: nextLesson.id,
        roadmapId: roadmap.id,
        status: nextLesson.status,
      },
    } as never);
  };
  const pathTitle = roadmap?.title ?? "your learning path";
  const actionReason = recommendation?.decision?.reason;
  const activityMessage =
    weeklyLessons > 0
      ? `${weeklyLessons} ${weeklyLessons === 1 ? "lesson" : "lessons"} completed recently`
      : `${Number(profile.streak) || 0} day learning streak`;

  return (
    <Screen scroll contentContainerStyle={styles.screen}>
      <View style={styles.header}>
        <View style={styles.brandText}>
          <Typography variant="caption" color={colors.textSecondary}>
            WELCOME BACK
          </Typography>
          <Typography variant="heading">Hi, {displayName}</Typography>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open your profile"
          onPress={() => router.push("/(learning)/profile" as never)}
          style={styles.profileButton}
        >
          <Typography variant="bodyMedium" color={colors.primary}>
            {displayName.slice(0, 1).toUpperCase()}
          </Typography>
        </Pressable>
      </View>

      {bootstrapStale ? (
        <CacheNotice savedAt={bootstrapSavedAt ?? undefined} />
      ) : null}

      {roadmaps.length > 1 ? (
        <View style={styles.pathChooser}>
          <Typography variant="caption" color={colors.textSecondary}>
            ACTIVE PATH
          </Typography>
          <View style={styles.pathPills}>
            {roadmaps.map((item) => (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityState={{ selected: item.id === roadmap?.id }}
                onPress={() => void setActiveRoadmapId(item.id)}
                style={[
                  styles.pathPill,
                  item.id === roadmap?.id && styles.pathPillActive,
                ]}
              >
                <Typography
                  variant="caption"
                  color={
                    item.id === roadmap?.id
                      ? colors.primaryDark
                      : colors.textSecondary
                  }
                  numberOfLines={1}
                >
                  {item.title}
                </Typography>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      {bootstrapLoading && !bootstrap ? (
        <Card>
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.primary} />
            <Typography color={colors.textSecondary}>
              Loading your next step…
            </Typography>
          </View>
        </Card>
      ) : null}

      {!bootstrapLoading && roadmaps.length === 0 ? (
        <Card>
          <View style={styles.emptyIcon}>
            <MaterialCommunityIcons
              name="map-outline"
              size={27}
              color={colors.primary}
            />
          </View>
          <Typography variant="title">Start with a learning goal</Typography>
          <Typography color={colors.textSecondary} style={styles.cardCopy}>
            Build a path around something you want to understand or achieve.
          </Typography>
          <Button
            label="Create a learning path"
            onPress={() => router.push("/(onboarding)" as never)}
          />
        </Card>
      ) : null}

      {roadmap ? (
        <Card>
          <View style={styles.actionEyebrow}>
            <MaterialCommunityIcons
              name="book-open-page-variant-outline"
              size={17}
              color={colors.primary}
            />
            <Typography variant="label" color={colors.primary}>
              CONTINUE LEARNING
            </Typography>
          </View>
          <Typography variant="label" color={colors.textSecondary}>
            {pathTitle}
          </Typography>
          {nextLesson ? (
            <>
              <Typography variant="lessonSubheading" style={styles.lessonTitle}>
                {recommendation?.target?.title ?? nextLesson.name}
              </Typography>
              <Typography variant="caption" color={colors.textSecondary}>
                {nextLesson.phaseId ? "Current lesson" : "Next lesson"}
              </Typography>
              <Typography
                variant="caption"
                color={colors.textSecondary}
                style={styles.lessonMeta}
              >
                {nextLesson.estimatedMinutes} min ·{" "}
                {nextLesson.status === "completed" ? "Review" : "Next lesson"}
              </Typography>
              <Button label="Continue" onPress={openLesson} />
            </>
          ) : (
            <>
              <Typography color={colors.textSecondary} style={styles.cardCopy}>
                This path has no available lessons right now.
              </Typography>
              <Button
                label="View learning path"
                variant="secondary"
                onPress={() =>
                  router.push({
                    pathname: "/(learning)/roadmap/[roadmapId]",
                    params: { roadmapId: roadmap.id },
                  } as never)
                }
              />
            </>
          )}
          <View style={styles.progressLine}>
            <View style={styles.progressCopy}>
              <Typography variant="caption" color={colors.textSecondary}>
                Path progress
              </Typography>
              <Typography variant="caption" color={colors.textSecondary}>
                {roadmap.lessonsCompleted} lessons ·{" "}
                {Math.round(roadmap.progressPercent)}%
              </Typography>
            </View>
            <ProgressBar
              value={roadmap.progressPercent / 100}
              label={`${pathTitle}, ${Math.round(roadmap.progressPercent)} percent complete`}
            />
          </View>
          {actionReason ? (
            <Typography
              variant="caption"
              color={colors.textSecondary}
              style={styles.reason}
            >
              {actionReason}
            </Typography>
          ) : null}
          {recommendationLoading ? (
            <View style={styles.inlineLoading}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Typography variant="caption" color={colors.textSecondary}>
                Checking your next step…
              </Typography>
            </View>
          ) : null}
          {recommendationError ? (
            <Typography variant="caption" color={colors.textMuted}>
              {recommendationError} Showing the next available lesson instead.
            </Typography>
          ) : null}
        </Card>
      ) : null}

      {recommendationStaleAt && roadmap ? (
        <CacheNotice savedAt={recommendationStaleAt} />
      ) : null}

      {roadmap ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/(tabs)/progress" as never)}
          style={styles.activityCard}
        >
          <View style={styles.activityIcon}>
            <MaterialCommunityIcons
              name={weeklyLessons ? "check-circle-outline" : "fire"}
              size={20}
              color={colors.primary}
            />
          </View>
          <View style={styles.activityCopy}>
            <Typography variant="bodyMedium">{activityMessage}</Typography>
            <Typography variant="caption" color={colors.textSecondary}>
              Small, steady sessions add up.
            </Typography>
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            size={20}
            color={colors.textMuted}
          />
        </Pressable>
      ) : null}

      <View style={styles.secondaryLinks}>
        <TextLink
          label="View all paths"
          onPress={() => router.push("/(tabs)/paths" as never)}
        />
        <TextLink
          label="Ask Mentor"
          onPress={() => router.push("/(tabs)/mentor" as never)}
        />
        <TextLink
          label="Progress"
          onPress={() => router.push("/(tabs)/progress" as never)}
        />
      </View>
      {!activePathReady && !bootstrapLoading ? (
        <Typography
          variant="caption"
          color={colors.textMuted}
          style={styles.footer}
        >
          Restoring your active learning path…
        </Typography>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { gap: spacing.md, paddingBottom: spacing.xl },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  brandText: { flex: 1, gap: spacing.xs },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: radii.full,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.primarySoft,
  },
  pathChooser: { gap: spacing.sm },
  pathPills: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  pathPill: {
    maxWidth: "100%",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.full,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
  },
  pathPillActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryTint,
  },
  actionEyebrow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  pathTitle: { marginBottom: spacing.sm },
  lessonTitle: { marginTop: spacing.xs },
  lessonMeta: { marginTop: spacing.xs, marginBottom: spacing.md },
  progressLine: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingTop: spacing.md,
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  progressCopy: { flexDirection: "row", justifyContent: "space-between" },
  reason: { marginTop: spacing.xs, marginBottom: spacing.md, lineHeight: 22 },
  inlineLoading: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  activityCard: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primarySoft,
  },
  activityCopy: { flex: 1, gap: 2 },
  emptyIcon: {
    width: 54,
    height: 54,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primarySoft,
    marginBottom: spacing.md,
  },
  cardCopy: { marginTop: spacing.sm, marginBottom: spacing.md },
  secondaryLinks: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
  },
  loadingRow: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  footer: {
    textAlign: "center",
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
});
