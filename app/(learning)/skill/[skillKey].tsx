import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import {
  Button,
  CacheNotice,
  Card,
  IconButton,
  Screen,
  Typography,
} from "../../../components";
import { useAuth } from "../../../hooks/useAuth";
import { cachedApiRequest } from "../../../lib/cachedApi";
import {
  asList,
  asRecord,
  asText,
  flattenLessons,
  normalizeRoadmap,
} from "../../../lib/learning";
import { colors, radii, spacing } from "../../../theme/tokens";

type Skill = {
  skillKey: string;
  skillName: string;
  proficiencyLevel: string;
  confidenceLevel: string;
  evidenceCount: number;
  lastEvidenceAt?: string | null;
};
const normalizeKey = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const titleCase = (value: string) =>
  value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function SkillDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ skillKey?: string | string[] }>();
  const skillKey = Array.isArray(params.skillKey)
    ? params.skillKey[0]
    : params.skillKey;
  const { bootstrap, session, user } = useAuth();
  const [skill, setSkill] = useState<Skill | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cachedAt, setCachedAt] = useState<string | null>(null);
  const roadmaps = useMemo(
    () => (bootstrap?.roadmaps ?? []).map(normalizeRoadmap),
    [bootstrap?.roadmaps],
  );

  const load = useCallback(async () => {
    if (!skillKey || !session?.access_token || !user?.id) {
      setError("This skill link is missing information.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await cachedApiRequest<{ skills?: unknown[] }>(
        user.id,
        "skills",
        "/api/skills",
        { accessToken: session.access_token },
      );
      setCachedAt(result.stale ? result.savedAt : null);
      const raw = asRecord(
        asList(result.data.skills)
          .map(asRecord)
          .find((item) => asText(item.skillKey) === skillKey),
      );
      if (!asText(raw.skillKey))
        throw new Error("This skill estimate could not be found.");
      setSkill({
        skillKey: asText(raw.skillKey, skillKey),
        skillName: asText(raw.skillName, skillKey),
        proficiencyLevel: asText(raw.proficiencyLevel, "unknown"),
        confidenceLevel: asText(raw.confidenceLevel, "low"),
        evidenceCount: Number(raw.evidenceCount) || 0,
        lastEvidenceAt:
          typeof raw.lastEvidenceAt === "string" ? raw.lastEvidenceAt : null,
      });
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "This skill estimate could not load.",
      );
    } finally {
      setLoading(false);
    }
  }, [session, skillKey, user]);
  useEffect(() => {
    const task = setTimeout(() => void load(), 0);
    return () => clearTimeout(task);
  }, [load]);

  let relatedLesson: {
    lesson: ReturnType<typeof flattenLessons>[number];
    roadmapId: string;
  } | null = null;
  if (skill) {
    for (const roadmap of roadmaps) {
      const lesson = flattenLessons(roadmap).find((item) =>
        item.skillTags.some(
          (tag) =>
            normalizeKey(tag) === normalizeKey(skill.skillKey) ||
            normalizeKey(tag) === normalizeKey(skill.skillName),
        ),
      );
      if (lesson) {
        relatedLesson = { lesson, roadmapId: roadmap.id };
        break;
      }
    }
  }

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <View style={styles.top}>
        <IconButton
          icon="arrow-left"
          label="Back to progress"
          onPress={() => router.back()}
        />
        <Typography variant="caption" color={colors.textSecondary}>
          SKILL DETAIL
        </Typography>
        <View style={styles.spacer} />
      </View>
      {cachedAt ? <CacheNotice savedAt={cachedAt} /> : null}
      {loading ? (
        <Card>
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} />
            <Typography color={colors.textSecondary}>
              Loading skill evidence…
            </Typography>
          </View>
        </Card>
      ) : error || !skill ? (
        <Card>
          <Typography variant="title">Skill details unavailable</Typography>
          <Typography color={colors.textSecondary} style={styles.explain}>
            {error ?? "This skill estimate could not be found."}
          </Typography>
          <Button
            label="Try again"
            onPress={() => void load()}
            loading={loading}
          />
        </Card>
      ) : (
        <>
          <View style={styles.hero}>
            <View style={styles.icon}>
              <MaterialCommunityIcons
                name="brain"
                size={26}
                color={colors.primary}
              />
            </View>
            <Typography variant="display">{skill.skillName}</Typography>
            <Typography color={colors.textSecondary}>
              A current estimate based on recorded learning evidence.
            </Typography>
          </View>
          <Card>
            <Typography variant="label" color={colors.primary}>
              PROFICIENCY ESTIMATE
            </Typography>
            <Typography variant="heading" style={styles.level}>
              {titleCase(skill.proficiencyLevel)}
            </Typography>
            <Typography color={colors.textSecondary} style={styles.explain}>
              This is a learning estimate, not a test score or guarantee of
              mastery.
            </Typography>
          </Card>
          <Card>
            <Typography variant="bodyMedium">
              Confidence: {titleCase(skill.confidenceLevel)}
            </Typography>
            <Typography color={colors.textSecondary} style={styles.explain}>
              Based on {skill.evidenceCount} recorded{" "}
              {skill.evidenceCount === 1 ? "evidence item" : "evidence items"}
              {skill.lastEvidenceAt
                ? ` · most recent ${new Date(skill.lastEvidenceAt).toLocaleDateString()}`
                : "."}{" "}
              Confidence reflects the amount and consistency of evidence
              available to LearnPath.
            </Typography>
          </Card>
          {relatedLesson ? (
            <Card>
              <View style={styles.relatedHeader}>
                <MaterialCommunityIcons
                  name="book-open-page-variant-outline"
                  size={20}
                  color={colors.primary}
                />
                <Typography variant="bodyMedium">
                  Keep building this skill
                </Typography>
              </View>
              <Typography color={colors.textSecondary} style={styles.explain}>
                {relatedLesson.lesson.name}
              </Typography>
              <Button
                label="Open related lesson"
                onPress={() =>
                  router.push({
                    pathname: "/(learning)/lesson/[lessonId]",
                    params: {
                      lessonId: relatedLesson.lesson.id,
                      roadmapId: relatedLesson.roadmapId,
                      status: relatedLesson.lesson.status,
                    },
                  } as never)
                }
              />
            </Card>
          ) : null}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingBottom: spacing.xl },
  top: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  spacer: { width: 48 },
  loading: {
    minHeight: 80,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  hero: {
    alignItems: "flex-start",
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  icon: {
    width: 54,
    height: 54,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primarySoft,
    marginBottom: spacing.xs,
  },
  level: { marginTop: spacing.xs, marginBottom: spacing.md },
  explain: { lineHeight: 22, marginTop: spacing.sm },
  relatedHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
});
