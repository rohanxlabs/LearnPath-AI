import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button, Card, Typography } from "../../components";
import { useAuth } from "../../hooks/useAuth";
import { ApiError, apiRequest } from "../../lib/api";
import { asList, asRecord, asText } from "../../lib/learning";
import { useActivePath } from "../../providers/ActivePathProvider";
import { colors, layout, radii, spacing } from "../../theme/tokens";

type Message = { id: string; sender: "user" | "assistant"; text: string };
type PathOption = { id: string; title: string; goal: string };
type MentorContext = {
  goal?: string;
  phase?: { name: string; description?: string };
  module?: { name: string; description?: string };
  lesson?: { name: string; description?: string };
  topics?: string[];
  progress?: {
    completedLessons: number;
    totalLessons: number;
    percentage: number;
  };
};
const suggestions = [
  "Explain this in simpler terms",
  "Give me a practical example",
  "What should I learn next?",
];

export default function MentorTab() {
  const params = useLocalSearchParams<{
    lessonId?: string | string[];
    roadmapId?: string | string[];
    lessonName?: string | string[];
  }>();
  const routeLessonId = Array.isArray(params.lessonId)
    ? params.lessonId[0]
    : params.lessonId;
  const routeRoadmapId = Array.isArray(params.roadmapId)
    ? params.roadmapId[0]
    : params.roadmapId;
  const routeLessonName = Array.isArray(params.lessonName)
    ? params.lessonName[0]
    : params.lessonName;
  const { session, bootstrap } = useAuth();
  const {
    activeRoadmapId: storedActiveRoadmapId,
    ready: activePathReady,
  } = useActivePath();
  const accessToken = session?.access_token;
  const pathOptions = useMemo<PathOption[]>(
    () =>
      asList(bootstrap?.roadmaps)
        .map((value) => {
          const row = asRecord(value);
          return {
            id: asText(row.id),
            title: asText(row.title ?? row.goal, "Learning path"),
            goal: asText(row.goal),
          };
        })
        .filter((path) => path.id),
    [bootstrap?.roadmaps],
  );
  const [selectedRoadmapId, setSelectedRoadmapId] = useState(
    routeRoadmapId ?? "",
  );
  const [roadmapData, setRoadmapData] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const messageId = useRef(0);
  const [draft, setDraft] = useState("");
  const [loadingContext, setLoadingContext] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quotaMessage, setQuotaMessage] = useState<string | null>(null);
  const [offlineReply, setOfflineReply] = useState(false);
  const [routeContextDismissed, setRouteContextDismissed] = useState(false);
  const [manualContextSelected, setManualContextSelected] = useState(false);

  const activeRoadmapId =
    routeRoadmapId && !routeContextDismissed
      ? routeRoadmapId
      : manualContextSelected
        ? selectedRoadmapId
        : selectedRoadmapId || (activePathReady ? storedActiveRoadmapId ?? "" : "");
  const activeLessonId =
    activeRoadmapId === routeRoadmapId && !routeContextDismissed
      ? routeLessonId
      : undefined;
  const activeLessonName =
    activeRoadmapId === routeRoadmapId && !routeContextDismissed
      ? routeLessonName
      : undefined;
  const loadContext = useCallback(async () => {
    if (!activeRoadmapId || !accessToken) {
      setRoadmapData(null);
      return;
    }
    setLoadingContext(true);
    try {
      const response = await apiRequest<{ roadmap?: unknown }>(
        `/api/roadmaps/${encodeURIComponent(activeRoadmapId)}`,
        { accessToken },
      );
      setRoadmapData(asRecord(response.roadmap));
    } catch {
      setRoadmapData(null);
    } finally {
      setLoadingContext(false);
    }
  }, [accessToken, activeRoadmapId]);
  useEffect(() => {
    const task = setTimeout(() => void loadContext(), 0);
    return () => clearTimeout(task);
  }, [loadContext]);

  const selectedPath = pathOptions.find((path) => path.id === activeRoadmapId);
  const mentorContext = useMemo<MentorContext | undefined>(() => {
    if (!roadmapData) return undefined;
    const phases = asList(roadmapData.phases);
    let phaseChoice: Record<string, unknown> | null = null;
    let moduleChoice: Record<string, unknown> | null = null;
    let lessonChoice: Record<string, unknown> | null = null;
    for (const phaseValue of phases) {
      const phase = asRecord(phaseValue);
      for (const moduleValue of asList(phase.levels ?? phase.modules)) {
        const module = asRecord(moduleValue);
        for (const lessonValue of asList(module.lessons ?? module.topics)) {
          const lesson = asRecord(lessonValue);
          if (activeLessonId && asText(lesson.id) === activeLessonId) {
            phaseChoice = phase;
            moduleChoice = module;
            lessonChoice = lesson;
          }
          if (
            !lessonChoice &&
            ["current", "in_progress", "available"].includes(
              asText(lesson.status).toLowerCase(),
            )
          ) {
            phaseChoice = phase;
            moduleChoice = module;
            lessonChoice = lesson;
          }
        }
      }
    }
    const allLessons = phases.flatMap((phaseValue) =>
      asList(
        asRecord(phaseValue).levels ?? asRecord(phaseValue).modules,
      ).flatMap((moduleValue) =>
        asList(asRecord(moduleValue).lessons ?? asRecord(moduleValue).topics),
      ),
    );
    const completed = allLessons.filter(
      (lesson) => asText(asRecord(lesson).status).toLowerCase() === "completed",
    ).length;
    const goal = asText(roadmapData.goal);
    return {
      ...(goal ? { goal } : {}),
      ...(phaseChoice
        ? {
            phase: {
              name: asText(phaseChoice.name ?? phaseChoice.title),
              description: asText(phaseChoice.description),
            },
          }
        : {}),
      ...(moduleChoice
        ? {
            module: {
              name: asText(moduleChoice.name ?? moduleChoice.title),
              description: asText(moduleChoice.description),
            },
          }
        : {}),
      ...(activeLessonName || lessonChoice
        ? {
            lesson: {
              name:
                activeLessonName ||
                asText(lessonChoice?.name ?? lessonChoice?.title),
              description: asText(lessonChoice?.description),
            },
          }
        : {}),
      ...(lessonChoice
        ? {
            topics: asList(
              asRecord(lessonChoice).learningObjectives ??
                asRecord(lessonChoice).objectives,
            ).filter((item): item is string => typeof item === "string"),
          }
        : {}),
      progress: {
        completedLessons: completed,
        totalLessons: allLessons.length,
        percentage: allLessons.length
          ? Math.round((completed / allLessons.length) * 100)
          : 0,
      },
    };
  }, [roadmapData, activeLessonId, activeLessonName]);

  const send = async (textValue = draft) => {
    const message = textValue.trim();
    if (!message || !accessToken || sending) return;
    setSending(true);
    setError(null);
    setQuotaMessage(null);
    setOfflineReply(false);
    messageId.current += 1;
    const userMessage: Message = {
      id: `user-${messageId.current}`,
      sender: "user",
      text: message,
    };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setDraft("");
    try {
      const response = await apiRequest<string>("/api/mentor-chat", {
        method: "POST",
        accessToken,
        body: {
          message,
          history: messages.map(({ sender, text }) => ({ sender, text })),
          roadmapContext: mentorContext,
        },
      });
      const reply =
        typeof response === "string"
          ? response.trim()
          : "I couldn’t prepare a response. Please try again.";
      setOfflineReply(
        reply.toLowerCase().startsWith("ai mentor (offline mode)"),
      );
      messageId.current += 1;
      const replyId = `assistant-${messageId.current}`;
      setMessages((current) => [
        ...current,
        { id: replyId, sender: "assistant", text: reply },
      ]);
    } catch (cause) {
      setMessages((current) =>
        current.filter((item) => item.id !== userMessage.id),
      );
      setDraft(message);
      if (cause instanceof ApiError && cause.status === 429)
        setQuotaMessage(
          "You’ve reached the Mentor request limit for now. Your message is still here; try again later.",
        );
      else
        setError(
          cause instanceof Error
            ? cause.message
            : "Mentor couldn’t respond. Your message is saved in the draft field.",
        );
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <View style={styles.avatar}>
            <MaterialCommunityIcons
              name="message-question-outline"
              size={29}
              color={colors.ink}
            />
          </View>
          <View style={styles.headerText}>
            <Typography variant="sectionHeading" style={styles.headerTitle}>AI Mentor</Typography>
            <Typography color={colors.textSecondary} style={styles.headerSubtitle}>
              A guide for your next learning step
            </Typography>
          </View>
          <View style={styles.onlineStatus}>
            <View style={styles.onlineDot} />
            <Typography variant="bodyMedium" color={colors.success} style={styles.onlineText}>
              Online
            </Typography>
          </View>
        </View>
        <View style={styles.contextArea}>
          {activeRoadmapId ? (
            <View style={styles.contextChip}>
              <MaterialCommunityIcons
                name="map-marker-path"
                size={21}
                color={colors.primaryDark}
              />
              <Typography
                variant="bodyMedium"
                color={colors.primaryDark}
                numberOfLines={1}
                style={styles.flexText}
              >
                {selectedPath?.title ?? "Learning path"}
                {mentorContext?.lesson?.name || activeLessonName
                  ? ` · ${mentorContext?.lesson?.name || activeLessonName}`
                  : ""}
              </Typography>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Clear learning path context"
                hitSlop={10}
                style={styles.contextClose}
                onPress={() => {
                  setSelectedRoadmapId("");
                  setRouteContextDismissed(true);
                  setManualContextSelected(true);
                  setRoadmapData(null);
                }}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={22}
                  color={colors.primaryDark}
                />
              </Pressable>
            </View>
          ) : (
            <Typography variant="caption" color={colors.textSecondary}>
              Choose a path for tailored help, or ask a general question.
            </Typography>
          )}
          {!activeRoadmapId && pathOptions.length ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pathOptions}
            >
              {pathOptions.map((path) => (
                <Pressable
                  key={path.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Use ${path.title} for Mentor context`}
                  onPress={() => {
                    setRouteContextDismissed(true);
                    setManualContextSelected(true);
                    setSelectedRoadmapId(path.id);
                  }}
                  style={styles.pathOption}
                >
                  <MaterialCommunityIcons
                    name="map-marker-path"
                    size={16}
                    color={colors.primary}
                  />
                  <Typography
                    variant="caption"
                    numberOfLines={1}
                    style={styles.pathLabel}
                  >
                    {path.title}
                  </Typography>
                </Pressable>
              ))}
            </ScrollView>
          ) : null}
          {loadingContext ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : null}
        </View>
        <ScrollView
          style={styles.chat}
          contentContainerStyle={styles.chatContent}
          keyboardShouldPersistTaps="handled"
        >
          {messages.length === 0 ? (
            <View style={styles.welcome}>
              <View style={styles.welcomeIcon}>
                <MaterialCommunityIcons
                  name="creation"
                  size={31}
                  color={colors.ink}
                />
              </View>
              <Typography variant="display" style={styles.welcomeTitle}>
                What are you learning?
              </Typography>
              <Typography
                color={colors.textSecondary}
                style={styles.welcomeCopy}
              >
                Ask a question, work through a confusing idea, or get a
                practical example. You can change the learning-path context
                above.
              </Typography>
              <View style={styles.suggestions}>
                {suggestions.map((item) => (
                  <Pressable
                    key={item}
                    accessibilityRole="button"
                    accessibilityLabel={`Ask Mentor: ${item}`}
                    onPress={() => void send(item)}
                    style={styles.suggestion}
                  >
                    <Typography variant="bodyMedium" style={styles.suggestionText}>
                      {item}
                    </Typography>
                    <MaterialCommunityIcons
                      name="arrow-up-right"
                      size={23}
                      color={colors.primaryDark}
                    />
                  </Pressable>
                ))}
              </View>
            </View>
          ) : (
            messages.map((message) => (
              <View
                key={message.id}
                style={[
                  styles.messageRow,
                  message.sender === "user"
                    ? styles.userRow
                    : styles.assistantRow,
                ]}
              >
                <View
                  style={[
                    styles.bubble,
                    message.sender === "user"
                      ? styles.userBubble
                      : styles.assistantBubble,
                  ]}
                >
                  <Typography
                    style={
                      message.sender === "user" ? styles.userText : undefined
                    }
                    selectable
                  >
                    {message.text}
                  </Typography>
                </View>
              </View>
            ))
          )}
          {sending ? (
            <View style={styles.typing}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Typography variant="caption" color={colors.textSecondary}>
                Mentor is thinking…
              </Typography>
            </View>
          ) : null}
          {offlineReply ? (
            <Card>
              <Typography variant="caption" color={colors.warning}>
                Mentor returned a fallback response because AI is temporarily
                unavailable.
              </Typography>
            </Card>
          ) : null}
          {quotaMessage ? (
            <Typography
              accessibilityRole="alert"
              variant="caption"
              color={colors.warning}
            >
              {quotaMessage}
            </Typography>
          ) : null}
          {error ? (
            <Card>
              <Typography
                accessibilityRole="alert"
                variant="caption"
                color={colors.error}
              >
                {error}
              </Typography>
              <Button
                label="Retry message"
                variant="secondary"
                onPress={() => void send(draft)}
              />
            </Card>
          ) : null}
        </ScrollView>
        <View style={styles.disclaimer}>
          <Typography variant="caption" color={colors.textMuted}>
            This chat is kept only during this session.
          </Typography>
        </View>
        <View style={styles.composer}>
          <TextInput
            accessibilityLabel="Message AI Mentor"
            placeholder="Ask your Mentor…"
            placeholderTextColor={colors.textMuted}
            value={draft}
            onChangeText={setDraft}
            multiline
            maxLength={500}
            editable={!sending}
            style={styles.input}
            returnKeyType="default"
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send message"
            accessibilityState={{ disabled: !draft.trim() || sending }}
            disabled={!draft.trim() || sending}
            onPress={() => void send()}
            style={[
              styles.sendButton,
              (!draft.trim() || sending) && styles.sendDisabled,
            ]}
          >
            {sending ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <MaterialCommunityIcons
                name="arrow-up"
                size={22}
                color={colors.surface}
              />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  flexText: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: layout.screenPadding,
    paddingVertical: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: radii.xl,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  headerText: { flex: 1, gap: 1 },
  headerTitle: { fontSize: 24, lineHeight: 29 },
  headerSubtitle: { fontSize: 16, lineHeight: 23 },
  onlineStatus: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  onlineText: { fontSize: 15 },
  onlineDot: {
    width: 10,
    height: 10,
    borderRadius: radii.full,
    backgroundColor: colors.success,
  },
  contextArea: {
    paddingHorizontal: layout.screenPadding,
    paddingVertical: spacing.smPlus,
    gap: spacing.sm,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
  },
  contextChip: {
    flexDirection: "row",
    minHeight: 60,
    gap: spacing.smPlus,
    alignItems: "center",
    backgroundColor: colors.primaryTint,
    borderRadius: radii.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  contextClose: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  pathOptions: { gap: spacing.sm },
  pathOption: {
    maxWidth: 250,
    minHeight: 44,
    flexDirection: "row",
    gap: spacing.xs,
    alignItems: "center",
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pathLabel: { maxWidth: 205 },
  chat: { flex: 1 },
  chatContent: { flexGrow: 1, padding: layout.screenPadding, gap: spacing.md },
  welcome: { flex: 1, justifyContent: "center", gap: spacing.mdPlus },
  welcomeIcon: {
    width: 64,
    height: 64,
    borderRadius: radii.lg,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primarySoft,
  },
  welcomeTitle: { fontSize: 36, lineHeight: 42, letterSpacing: -0.6 },
  welcomeCopy: { fontSize: 18, lineHeight: 28 },
  suggestions: { gap: spacing.smPlus, marginTop: spacing.sm },
  suggestion: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
  },
  suggestionText: { fontSize: 17, lineHeight: 24, flex: 1 },
  messageRow: { width: "100%" },
  userRow: { alignItems: "flex-end" },
  assistantRow: { alignItems: "flex-start" },
  bubble: { maxWidth: "88%", padding: spacing.md, borderRadius: radii.lg },
  userBubble: { backgroundColor: colors.primary },
  assistantBubble: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  userText: { color: colors.surface },
  typing: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  disclaimer: { alignItems: "center", paddingVertical: spacing.xs },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
    paddingHorizontal: layout.screenPadding,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 60,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.mdPlus,
    backgroundColor: colors.surfaceSubtle,
    color: colors.text,
    fontSize: 16,
    fontFamily: "Outfit_400Regular",
  },
  sendButton: {
    width: 60,
    height: 60,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  sendDisabled: { opacity: 0.45 },
});
