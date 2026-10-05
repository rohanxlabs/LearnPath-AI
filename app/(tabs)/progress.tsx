import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";

import {
  Button,
  CacheNotice,
  Card,
  ProgressBar,
  Screen,
  SectionHeader,
  Typography,
} from "../../components";
import { useAuth } from "../../hooks/useAuth";
import { cachedApiRequest } from "../../lib/cachedApi";
import {
  asList,
  asRecord,
  asText,
  flattenLessons,
  normalizeRoadmap,
} from "../../lib/learning";
import { useActivePath } from "../../providers/ActivePathProvider";
import { colors, radii, spacing } from "../../theme/tokens";

type Skill = {
  skillKey: string;
  skillName: string;
  proficiencyLevel: string;
  confidenceLevel: string;
  evidenceCount: number;
  lastEvidenceAt: string | null;
};
type UserStats = {
  xp?: number;
  streak?: number;
  hoursStudied?: number;
  lessonsCompleted?: number;
  overallMastery?: number;
};
type Recommendation = {
  decision?: { action?: string; reason?: string };
  target?: { lessonId?: string; title?: string } | null;
};

const readable = (value: string) =>
  value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatEvidenceDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
};

export default function ProgressTab() {
  const router = useRouter();
  const {
    bootstrap,
    bootstrapLoading,
    bootstrapError,
    bootstrapStale,
    refreshBootstrap,
    session,
    user,
  } = useAuth();
  const { activeRoadmapId } = useActivePath();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(
    null,
  );
  const [staleAt, setStaleAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const roadmaps = useMemo(
    () => asList(bootstrap?.roadmaps).map(normalizeRoadmap),
    [bootstrap?.roadmaps],
  );
  const activeRoadmap =
    roadmaps.find((roadmap) => roadmap.id === activeRoadmapId) ??
    roadmaps.find((roadmap) => roadmap.status !== "completed") ??
    roadmaps[0];
  const allLessons = useMemo(
    () => roadmaps.flatMap((roadmap) => flattenLessons(roadmap)),
    [roadmaps],
  );
  const activityLog = asRecord(bootstrap?.activityLog);
  const activity: ({ date: string } & Record<string, unknown>)[] = Object.keys(
    activityLog,
  ).length
    ? Array.from({ length: 7 }, (_, daysAgo) => {
        const day = new Date();
        day.setUTCDate(day.getUTCDate() - daysAgo);
        const date = day.toISOString().slice(0, 10);
        return { date, ...asRecord(activityLog[date]) };
      })
    : [];
  const maxDailyXp = Math.max(
    1,
    ...activity.map((entry) => Number(entry.xp) || 0),
  );

  const load = useCallback(async () => {
    if (!user?.id || !session?.access_token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setStaleAt(null);
    const results = await Promise.allSettled([
      cachedApiRequest<{ skills?: unknown[] }>(
        user.id,
        "skills",
        "/api/skills",
        { accessToken: session.access_token },
      ),
      cachedApiRequest<UserStats>(user.id, "user-stats", "/api/user-stats", {
        accessToken: session.access_token,
      }),
      activeRoadmap
        ? cachedApiRequest<Recommendation>(
            user.id,
            `next-action:${activeRoadmap.id}`,
            `/api/roadmaps/${encodeURIComponent(activeRoadmap.id)}/next-action`,
            { accessToken: session.access_token },
          )
        : Promise.resolve(null),
    ]);
    const [skillResult, statsResult, recommendationResult] = results;
    if (skillResult.status === "fulfilled") {
      setSkills(
        asList(skillResult.value?.data?.skills).map((item) => {
          const raw = asRecord(item);
          return {
            skillKey: asText(raw.skillKey),
            skillName: asText(raw.skillName, "Skill"),
            proficiencyLevel: asText(raw.proficiencyLevel, "unknown"),
            confidenceLevel: asText(raw.confidenceLevel, "low"),
            evidenceCount: Number(raw.evidenceCount) || 0,
            lastEvidenceAt:
              typeof raw.lastEvidenceAt === "string"
                ? raw.lastEvidenceAt
                : null,
          };
        }),
      );
      if (skillResult.value?.stale) setStaleAt(skillResult.value.savedAt);
    }
    if (statsResult.status === "fulfilled") {
      setStats(statsResult.value.data);
      if (statsResult.value.stale)
        setStaleAt((current) => current ?? statsResult.value.savedAt);
    }
    if (recommendationResult.status === "fulfilled") {
      setRecommendation(recommendationResult.value?.data ?? null);
      if (recommendationResult.value?.stale)
        setStaleAt((current) => current ?? recommendationResult.value!.savedAt);
    }
    const failures = results.filter((result) => result.status === "rejected");
    if (failures.length === results.length && failures.length > 0)
      setError(
        "Progress could not refresh. Your last saved summary is still shown when available.",
      );
    else if (failures.length)
      setError("Some progress details are temporarily unavailable.");
    setLoading(false);
  }, [activeRoadmap, session, user]);

  useEffect(() => {
    const task = setTimeout(() => void load(), 0);
    return () => clearTimeout(task);
  }, [load]);

  const recommendationLesson = allLessons.find(
    (lesson) => lesson.id === recommendation?.target?.lessonId,
  );
  const openRecommendedLesson = () => {
    if (!activeRoadmap || !recommendationLesson) return;
    router.push({
      pathname: "/(learning)/lesson/[lessonId]",
      params: {
        lessonId: recommendationLesson.id,
        roadmapId: activeRoadmap.id,
        status: recommendationLesson.status,
      },
    } as never);
  };
  const retry = async () => {
    await Promise.all([refreshBootstrap(), load()]);
  };

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Typography variant="label" color={colors.primaryDark} style={styles.eyebrow}>
            YOUR JOURNEY
          </Typography>
          <Typography variant="display" style={styles.screenTitle}>Progress</Typography>
        </View>
        <View style={styles.headerIcon}>
          <MaterialCommunityIcons
            name="chart-line"
            size={25}
            color={colors.ink}
          />
        </View>
      </View>
      {bootstrapStale || staleAt ? (
        <CacheNotice savedAt={staleAt ?? undefined} />
      ) : null}
      {error || bootstrapError ? (
        <Card>
          <Typography variant="bodyMedium" color={colors.error}>
            {error ?? "Your account summary could not load."}
          </Typography>
          <Typography
            variant="caption"
            color={colors.textSecondary}
            style={styles.errorText}
          >
            {bootstrapError ?? "Saved details may still be available below."}
          </Typography>
          <Button
            label="Try again"
            variant="secondary"
            onPress={() => void retry()}
          />
        </Card>
      ) : null}
      {bootstrapLoading && !bootstrap ? (
        <Card>
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} />
            <Typography color={colors.textSecondary}>
              Loading your progress…
            </Typography>
          </View>
        </Card>
      ) : null}

      {roadmaps.length === 0 && !bootstrapLoading ? (
        <Card>
          <View style={styles.emptyIcon}>
            <MaterialCommunityIcons
              name="flag-checkered"
              size={26}
              color={colors.primary}
            />
          </View>
          <Typography variant="title">Progress starts with a lesson</Typography>
          <Typography color={colors.textSecondary} style={styles.emptyCopy}>
            Create a learning path, then your completed lessons and skill
            evidence will show up here.
          </Typography>
          <Button
            label="Create a learning path"
            onPress={() => router.push("/(onboarding)" as never)}
          />
        </Card>
      ) : null}

      {roadmaps.length > 0 ? (
        <Card variant="subtle">
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Typography variant="display" style={styles.statNumber}>
                {Number(
                  stats?.lessonsCompleted ??
                    roadmaps.reduce(
                      (sum, item) => sum + item.lessonsCompleted,
                      0,
                    ),
                )}
              </Typography>
              <Typography variant="body" color={colors.textSecondary} style={styles.statLabel}>
                lessons
              </Typography>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Typography variant="display" style={styles.statNumber}>
                {Number(stats?.streak ?? asRecord(bootstrap?.profile).streak) ||
                  0}
              </Typography>
              <Typography variant="body" color={colors.textSecondary} style={styles.statLabel}>
                day streak
              </Typography>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Typography variant="display" style={styles.statNumber}>
                {Number(stats?.xp ?? asRecord(bootstrap?.profile).xp) || 0}
              </Typography>
              <Typography variant="body" color={colors.textSecondary} style={styles.statLabel}>
                XP
              </Typography>
            </View>
          </View>
          {typeof stats?.hoursStudied === "number" ? (
            <Typography
              variant="caption"
              color={colors.textMuted}
              style={styles.studyTime}
            >
              {stats.hoursStudied} hours of recorded study time
            </Typography>
          ) : null}
        </Card>
      ) : null}

      {activeRoadmap ? (
        <Card variant="outlined">
          <View style={styles.pathHeader}>
            <View style={styles.pathIcon}>
              <MaterialCommunityIcons
                name="map-marker-path"
                size={20}
                color={colors.primaryDark}
              />
            </View>
            <View style={styles.flex}>
          <Typography variant="label" color={colors.primaryDark}>
                ACTIVE PATH
              </Typography>
              <Typography variant="bodyMedium" numberOfLines={2}>
                {activeRoadmap.title}
              </Typography>
            </View>
            <Typography variant="bodyMedium" color={colors.text} style={styles.pathPercent}>
              {Math.round(activeRoadmap.progressPercent)}%
            </Typography>
          </View>
          <ProgressBar
            value={activeRoadmap.progressPercent / 100}
            label={`${activeRoadmap.title} progress ${Math.round(activeRoadmap.progressPercent)} percent`}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Open ${activeRoadmap.title} path`}
            onPress={() =>
              router.push({
                pathname: "/(learning)/roadmap/[roadmapId]",
                params: { roadmapId: activeRoadmap.id },
              } as never)
            }
            style={styles.pathLink}
          >
            <Typography variant="bodyMedium" color={colors.primaryDark}>
              Open this path
            </Typography>
            <MaterialCommunityIcons
              name="chevron-right"
              size={18}
              color={colors.primaryDark}
            />
          </Pressable>
        </Card>
      ) : null}

      {recommendation?.target?.lessonId && activeRoadmap ? (
        <View style={styles.nextStepCard}>
          <View style={styles.recommendationHeader}>
            <MaterialCommunityIcons
              name="lightbulb-on-outline"
              size={19}
              color={colors.ink}
            />
            <Typography variant="label" color={colors.ink} style={styles.nextStepLabel}>
              YOUR NEXT STEP
            </Typography>
          </View>
          <Typography variant="sectionHeading" style={styles.recommendationTitle}>
            {recommendation.target.title ?? "Continue learning"}
          </Typography>
          <Typography
            variant="caption"
            color={colors.textSecondary}
            style={styles.reason}
          >
            {recommendation.decision?.reason ??
              "Based on your current path and recent learning."}
          </Typography>
          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : null}
          <View style={styles.recommendationAction}>
            <Button
              label="Go to this lesson"
              variant="dark"
              size="medium"
              disabled={!recommendationLesson}
              onPress={openRecommendedLesson}
            />
          </View>
        </View>
      ) : null}

      {activity.length > 0 ? (
        <Card variant="outlined">
          <SectionHeader title="Recent activity" />
          <View style={styles.activityChart}>
            {activity
              .slice()
              .reverse()
              .map((entry) => {
                const xp = Number(entry.xp) || 0;
                const label = new Date(
                  `${entry.date}T00:00:00`,
                ).toLocaleDateString(undefined, { weekday: "short" });
                return (
                  <View
                    key={entry.date}
                    style={styles.activityDay}
                    accessible
                    accessibilityLabel={`${entry.date}: ${Number(entry.lessonsCompleted) || 0} lessons completed, ${xp} XP`}
                  >
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.bar,
                          { height: Math.max(6, (xp / maxDailyXp) * 60) },
                        ]}
                      />
                    </View>
                    <Typography variant="caption" color={colors.textSecondary} style={styles.weekday}>
                      {label}
                    </Typography>
                  </View>
                );
              })}
          </View>
          <Typography
            variant="caption"
            color={colors.textSecondary}
            style={styles.activityCaption}
          >
            Recent XP and lesson completions from your account.
          </Typography>
        </Card>
      ) : null}

      <View style={styles.sectionHeader}>
        <Typography variant="sectionHeading" style={styles.skillsTitle}>
          Skills you&apos;re building
        </Typography>
        <Typography variant="caption" color={colors.textMuted}>
          Estimates from learning evidence
        </Typography>
      </View>
      {skills.length ? (
        skills.slice(0, 8).map((skill) => (
          <Pressable
            key={skill.skillKey}
            accessibilityRole="button"
            accessibilityLabel={`View ${skill.skillName} skill details`}
            onPress={() =>
              router.push({
                pathname: "/(learning)/skill/[skillKey]",
                params: { skillKey: skill.skillKey },
              } as never)
            }
          >
            <Card variant="outlined">
              <View style={styles.skillTop}>
                <View style={styles.skillIcon}>
                  <MaterialCommunityIcons
                    name="brain"
                    size={18}
                    color={colors.primaryDark}
                  />
                </View>
                <View style={styles.flex}>
                  <Typography variant="bodyMedium" numberOfLines={1} style={styles.skillName}>
                    {skill.skillName}
                  </Typography>
                  <Typography variant="caption" color={colors.textSecondary} numberOfLines={1}>
                    {readable(skill.proficiencyLevel)} ·{" "}
                    {readable(skill.confidenceLevel)} confidence
                  </Typography>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={18}
                  color={colors.textMuted}
                />
              </View>
              <Typography
                variant="caption"
                color={colors.textMuted}
                style={styles.evidence}
              >
                {skill.evidenceCount} evidence{" "}
                {skill.evidenceCount === 1 ? "item" : "items"}
                {skill.lastEvidenceAt
                  ? ` · updated ${formatEvidenceDate(skill.lastEvidenceAt)}`
                  : ""}
              </Typography>
            </Card>
          </Pressable>
        ))
      ) : !loading ? (
        <Card>
          <Typography color={colors.textSecondary}>
            Skill estimates appear after LearnPath records lesson, quiz, or
            placement evidence.
          </Typography>
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.mdPlus, paddingBottom: spacing.xxl },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  headerCopy: { gap: spacing.xs },
  eyebrow: { letterSpacing: 1 },
  screenTitle: { fontSize: 38, lineHeight: 42, letterSpacing: -0.8 },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  loading: {
    minHeight: 70,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  errorText: { marginVertical: spacing.sm },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primarySoft,
    marginBottom: spacing.md,
  },
  emptyCopy: { marginVertical: spacing.md },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  stat: { alignItems: "center", gap: 2, flex: 1 },
  statNumber: { fontSize: 34, lineHeight: 38, letterSpacing: -0.5 },
  statLabel: { fontSize: 14, lineHeight: 19 },
  statDivider: { width: 1, height: 48, backgroundColor: colors.borderStrong },
  studyTime: { textAlign: "center", marginTop: spacing.md, fontSize: 14, lineHeight: 20 },
  pathHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  pathIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primarySoft,
  },
  flex: { flex: 1, minWidth: 0 },
  pathPercent: { fontSize: 18, fontWeight: "700" },
  pathLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 44,
    marginTop: spacing.sm,
  },
  recommendationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  nextStepCard: {
    padding: spacing.lg,
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radii.xl,
  },
  nextStepLabel: { letterSpacing: 0.8 },
  recommendationTitle: { fontSize: 23, lineHeight: 29, letterSpacing: -0.25 },
  reason: { marginTop: spacing.xs, marginBottom: spacing.sm, lineHeight: 23, fontSize: 15 },
  recommendationAction: { marginTop: spacing.xs },
  activityChart: {
    height: 118,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    marginTop: spacing.sm,
  },
  activityDay: {
    alignItems: "center",
    justifyContent: "flex-end",
    gap: spacing.xs,
    flex: 1,
    height: "100%",
  },
  barTrack: {
    height: 68,
    width: 18,
    justifyContent: "flex-end",
    borderRadius: radii.full,
    backgroundColor: colors.primaryTint,
  },
  bar: { width: 18, borderRadius: radii.full, backgroundColor: colors.primaryDark },
  weekday: { fontSize: 12, lineHeight: 17 },
  activityCaption: { marginTop: spacing.md, fontSize: 14, lineHeight: 20 },
  sectionHeader: { gap: spacing.xs, marginTop: spacing.sm },
  skillsTitle: { fontSize: 22, lineHeight: 27 },
  skillTop: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  skillIcon: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.full,
    backgroundColor: colors.primarySoft,
  },
  skillName: { fontSize: 17, lineHeight: 23 },
  evidence: { marginTop: spacing.sm, fontSize: 13, lineHeight: 18, marginLeft: 48 + spacing.md },
});
