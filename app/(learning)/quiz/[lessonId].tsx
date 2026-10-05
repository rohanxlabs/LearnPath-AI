import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
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
import { userCacheStorageKey } from "../../../lib/mobileCache";
import { colors, layout, radii, spacing } from "../../../theme/tokens";

type Question = {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  misconceptionNotes: string[];
};
type Quiz = { id: string; title: string; questions: Question[] };
type Recommendation = {
  decision?: { reason?: string; action?: string };
  target?: { lessonId?: string; title?: string } | null;
};
type SavedAttempt = {
  answers: Record<string, number>;
  finished: boolean;
  recorded: boolean;
};

function parseQuestions(value: unknown): Question[] {
  return asList(value)
    .map((item, index) => {
      const row = asRecord(item);
      return {
        id: asText(row.id, `question-${index + 1}`),
        question: asText(row.question),
        options: asList(row.options).filter(
          (option): option is string => typeof option === "string",
        ),
        correctIndex: Number(row.correctIndex),
        explanation: asText(row.explanation),
        misconceptionNotes: asList(row.misconceptionNotes).filter(
          (note): note is string => typeof note === "string",
        ),
      };
    })
    .filter(
      (question) =>
        question.question &&
        question.options.length > 1 &&
        Number.isInteger(question.correctIndex) &&
        question.correctIndex >= 0 &&
        question.correctIndex < question.options.length,
    );
}

function isCodeOption(option: string) {
  return /[`"'=()[\]{}]|=>|==/.test(option);
}

export default function QuizScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    lessonId?: string | string[];
    roadmapId?: string | string[];
    lessonName?: string | string[];
  }>();
  const lessonId = Array.isArray(params.lessonId)
    ? params.lessonId[0]
    : params.lessonId;
  const roadmapId = Array.isArray(params.roadmapId)
    ? params.roadmapId[0]
    : params.roadmapId;
  const lessonName = Array.isArray(params.lessonName)
    ? params.lessonName[0]
    : params.lessonName;
  const { session, user } = useAuth();
  const accessToken = session?.access_token;
  const storageKey = user?.id
    ? userCacheStorageKey(user.id, `quiz-attempt:${lessonId ?? "missing"}`)
    : null;
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [attempt, setAttempt] = useState<SavedAttempt>({
    answers: {},
    finished: false,
    recorded: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [cachedAt, setCachedAt] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(
    null,
  );
  const [recommendationLoading, setRecommendationLoading] = useState(false);

  const load = useCallback(async () => {
    if (!lessonId || !session?.access_token || !user?.id) {
      setError(
        "Open practice from a lesson so your result can be attached to your learning path.",
      );
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (!storageKey)
        throw new Error("Sign in to save your practice progress.");
      const [topicResult, saved] = await Promise.all([
        cachedApiRequest<{ topic?: unknown }>(
          user.id,
          `lesson:${lessonId}`,
          `/api/topics/${encodeURIComponent(lessonId)}`,
          { accessToken: session.access_token },
        ),
        AsyncStorage.getItem(storageKey),
      ]);
      const topicResponse = topicResult.data;
      setCachedAt(topicResult.stale ? topicResult.savedAt : null);
      const topic = asRecord(topicResponse.topic);
      const stored = saved
        ? (JSON.parse(saved) as { quiz?: unknown; attempt?: SavedAttempt })
        : null;
      let data = asRecord(stored?.quiz ?? topic.quiz);
      let questions = parseQuestions(data.questions);
      if (!questions.length) {
        const generated = await apiRequest<unknown>("/api/generate-quiz", {
          method: "POST",
          accessToken: session.access_token,
          body: {
            topicName: asText(topic.name, lessonName ?? "this lesson"),
            lessonId,
          },
        });
        questions = parseQuestions(generated);
        data = {
          id: `quiz-${lessonId}`,
          title: `${asText(topic.name, lessonName ?? "Lesson")} practice`,
          questions,
        };
      }
      if (!questions.length)
        throw new Error(
          "A practice quiz is not available for this lesson yet. Please try again shortly.",
        );
      setQuiz({
        id: asText(data.id, `quiz-${lessonId}`),
        title: asText(
          data.title,
          `${asText(topic.name, lessonName ?? "Lesson")} practice`,
        ),
        questions,
      });
      if (!stored?.quiz)
        await AsyncStorage.setItem(
          storageKey,
          JSON.stringify({
            quiz: data,
            attempt: stored?.attempt ?? {
              answers: {},
              finished: false,
              recorded: false,
            },
          }),
        );
      const savedAttempt = stored?.attempt;
      if (savedAttempt) {
        setAttempt(savedAttempt);
        const answeredCount = questions.filter(
          (question) => savedAttempt.answers[question.id] !== undefined,
        ).length;
        setQuestionIndex(Math.min(answeredCount, questions.length - 1));
        setSelected(
          savedAttempt.answers[
            questions[Math.min(answeredCount, questions.length - 1)]?.id
          ] ?? null,
        );
      }
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Practice could not load. Check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  }, [session, lessonId, lessonName, storageKey, user]);

  useEffect(() => {
    const task = setTimeout(() => void load(), 0);
    return () => clearTimeout(task);
  }, [load]);
  const current = quiz?.questions[questionIndex];
  const answeredCurrent = current
    ? attempt.answers[current.id] !== undefined
    : false;
  const score = useMemo(
    () =>
      quiz?.questions.reduce(
        (total, question) =>
          total +
          (attempt.answers[question.id] === question.correctIndex ? 1 : 0),
        0,
      ) ?? 0,
    [attempt.answers, quiz],
  );

  const persist = async (next: SavedAttempt) => {
    setAttempt(next);
    if (quiz && storageKey)
      await AsyncStorage.setItem(
        storageKey,
        JSON.stringify({ quiz, attempt: next }),
      );
  };
  const finish = async (next: SavedAttempt) => {
    if (!quiz || !lessonId || !accessToken) return;
    const finalScore = quiz.questions.reduce(
      (total, question) =>
        total + (next.answers[question.id] === question.correctIndex ? 1 : 0),
      0,
    );
    await persist({ ...next, finished: true });
    setSaving(true);
    setError(null);
    try {
      await apiRequest("/api/learning-events", {
        method: "POST",
        accessToken,
        body: {
          eventType: "quiz_attempted",
          roadmapId,
          lessonId,
          properties: {
            score: finalScore,
            totalQuestions: quiz.questions.length,
            quizId: quiz.id,
            attempt: 1,
          },
        },
      });
      await persist({ ...next, finished: true, recorded: true });
      if (roadmapId) {
        setRecommendationLoading(true);
        try {
          const nextStep = await apiRequest<Recommendation>(
            `/api/roadmaps/${encodeURIComponent(roadmapId)}/next-action`,
            { accessToken },
          );
          setRecommendation(nextStep);
        } catch {
          setRecommendation(null);
        } finally {
          setRecommendationLoading(false);
        }
      }
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Your score is ready, but it has not synced yet. Retry when you are online.",
      );
    } finally {
      setSaving(false);
    }
  };
  const answer = async () => {
    if (!current || selected === null || answeredCurrent) return;
    const next = {
      ...attempt,
      answers: { ...attempt.answers, [current.id]: selected },
    };
    await persist(next);
    if (questionIndex === quiz!.questions.length - 1) await finish(next);
  };
  const continueQuiz = () => {
    if (!quiz) return;
    setQuestionIndex((index) => Math.min(index + 1, quiz.questions.length - 1));
    setSelected(
      quiz.questions[questionIndex + 1]
        ? (attempt.answers[quiz.questions[questionIndex + 1].id] ?? null)
        : null,
    );
  };
  const retrySync = () => void finish(attempt);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.page}>
        <View style={styles.top}>
          <IconButton
            icon="close"
            label="Close practice"
            onPress={() => router.back()}
          />
          <Typography variant="caption" color={colors.textSecondary}>
            PRACTICE
          </Typography>
          <View style={styles.spacer} />
        </View>
        {cachedAt ? <CacheNotice savedAt={cachedAt} /> : null}
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} />
            <Typography color={colors.textSecondary}>
              Preparing practiceâ€¦
            </Typography>
          </View>
        ) : error && !quiz ? (
          <View style={styles.center}>
            <Card>
              <Typography variant="title">Practice unavailable</Typography>
              <Typography color={colors.textSecondary} style={styles.copy}>
                {error}
              </Typography>
              <Button label="Try again" onPress={() => void load()} />
            </Card>
          </View>
        ) : quiz ? (
          <ScrollView contentContainerStyle={styles.content}>
            {!attempt.finished ? (
              <>
                <Typography variant="lessonTitle">{lessonName ?? quiz.title}</Typography>
                <View style={styles.progressMeta}>
                  <Typography variant="body" color={colors.textSecondary}>
                    Question {questionIndex + 1} of {quiz.questions.length}
                  </Typography>
                  <Typography variant="body" color={colors.textSecondary}>
                    {Math.round(
                      ((questionIndex + 1) / quiz.questions.length) * 100,
                    )}
                    % through practice
                  </Typography>
                </View>
                <ProgressBar
                  value={(questionIndex + 1) / quiz.questions.length}
                  thick
                  label={`Question ${questionIndex + 1} of ${quiz.questions.length}`}
                />
                {current ? (
                  <Card variant="outlined">
                    <Typography variant="lessonHeading" style={styles.questionText}>
                      {current.question}
                    </Typography>
                    <View style={styles.options}>
                      {current.options.map((option, index) => {
                        const isAnswer = attempt.answers[current.id] === index;
                        const isCorrect = index === current.correctIndex;
                        const reveal = answeredCurrent;
                        return (
                          <Pressable
                            key={`${index}-${option}`}
                            accessibilityRole="radio"
                            accessibilityState={{
                              checked: selected === index,
                              disabled: reveal,
                            }}
                            disabled={reveal}
                            onPress={() => setSelected(index)}
                            style={[
                              styles.option,
                              selected === index && !reveal && styles.selected,
                              reveal &&
                                (isCorrect
                                  ? styles.correct
                                  : isAnswer
                                    ? styles.incorrect
                                    : null),
                            ]}
                          >
                            <View style={[
                              styles.badge,
                              reveal && isCorrect
                                ? styles.correctBadge
                                : reveal && isAnswer
                                  ? styles.incorrectBadge
                                  : selected === index
                                    ? styles.selectedBadge
                                    : null,
                            ]}>
                              <Typography
                                variant="bodyMedium"
                                color={
                                  reveal && (isCorrect || isAnswer)
                                    ? colors.surface
                                    : colors.textSecondary
                                }
                              >
                                {String.fromCharCode(65 + index)}
                              </Typography>
                            </View>
                            <Typography
                              style={[
                                styles.optionText,
                                isCodeOption(option) && styles.codeOptionText,
                              ]}
                            >
                              {option}
                            </Typography>
                            {reveal && (isCorrect || isAnswer) ? (
                              <MaterialCommunityIcons
                                name={isCorrect ? "check-circle-outline" : "close-circle-outline"}
                                size={25}
                                color={isCorrect ? colors.success : colors.error}
                              />
                            ) : null}
                          </Pressable>
                        );
                      })}
                    </View>
                    {answeredCurrent ? (
                      <View style={styles.explanation}>
                        <View style={styles.feedbackDivider} />
                        <Typography
                          variant="sectionTitle"
                          color={
                            attempt.answers[current.id] === current.correctIndex
                              ? colors.success
                              : colors.error
                          }
                        >
                          {attempt.answers[current.id] === current.correctIndex
                            ? "Thatâ€™s right"
                            : "Not quite"}
                        </Typography>
                        <Typography color={colors.textSecondary}>
                          {current.explanation}
                        </Typography>
                        {current.misconceptionNotes.length ? (
                          <Typography
                            variant="caption"
                            color={colors.textMuted}
                          >
                            {current.misconceptionNotes[0]}
                          </Typography>
                        ) : null}
                      </View>
                    ) : null}
                  </Card>
                ) : null}
                {error ? (
                  <Typography accessibilityRole="alert" color={colors.error}>
                    {error}
                  </Typography>
                ) : null}
                {answeredCurrent ? (
                  <Button
                    label={
                      questionIndex === quiz.questions.length - 1
                        ? "See my result"
                        : "Continue"
                    }
                    loading={saving}
                    onPress={continueQuiz}
                  />
                ) : (
                  <Button
                    label="Check answer"
                    disabled={selected === null}
                    onPress={() => void answer()}
                  />
                )}
                <Typography variant="caption" color={colors.textMuted} style={styles.disclaimer}>
                  Answers are checked in the app. Your score is sent to
                  LearnPath as learning evidence when it syncs.
                </Typography>
              </>
            ) : (
              <>
                <View style={styles.resultIcon}>
                  <MaterialCommunityIcons
                    name="trending-up"
                    size={34}
                    color={colors.ink}
                  />
                </View>
                <Typography variant="lessonTitle" style={styles.resultHeading}>
                  {score === quiz.questions.length
                    ? "Excellent work"
                    : score === 0
                      ? "A good place to practice"
                      : "Youâ€™re making progress"}
                </Typography>
                <Typography color={colors.textSecondary}>
                  You got {score} of {quiz.questions.length} correct. Review the
                  explanations below, then revisit the lesson or ask Mentor for
                  help.
                </Typography>
                {!attempt.recorded ? (
                  <Card>
                    <Typography variant="bodyMedium">
                      Result waiting to sync
                    </Typography>
                    <Typography variant="caption" color={colors.textSecondary}>
                      Your score is saved on this device. Adaptive learning can
                      use it after the server confirms it.
                    </Typography>
                    {error ? (
                      <Typography
                        accessibilityRole="alert"
                        color={colors.error}
                      >
                        {error}
                      </Typography>
                    ) : null}
                    <Button
                      label="Retry sync"
                      loading={saving}
                      onPress={retrySync}
                    />
                  </Card>
                ) : (
                  <Card variant="subtle">
                    <View style={styles.resultCardHeader}>
                      <MaterialCommunityIcons
                        name="check-circle-outline"
                        size={24}
                        color={colors.success}
                      />
                      <Typography variant="bodyMedium" color={colors.success}>
                        Learning evidence saved
                      </Typography>
                    </View>
                    <Typography variant="caption" color={colors.textSecondary}>
                      LearnPath can use this result to calibrate your next
                      learning step.
                    </Typography>
                  </Card>
                )}
                {attempt.recorded &&
                recommendation?.target?.lessonId &&
                roadmapId ? (
                  <Card variant="selected">
                    <Typography variant="label" color={colors.primaryDark}>
                      RECOMMENDED NEXT STEP
                    </Typography>
                    <Typography
                      variant="sectionTitle"
                      style={styles.recommendationTitle}
                    >
                      {recommendation.target.title ??
                        "Continue your learning path"}
                    </Typography>
                    <Typography
                      variant="caption"
                      color={colors.textSecondary}
                      style={styles.copy}
                    >
                      {recommendation.decision?.reason ??
                        "Based on your learning path and saved quiz evidence."}
                    </Typography>
                    <Button
                      label="Go to recommended lesson"
                      variant="dark"
                      onPress={() =>
                        router.replace({
                          pathname: "/(learning)/lesson/[lessonId]",
                          params: {
                            lessonId: recommendation.target?.lessonId,
                            roadmapId,
                          },
                        } as never)
                      }
                    />
                  </Card>
                ) : null}
                {attempt.recorded && recommendationLoading ? (
                  <View style={styles.recommendationLoading}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Typography variant="caption" color={colors.textSecondary}>
                      Finding your next stepâ€¦
                    </Typography>
                  </View>
                ) : null}
                <Typography variant="sectionHeading" style={styles.answersHeading}>
                  Your answers
                </Typography>
                {quiz.questions.map((question, index) => (
                  <View
                    key={question.id}
                    style={[
                      styles.answerCard,
                      attempt.answers[question.id] !== question.correctIndex &&
                        styles.answerCardIncorrect,
                    ]}
                  >
                    <Typography variant="label" color={colors.textSecondary}>
                      QUESTION {index + 1}
                    </Typography>
                    <Typography variant="bodyMedium" style={styles.answerQuestion}>
                      {question.question}
                    </Typography>
                    <View style={styles.answerStatus}>
                      <MaterialCommunityIcons
                        name={
                          attempt.answers[question.id] === question.correctIndex
                            ? "check"
                            : "close"
                        }
                        size={18}
                        color={
                          attempt.answers[question.id] === question.correctIndex
                            ? colors.success
                            : colors.error
                        }
                      />
                      <Typography
                        variant="bodyMedium"
                        color={
                          attempt.answers[question.id] === question.correctIndex
                            ? colors.success
                            : colors.error
                        }
                      >
                        {attempt.answers[question.id] === question.correctIndex
                          ? "Correct"
                          : `Your answer: ${question.options[attempt.answers[question.id]] ?? "Not answered"}`}
                      </Typography>
                    </View>
                    <Typography variant="caption" color={colors.textSecondary}>
                      {question.explanation}
                    </Typography>
                  </View>
                ))}
                {score === quiz.questions.length && roadmapId ? (
                  <Button
                    label="Continue on my learning path"
                    onPress={() =>
                      router.replace({
                        pathname: "/(learning)/roadmap/[roadmapId]",
                        params: { roadmapId },
                      } as never)
                    }
                  />
                ) : null}
                <Button
                  label="Back to lesson"
                  variant="secondary"
                  onPress={() => router.back()}
                />
                <Button
                  label="Ask AI Mentor"
                  variant="secondary"
                  onPress={() =>
                    router.push({
                      pathname: "/(tabs)/mentor",
                      params: {
                        lessonId,
                        roadmapId,
                        lessonName: lessonName ?? quiz.title,
                      },
                    } as never)
                  }
                />
              </>
            )}
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
    gap: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  copy: { marginTop: spacing.sm, marginBottom: spacing.md },
  progressMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: -spacing.md,
  },
  questionText: {
    fontSize: 28,
    lineHeight: 36,
  },
  options: { gap: spacing.md, marginTop: spacing.lg },
  option: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  selected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryTint,
  },
  correct: { borderColor: colors.success, backgroundColor: colors.successSoft },
  incorrect: { borderColor: colors.error, backgroundColor: colors.errorSoft },
  badge: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceSubtle,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedBadge: { backgroundColor: colors.primary },
  correctBadge: { backgroundColor: colors.success },
  incorrectBadge: { backgroundColor: colors.error },
  optionText: { flex: 1 },
  codeOptionText: {
    fontFamily: "monospace",
    fontSize: 18,
  },
  explanation: { marginTop: spacing.lg, gap: spacing.sm },
  feedbackDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: spacing.sm,
  },
  disclaimer: {
    textAlign: "center",
    paddingHorizontal: spacing.lg,
  },
  resultIcon: {
    width: 70,
    height: 70,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primarySoft,
  },
  resultHeading: { marginTop: -spacing.sm },
  resultCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  recommendationTitle: {
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  answersHeading: {
    marginTop: spacing.md,
    marginBottom: -spacing.sm,
  },
  answerQuestion: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  answerStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  answerCard: {
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
  },
  answerCardIncorrect: {
    borderColor: "#E8B8B8",
  },
  recommendationLoading: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
});
