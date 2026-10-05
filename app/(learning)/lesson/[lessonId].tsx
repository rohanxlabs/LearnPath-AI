import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
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
import { colors, layout, radii, spacing } from "../../../theme/tokens";

type LessonPayload = {
  id: string;
  name: string;
  type: string;
  status: string;
  xpReward: number;
  content: string;
  summary: string;
  objectives: string[];
  estimatedTime: number;
  contentStatus: string;
  resources: {
    id: string;
    title: string;
    provider: string;
    type: string;
    duration: string;
    url: string;
    description: string;
  }[];
  project: {
    id: string;
    title: string;
    difficulty: string;
    description: string;
  } | null;
};

type LessonProgress = { completed: boolean; studyMinutes: number };
type CompletionResponse = {
  xp?: number;
  streak?: number;
  completionPercent?: number;
  alreadyCompleted?: boolean;
  message?: string;
};
type ContentBlock = {
  type: "heading" | "paragraph" | "bullet" | "quote" | "code";
  text: string;
  level?: number;
};

function cleanInlineMarkdown(text: string) {
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, "$1")
    .replace(/`([^`]+)`/g, "$1");
}

function parseLessonContent(markdown: string): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  const paragraph: string[] = [];
  const code: string[] = [];
  let inCode = false;
  const flushParagraph = () => {
    const value = paragraph.join(" ").trim();
    if (value)
      blocks.push({ type: "paragraph", text: cleanInlineMarkdown(value) });
    paragraph.length = 0;
  };

  for (const line of markdown.split(/\r?\n/)) {
    if (line.trimStart().startsWith("```")) {
      if (inCode) {
        blocks.push({ type: "code", text: code.join("\n") });
        code.length = 0;
      } else flushParagraph();
      inCode = !inCode;
      continue;
    }
    if (inCode) {
      code.push(line);
      continue;
    }
    if (!line.trim()) {
      flushParagraph();
      continue;
    }
    const heading = /^(#{1,3})\s+(.+)$/.exec(line.trim());
    if (heading) {
      flushParagraph();
      blocks.push({
        type: "heading",
        text: cleanInlineMarkdown(heading[2]),
        level: heading[1].length,
      });
      continue;
    }
    const bullet = /^\s*(?:[-*]|\d+\.)\s+(.+)$/.exec(line);
    if (bullet) {
      flushParagraph();
      blocks.push({ type: "bullet", text: cleanInlineMarkdown(bullet[1]) });
      continue;
    }
    if (line.trimStart().startsWith(">")) {
      flushParagraph();
      blocks.push({
        type: "quote",
        text: cleanInlineMarkdown(line.trimStart().slice(1).trim()),
      });
      continue;
    }
    paragraph.push(cleanInlineMarkdown(line.trim()));
  }
  flushParagraph();
  if (code.length) blocks.push({ type: "code", text: code.join("\n") });
  return blocks;
}

function LessonBody({ markdown }: { markdown: string }) {
  const blocks = useMemo(() => parseLessonContent(markdown), [markdown]);
  return (
    <View style={styles.lessonBody}>
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          const variant =
            block.level === 1
              ? "lessonHeading"
              : block.level === 2
                ? "sectionHeading"
                : "lessonSubheading";
          return (
            <Typography
              key={index}
              accessibilityRole="header"
              variant={variant}
              style={styles.contentHeading}
            >
              {block.text}
            </Typography>
          );
        }
        if (block.type === "bullet") {
          return (
            <View key={index} style={styles.bulletRow}>
              <View style={styles.bulletDot} />
              <Typography selectable style={styles.paragraph}>
                {block.text}
              </Typography>
            </View>
          );
        }
        if (block.type === "quote") {
          return (
            <View key={index} style={styles.quote}>
              <Typography selectable color={colors.textSecondary}>
                {block.text}
              </Typography>
            </View>
          );
        }
        if (block.type === "code") {
          return (
            <View key={index} style={styles.codeCard}>
              <Typography
                variant="label"
                color={colors.textSecondary}
                style={styles.codeLabel}
              >
                EXAMPLE
              </Typography>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator
                contentContainerStyle={styles.codeScroll}
              >
                <Typography selectable style={styles.codeText}>
                  {block.text}
                </Typography>
              </ScrollView>
            </View>
          );
        }
        return (
          <Typography key={index} selectable style={styles.paragraph}>
            {block.text}
          </Typography>
        );
      })}
    </View>
  );
}

function safeHttpUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

export default function LessonScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    lessonId?: string | string[];
    roadmapId?: string | string[];
    status?: string | string[];
  }>();
  const lessonId = Array.isArray(params.lessonId)
    ? params.lessonId[0]
    : params.lessonId;
  const roadmapId = Array.isArray(params.roadmapId)
    ? params.roadmapId[0]
    : params.roadmapId;
  const routeStatus = Array.isArray(params.status)
    ? params.status[0]
    : params.status;
  const { session, refreshBootstrap, user } = useAuth();
  const accessToken = session?.access_token;
  const [lesson, setLesson] = useState<LessonPayload | null>(null);
  const [progress, setProgress] = useState<LessonProgress>({
    completed: routeStatus === "completed",
    studyMinutes: 0,
  });
  const [completion, setCompletion] = useState<CompletionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resourceError, setResourceError] = useState<string | null>(null);
  const [readingProgress, setReadingProgress] = useState(0);
  const [objectivesOpen, setObjectivesOpen] = useState(true);
  const [cachedAt, setCachedAt] = useState<string | null>(null);

  const loadLesson = useCallback(async () => {
    if (!lessonId || !session?.access_token || !user?.id) {
      setError(
        "This lesson link is missing information. Return to the roadmap and open it again.",
      );
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [topicResult, metaResponse] = await Promise.all([
        cachedApiRequest<{ topic?: unknown }>(
          user.id,
          `lesson:${lessonId}`,
          `/api/topics/${encodeURIComponent(lessonId)}`,
          { accessToken: session.access_token },
        ),
        apiRequest<{ progress?: unknown }>(
          `/api/lessons/${encodeURIComponent(lessonId)}/meta`,
          { accessToken: session.access_token },
        ).catch(() => null),
      ]);
      const topicResponse = topicResult.data;
      setCachedAt(topicResult.stale ? topicResult.savedAt : null);
      const topic = asRecord(topicResponse.topic);
      if (!asText(topic.id)) throw new Error("This lesson could not be found.");
      const resourceList = asList(topic.resources).map((value, index) => {
        const resource = asRecord(value);
        return {
          id: asText(resource.id),
          title: asText(resource.title, "Learning resource"),
          provider: asText(resource.provider),
          type: asText(resource.type, "resource"),
          duration: asText(resource.duration),
          url: asText(resource.url),
          description: asText(resource.description),
        };
      });
      const progressData = asRecord(metaResponse?.progress);
      const metadata = asRecord(topic.metadata);
      const objectives = asList(
        topic.objectives ?? metadata.learningObjectives,
      ).filter((value): value is string => typeof value === "string");
      const content = asText(topic.content);
      const projectData = asRecord(topic.project);
      setLesson({
        id: asText(topic.id),
        name: asText(topic.name, "Lesson"),
        type: asText(topic.type, "learn"),
        status: asText(topic.contentStatus, "ready").toLowerCase(),
        xpReward: Number(topic.xpReward) || 0,
        content: content.trim()
          ? content
          : asText(topic.summary, "Lesson content is being prepared."),
        summary: asText(topic.summary),
        objectives,
        estimatedTime: Number(topic.estimatedTime) || 15,
        contentStatus: asText(topic.contentStatus, "ready").toLowerCase(),
        resources: resourceList,
        project: asText(projectData.id)
          ? {
              id: asText(projectData.id),
              title: asText(projectData.title, "Practice project"),
              difficulty: asText(projectData.difficulty, "Flexible"),
              description: asText(projectData.description),
            }
          : null,
      });
      setProgress({
        completed:
          progressData.completed === true || routeStatus === "completed",
        studyMinutes: Number(progressData.studyMinutes) || 0,
      });
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Your lesson couldn’t load. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, [lessonId, routeStatus, session, user]);

  useEffect(() => {
    const task = setTimeout(() => {
      void loadLesson();
    }, 0);
    return () => clearTimeout(task);
  }, [loadLesson]);

  const onReadScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const scrollableHeight = contentSize.height - layoutMeasurement.height;
    setReadingProgress(
      scrollableHeight > 0
        ? Math.max(0, Math.min(1, contentOffset.y / scrollableHeight))
        : 0,
    );
  };

  const markComplete = async () => {
    if (!lesson || !accessToken || progress.completed) return;
    setSaving(true);
    setError(null);
    try {
      const response = await apiRequest<CompletionResponse>(
        "/api/complete-lesson",
        {
          method: "POST",
          accessToken,
          body: {
            lessonId: lesson.id,
            roadmapId,
          },
        },
      );
      setCompletion(response);
      setProgress((current) => ({ ...current, completed: true }));
      await refreshBootstrap();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Your completion couldn’t be saved. Retry when you’re online.",
      );
    } finally {
      setSaving(false);
    }
  };

  const openResource = async (resource: LessonPayload["resources"][number]) => {
    const url = safeHttpUrl(resource.url);
    if (!url) {
      setResourceError("This resource link isn’t available.");
      return;
    }
    setResourceError(null);
    try {
      await Linking.openURL(url);
      if (resource.id) {
        void apiRequest("/api/learning-events", {
          method: "POST",
          accessToken,
          body: {
            eventType: "resource_opened",
            roadmapId,
            lessonId,
            properties: { resourceId: resource.id, source: "lesson" },
          },
        }).catch(() => undefined);
      }
    } catch {
      setResourceError("This link couldn’t be opened on your device.");
    }
  };

  const returnToRoadmap = () => {
    if (roadmapId) {
      router.replace({
        pathname: "/(learning)/roadmap/[roadmapId]",
        params: { roadmapId },
      } as Href);
    } else router.back();
  };

  const objectives = lesson?.objectives ?? [];

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.page}>
        <View style={styles.topBar}>
          <IconButton
            icon="arrow-left"
            label="Back to roadmap"
            onPress={() => router.back()}
          />
          <Typography variant="caption" color={colors.textSecondary}>
            LESSON
          </Typography>
          <View style={styles.topBarSpacer} />
        </View>
        <View style={styles.readingProgress}>
          <ProgressBar
            value={progress.completed ? 1 : readingProgress}
            label={
              progress.completed
                ? "Lesson completed"
                : `Reading progress ${Math.round(readingProgress * 100)} percent`
            }
          />
        </View>

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} />
            <Typography color={colors.textSecondary}>
              Opening your lesson…
            </Typography>
          </View>
        ) : error && !lesson ? (
          <View style={styles.errorContainer}>
            <Card>
              <MaterialCommunityIcons
                name="cloud-alert-outline"
                size={26}
                color={colors.error}
              />
              <Typography variant="title" style={styles.errorTitle}>
                This lesson didn’t load
              </Typography>
              <Typography color={colors.textSecondary} style={styles.errorCopy}>
                {error}
              </Typography>
              <Button
                label="Try again"
                onPress={() => void loadLesson()}
                loading={loading}
              />
            </Card>
          </View>
        ) : lesson ? (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            onScroll={onReadScroll}
            scrollEventThrottle={120}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.content}>
              <View style={styles.lessonEyebrow}>
                <View style={styles.typePill}>
                  <MaterialCommunityIcons
                    name="book-open-page-variant-outline"
                    size={15}
                    color={colors.primary}
                  />
                  <Typography variant="caption" color={colors.primary}>
                    {lesson.type.toUpperCase()}
                  </Typography>
                </View>
                <Typography variant="caption" color={colors.textSecondary}>
                  ABOUT {lesson.estimatedTime} MIN
                </Typography>
              </View>
              <Typography
                accessibilityRole="header"
                variant="lessonTitle"
                style={styles.lessonTitle}
              >
                {lesson.name}
              </Typography>
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <MaterialCommunityIcons
                    name="star-four-points-outline"
                    size={17}
                    color={colors.warning}
                  />
                  <Typography variant="caption" color={colors.textSecondary}>
                    {lesson.xpReward} XP reward
                  </Typography>
                </View>
                {progress.completed ? (
                  <View style={styles.metaItem}>
                    <MaterialCommunityIcons
                      name="check-circle"
                      size={17}
                      color={colors.success}
                    />
                    <Typography variant="caption" color={colors.success}>
                      Completed
                    </Typography>
                  </View>
                ) : null}
              </View>

              {objectives.length > 0 ? (
                <Card variant="subtle">
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ expanded: objectivesOpen }}
                    onPress={() => setObjectivesOpen(!objectivesOpen)}
                    style={styles.objectivesHeader}
                  >
                    <View style={styles.objectiveIcon}>
                      <MaterialCommunityIcons
                        name="flag-checkered"
                        size={20}
                        color={colors.primary}
                      />
                    </View>
                    <View style={styles.objectiveHeading}>
                      <Typography variant="bodyMedium">
                        What you’ll learn
                      </Typography>
                      <Typography
                        variant="caption"
                        color={colors.textSecondary}
                      >
                        {objectives.length} learning objectives
                      </Typography>
                    </View>
                    <MaterialCommunityIcons
                      name={objectivesOpen ? "chevron-up" : "chevron-down"}
                      size={22}
                      color={colors.textMuted}
                    />
                  </Pressable>
                  {objectivesOpen ? (
                    <View style={styles.objectiveList}>
                      {objectives.map((item, index) => (
                        <View
                          key={`${index}-${item}`}
                          style={styles.objectiveRow}
                        >
                          <MaterialCommunityIcons
                            name="check-circle-outline"
                            size={18}
                            color={colors.primary}
                          />
                          <Typography style={styles.objectiveText}>
                            {item}
                          </Typography>
                        </View>
                      ))}
                    </View>
                  ) : null}
                </Card>
              ) : null}

              {lesson.contentStatus === "generating" ? (
                <View style={styles.generatingNotice}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Typography
                    variant="caption"
                    color={colors.textSecondary}
                    style={styles.generatingText}
                  >
                    Your full lesson is being prepared. This preview is ready to
                    read.
                  </Typography>
                </View>
              ) : null}

              <View style={styles.contentSection}>
                <Typography variant="title" style={styles.contentSectionTitle}>
                  Lesson
                </Typography>
                <LessonBody markdown={lesson.content} />
              </View>

              <Card variant="outlined">
                <View style={styles.actionCardHeader}>
                  <View style={styles.resourceIcon}>
                    <MaterialCommunityIcons
                      name="head-question-outline"
                      size={19}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.actionCopy}>
                    <Typography variant="bodyMedium">
                      Check your understanding
                    </Typography>
                    <Typography variant="caption" color={colors.textSecondary}>
                      A short practice quiz, with explanations after each
                      answer.
                    </Typography>
                  </View>
                </View>
                <Button
                  label="Take quick practice"
                  variant="secondary"
                  onPress={() =>
                    router.push({
                      pathname: "/(learning)/quiz/[lessonId]",
                      params: { lessonId, roadmapId, lessonName: lesson.name },
                    } as Href)
                  }
                />
              </Card>

              {lesson.project ? (
                <Card variant="subtle">
                  <Typography variant="label" color={colors.primary}>
                    PUT IT INTO PRACTICE
                  </Typography>
                  <Typography variant="bodyMedium" style={styles.projectTitle}>
                    {lesson.project.title}
                  </Typography>
                  {lesson.project.description ? (
                    <Typography variant="caption" color={colors.textSecondary}>
                      {lesson.project.description}
                    </Typography>
                  ) : null}
                  <Button
                    label="Open project guide"
                    variant="secondary"
                    onPress={() =>
                      router.push({
                        pathname: "/(learning)/project/[projectId]",
                        params: { projectId: lesson.project?.id, roadmapId },
                      } as Href)
                    }
                  />
                </Card>
              ) : null}

              <Card
                variant="outlined"
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/mentor",
                    params: { lessonId, roadmapId, lessonName: lesson.name },
                  } as Href)
                }
                accessibilityLabel="Ask AI Mentor about this lesson"
              >
                <View style={styles.actionCardHeader}>
                  <View style={styles.actionIcon}>
                    <MaterialCommunityIcons
                      name="message-question-outline"
                      size={20}
                      color={colors.primaryDark}
                    />
                  </View>
                  <View style={styles.actionCopy}>
                    <Typography variant="bodyMedium">Need a hand?</Typography>
                    <Typography variant="caption" color={colors.textSecondary}>
                      Ask AI Mentor with this lesson as context.
                    </Typography>
                  </View>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={20}
                    color={colors.textMuted}
                  />
                </View>
              </Card>

              {lesson.resources.length > 0 ? (
                <View style={styles.resourcesSection}>
                  <Typography variant="title">Explore further</Typography>
                  <Typography variant="caption" color={colors.textSecondary}>
                    Optional resources for this lesson.
                  </Typography>
                  {resourceError ? (
                    <Typography variant="caption" color={colors.error}>
                      {resourceError}
                    </Typography>
                  ) : null}
                  {lesson.resources.map((resource) => (
                    <Pressable
                      key={resource.id}
                      accessibilityRole="link"
                      onPress={() => void openResource(resource)}
                      style={styles.resourceRow}
                    >
                      <View style={styles.resourceIcon}>
                        <MaterialCommunityIcons
                          name="open-in-new"
                          size={18}
                          color={colors.primary}
                        />
                      </View>
                      <View style={styles.resourceCopy}>
                        <Typography variant="bodyMedium">
                          {resource.title}
                        </Typography>
                        <Typography
                          variant="caption"
                          color={colors.textSecondary}
                        >
                          {[resource.provider, resource.type, resource.duration]
                            .filter(Boolean)
                            .join(" · ")}
                        </Typography>
                      </View>
                      <MaterialCommunityIcons
                        name="chevron-right"
                        size={20}
                        color={colors.textMuted}
                      />
                    </Pressable>
                  ))}
                </View>
              ) : null}

              {error ? (
                <View accessibilityRole="alert" style={styles.inlineError}>
                  <MaterialCommunityIcons
                    name="alert-circle-outline"
                    size={19}
                    color={colors.error}
                  />
                  <Typography
                    variant="caption"
                    color={colors.error}
                    style={styles.inlineErrorText}
                  >
                    {error}
                  </Typography>
                </View>
              ) : null}

              {completion ? (
                <Card variant="outlined">
                  <View style={styles.completionHeader}>
                    <View style={styles.completionIcon}>
                      <MaterialCommunityIcons
                        name="check"
                        size={19}
                        color={colors.surface}
                      />
                    </View>
                    <Typography variant="bodyMedium">
                      {completion.alreadyCompleted
                        ? "Your progress was already saved"
                        : "Lesson complete"}
                    </Typography>
                  </View>
                  <Typography
                    variant="caption"
                    color={colors.textSecondary}
                    style={styles.completionDetail}
                  >
                    Total XP: {Number(completion.xp) || 0}
                    {typeof completion.completionPercent === "number"
                      ? ` · Path ${Math.round(completion.completionPercent)}% complete`
                      : ""}
                  </Typography>
                  <Button
                    label="Back to your roadmap"
                    onPress={returnToRoadmap}
                  />
                </Card>
              ) : null}

              {!completion ? (
                <View style={styles.finishSection}>
                  {progress.completed ? (
                    <View style={styles.alreadyComplete}>
                      <MaterialCommunityIcons
                        name="check-circle"
                        size={21}
                        color={colors.success}
                      />
                      <Typography variant="bodyMedium" color={colors.success}>
                        This lesson is complete
                      </Typography>
                    </View>
                  ) : null}
                  <Button
                    label={
                      progress.completed
                        ? "Return to roadmap"
                        : "Mark lesson complete"
                    }
                    loading={saving}
                    onPress={
                      progress.completed
                        ? returnToRoadmap
                        : () => void markComplete()
                    }
                  />
                  {!progress.completed ? (
                    <Typography
                      variant="caption"
                      color={colors.textMuted}
                      style={styles.finishHint}
                    >
                      Your progress and XP are recorded after the server
                      confirms completion.
                    </Typography>
                  ) : null}
                </View>
              ) : null}
            </View>
          </ScrollView>
        ) : null}
        {cachedAt ? <CacheNotice savedAt={cachedAt} /> : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  page: { flex: 1, paddingHorizontal: layout.screenPadding },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  topBarSpacer: { width: 48 },
  readingProgress: { marginTop: spacing.xs, marginBottom: spacing.sm },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  errorContainer: { flex: 1, justifyContent: "center" },
  errorTitle: { marginTop: spacing.md },
  errorCopy: { marginTop: spacing.sm, marginBottom: spacing.lg },
  scrollContent: { flexGrow: 1, paddingBottom: spacing.xxl },
  content: {
    width: "100%",
    maxWidth: layout.maxReadingWidth,
    alignSelf: "center",
    gap: spacing.xl,
  },
  lessonEyebrow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.md,
  },
  typePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    minHeight: 30,
    borderRadius: radii.full,
    backgroundColor: colors.primarySoft,
  },
  lessonTitle: { marginTop: -spacing.sm },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    marginTop: -spacing.md,
  },
  metaItem: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  objectivesHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  objectiveIcon: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.md,
    backgroundColor: colors.primarySoft,
  },
  objectiveHeading: { flex: 1, gap: 2 },
  objectiveList: {
    gap: spacing.md,
    marginTop: spacing.lg,
    paddingLeft: spacing.xs,
  },
  objectiveRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  objectiveText: { flex: 1, color: colors.text, fontSize: 15, lineHeight: 23 },
  generatingNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.primarySoft,
  },
  generatingText: { flex: 1 },
  contentSection: { gap: spacing.md },
  contentSectionTitle: { marginBottom: -spacing.xs },
  lessonBody: {
    gap: spacing.md,
    maxWidth: 640,
    alignSelf: "center",
    width: "100%",
  },
  contentHeading: { marginTop: spacing.sm },
  paragraph: { fontSize: 16, lineHeight: 27, color: colors.text },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    paddingLeft: spacing.xs,
  },
  bulletDot: {
    width: 7,
    height: 7,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    marginTop: 10,
  },
  quote: {
    padding: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    backgroundColor: colors.primaryTint,
    borderRadius: radii.md,
  },
  codeCard: {
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceSubtle,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  codeLabel: {
    color: colors.textSecondary,
    paddingHorizontal: spacing.md,
    letterSpacing: 1,
  },
  codeScroll: { paddingHorizontal: spacing.md },
  codeText: {
    color: colors.text,
    fontFamily: "monospace",
    fontSize: 14,
    lineHeight: 22,
  },
  resourcesSection: { gap: spacing.sm },
  resourceRow: {
    minHeight: 66,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resourceIcon: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.md,
    backgroundColor: colors.primarySoft,
  },
  resourceCopy: { flex: 1, gap: 3 },
  actionCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  actionIcon: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.md,
    backgroundColor: colors.primarySoft,
  },
  actionCopy: { flex: 1, gap: 3 },
  projectTitle: { marginTop: spacing.sm, marginBottom: spacing.sm },
  inlineError: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.errorSoft,
  },
  inlineErrorText: { flex: 1 },
  completionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  completionIcon: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.full,
    backgroundColor: colors.success,
  },
  completionDetail: { marginTop: spacing.sm, marginBottom: spacing.md },
  finishSection: { gap: spacing.sm, marginTop: spacing.xs },
  finishHint: { textAlign: "center" },
  alreadyComplete: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
});
