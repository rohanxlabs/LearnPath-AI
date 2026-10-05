import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  Button,
  CacheNotice,
  Card,
  IconButton,
  ProgressBar,
  Typography,
} from "../../../components";
import { useAuth } from "../../../hooks/useAuth";
import { apiRequest } from "../../../lib/api";
import { cachedApiRequest } from "../../../lib/cachedApi";
import { asList, asRecord, asText } from "../../../lib/learning";
import { stripLessonBodies } from "../../../lib/mobileCache";
import { colors, layout, radii, spacing } from "../../../theme/tokens";

type Project = {
  id: string;
  phaseId: string;
  title: string;
  difficulty: string;
  description: string;
  techStack: string[];
  features: string[];
  githubUrl: string;
  progress: number;
};

export default function ProjectScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    projectId?: string | string[];
    roadmapId?: string | string[];
  }>();
  const projectId = Array.isArray(params.projectId)
    ? params.projectId[0]
    : params.projectId;
  const roadmapId = Array.isArray(params.roadmapId)
    ? params.roadmapId[0]
    : params.roadmapId;
  const { session, refreshBootstrap, user } = useAuth();
  const accessToken = session?.access_token;
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [cachedAt, setCachedAt] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!roadmapId || !projectId || !session?.access_token || !user?.id) {
      setError("This project needs to be opened from its learning path.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await cachedApiRequest<{ roadmap?: unknown }>(
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
      );
      setCachedAt(result.stale ? result.savedAt : null);
      const response = result.data;
      const roadmap = asRecord(response.roadmap);
      const projectRow = asList(roadmap.projects)
        .map(asRecord)
        .find((row) => asText(row.id) === projectId);
      const found: Project | null = projectRow
        ? {
            id: projectId,
            phaseId: asText(projectRow.phaseId),
            title: asText(projectRow.title, "Learning project"),
            difficulty: asText(projectRow.difficulty, "Flexible"),
            description: asText(projectRow.description),
            techStack: asList(projectRow.techStack).filter(
              (item): item is string => typeof item === "string",
            ),
            features: asList(projectRow.features).filter(
              (item): item is string => typeof item === "string",
            ),
            githubUrl: asText(projectRow.githubUrl),
            progress: Math.max(
              0,
              Math.min(100, Number(projectRow.progress) || 0),
            ),
          }
        : null;
      if (!found)
        throw new Error(
          "This project is no longer in the selected learning path.",
        );
      setProject(found);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Project details could not load. Please retry.",
      );
    } finally {
      setLoading(false);
    }
  }, [session, projectId, roadmapId, user]);
  useEffect(() => {
    const task = setTimeout(() => void load(), 0);
    return () => clearTimeout(task);
  }, [load]);

  const updateProgress = async (progress: number) => {
    if (!project || !roadmapId || !accessToken) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await apiRequest("/api/update-roadmap", {
        method: "POST",
        accessToken,
        body: {
          roadmapId,
          updates: {
            projects: [
              {
                id: project.id,
                phaseId: project.phaseId,
                title: project.title,
                difficulty: project.difficulty,
                description: project.description,
                techStack: project.techStack,
                features: project.features,
                githubUrl: project.githubUrl || null,
                progress,
              },
            ],
          },
        },
      });
      setProject((current) => (current ? { ...current, progress } : current));
      setSaved(true);
      await refreshBootstrap();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Your project progress could not be saved. Try again when online.",
      );
    } finally {
      setSaving(false);
    }
  };
  const stateLabel =
    project?.progress === 100
      ? "Done Â· self-reported"
      : project?.progress
        ? "In progress"
        : "Not started";

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.page}>
        <View style={styles.top}>
          <IconButton
            icon="arrow-left"
            label="Back"
            onPress={() => router.back()}
          />
          <Typography variant="caption" color={colors.textSecondary}>
            PROJECT
          </Typography>
          <View style={styles.spacer} />
        </View>
        {cachedAt ? <CacheNotice savedAt={cachedAt} /> : null}
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} />
            <Typography color={colors.textSecondary}>
              Opening projectâ€¦
            </Typography>
          </View>
        ) : error && !project ? (
          <View style={styles.center}>
            <Card>
              <Typography variant="title">Project unavailable</Typography>
              <Typography color={colors.textSecondary} style={styles.copy}>
                {error}
              </Typography>
              <Button label="Try again" onPress={() => void load()} />
            </Card>
          </View>
        ) : project ? (
          <ScrollView contentContainerStyle={styles.content}>
            <Typography variant="display">{project.title}</Typography>
            <View style={styles.meta}>
              <View style={styles.metaIcon}>
                <MaterialCommunityIcons
                  name="hammer-wrench"
                  size={19}
                  color={colors.primaryDark}
                />
              </View>
              <Typography variant="caption" color={colors.textSecondary}>
                {project.difficulty} project
              </Typography>
            </View>
            {project.description ? (
              <Typography
                color={colors.textSecondary}
                style={styles.description}
              >
                {project.description}
              </Typography>
            ) : null}
            <Card>
              <Typography variant="bodyMedium">What youâ€™ll build</Typography>
              <Typography color={colors.textSecondary} style={styles.copy}>
                Use this project to apply the ideas from your learning path. The
                app is your guide and progress tracker; build with your
                preferred tools.
              </Typography>
            </Card>
            {project.techStack.length ? (
              <View style={styles.section}>
                <Typography variant="title">Suggested tools</Typography>
                <View style={styles.chips}>
                  {project.techStack.map((item) => (
                    <View style={styles.chip} key={item}>
                      <Typography variant="caption" color={colors.primaryDark}>
                        {item}
                      </Typography>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
            {project.features.length ? (
              <Card>
                <Typography variant="bodyMedium">
                  Project requirements
                </Typography>
                <View style={styles.requirements}>
                  {project.features.map((feature, index) => (
                    <View
                      key={`${index}-${feature}`}
                      style={styles.requirement}
                    >
                      <MaterialCommunityIcons
                        name="checkbox-blank-circle-outline"
                        size={18}
                        color={colors.primaryDark}
                      />
                      <Typography style={styles.requirementText}>
                        {feature}
                      </Typography>
                    </View>
                  ))}
                </View>
                <Typography
                  variant="caption"
                  color={colors.textMuted}
                  style={styles.copy}
                >
                  These are guidance items, not individually tracked checkboxes.
                </Typography>
              </Card>
            ) : null}
            <Card>
              <View style={styles.progressHead}>
                <Typography variant="bodyMedium">
                  Your project progress
                </Typography>
                <Typography variant="caption" color={colors.primaryDark}>
                  {stateLabel}
                </Typography>
              </View>
              <ProgressBar
                value={project.progress / 100}
                label={`${project.progress}% self-reported progress`}
              />
              <Typography
                variant="caption"
                color={colors.textSecondary}
                style={styles.copy}
              >
                Progress is self-reported and saved to your learning path. It
                does not verify or grade your work.
              </Typography>
              <View style={styles.actions}>
                <Button
                  label="Start project"
                  variant="secondary"
                  disabled={project.progress > 0}
                  loading={saving}
                  onPress={() => void updateProgress(10)}
                />
                <Button
                  label="Update progress"
                  disabled={project.progress >= 100}
                  loading={saving}
                  onPress={() =>
                    void updateProgress(Math.min(100, project.progress + 25))
                  }
                />
                <Button
                  label="Mark done"
                  variant="quiet"
                  disabled={project.progress === 100}
                  loading={saving}
                  onPress={() => void updateProgress(100)}
                />
              </View>
              {saved ? (
                <Typography variant="caption" color={colors.success}>
                  Progress saved
                </Typography>
              ) : null}
              {error ? (
                <Typography accessibilityRole="alert" color={colors.error}>
                  {error}
                </Typography>
              ) : null}
            </Card>
            <Button
              label="Ask AI Mentor about this project"
              variant="secondary"
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/mentor",
                  params: { roadmapId, lessonName: project.title },
                } as never)
              }
            />
          </ScrollView>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  page: { flex: 1, paddingHorizontal: layout.screenPadding },
  top: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  spacer: { width: 48 },
  center: { flex: 1, justifyContent: "center", gap: spacing.md },
  content: {
    flexGrow: 1,
    gap: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  meta: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  metaIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primarySoft,
  },
  description: { fontSize: 17, lineHeight: 26 },
  copy: { marginTop: spacing.sm, marginBottom: spacing.md },
  section: { gap: spacing.sm },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
  },
  requirements: { gap: spacing.md, marginTop: spacing.md },
  requirement: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  requirementText: { flex: 1 },
  progressHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  actions: { gap: spacing.sm },
});
