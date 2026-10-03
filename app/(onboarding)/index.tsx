import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, type Href } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

import { Button, Card, IconButton, ProgressBar, Screen, Typography } from "../../components";
import { useAuth } from "../../hooks/useAuth";
import { apiRequest } from "../../lib/api";
import { colors, layout, radii, spacing } from "../../theme/tokens";

const suggestions = ["Learn Python", "Improve my writing", "Understand personal finance"];
const experienceChoices = [
  { value: "Beginner", title: "New to this", description: "I’m starting from the basics.", icon: "sprout-outline" },
  { value: "Intermediate", title: "I’ve tried it before", description: "I know a little and want to build on it.", icon: "trending-up" },
  { value: "Advanced", title: "Ready to go deeper", description: "I have experience and want to sharpen my skills.", icon: "rocket-launch-outline" },
] as const;
const studyChoices = [
  { label: "1–2 hours", value: 2 },
  { label: "3–5 hours", value: 4 },
  { label: "6–8 hours", value: 7 },
  { label: "9+ hours", value: 10 },
] as const;
const stepTitles = ["Your goal", "Your experience", "Your study time", "Review"] as const;

type GeneratedRoadmap = { id: string; goal: string; title?: string; phases?: unknown[] };

export default function CreatePathScreen() {
  const router = useRouter();
  const { session, refreshBootstrap } = useAuth();
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState("");
  const [experience, setExperience] = useState<string | null>(null);
  const [weeklyHours, setWeeklyHours] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedRoadmap, setGeneratedRoadmap] = useState<GeneratedRoadmap | null>(null);
  const [draftReady, setDraftReady] = useState(false);
  const draftKey = session?.user.id ? `learnpath:onboarding:${session.user.id}` : null;

  useEffect(() => {
    let active = true;
    if (!draftKey) return () => { active = false; };
    void AsyncStorage.getItem(draftKey).then((saved) => {
      if (!active) return;
      if (saved) {
        try {
          const draft = JSON.parse(saved) as { step?: number; goal?: string; experience?: string | null; weeklyHours?: number | null; generatedRoadmap?: GeneratedRoadmap | null };
          setStep(Math.max(0, Math.min(3, Number(draft.step) || 0)));
          setGoal(typeof draft.goal === "string" ? draft.goal : "");
          setExperience(typeof draft.experience === "string" ? draft.experience : null);
          setWeeklyHours(typeof draft.weeklyHours === "number" ? draft.weeklyHours : null);
          setGeneratedRoadmap(draft.generatedRoadmap ?? null);
        } catch {
          void AsyncStorage.removeItem(draftKey);
        }
      }
    }).catch(() => undefined).finally(() => {
      if (active) setDraftReady(true);
    });
    return () => { active = false; };
  }, [draftKey]);

  useEffect(() => {
    if (!draftReady || !draftKey) return;
    void AsyncStorage.setItem(draftKey, JSON.stringify({ step, goal, experience, weeklyHours, generatedRoadmap })).catch(() => undefined);
  }, [draftReady, draftKey, step, goal, experience, weeklyHours, generatedRoadmap]);

  const canContinue = step === 0 ? goal.trim().length >= 3 : step === 1 ? Boolean(experience) : step === 2 ? Boolean(weeklyHours) : true;

  const createPath = async () => {
    if (!session) return;
    setError(null);
    setLoading(true);
    try {
      let roadmap = generatedRoadmap;
      if (!roadmap) {
        roadmap = await apiRequest<GeneratedRoadmap>("/api/generate-roadmap", {
          method: "POST",
          accessToken: session.access_token,
          body: { goal: goal.trim(), experienceLevel: experience, weeklyHours },
        });
        if (!roadmap?.id || !roadmap.goal) throw new Error("The path response was incomplete. Please try again.");
        setGeneratedRoadmap(roadmap);
      }
      await apiRequest("/api/roadmaps", {
        method: "POST",
        accessToken: session.access_token,
        body: roadmap,
      });
      if (draftKey) await AsyncStorage.removeItem(draftKey);
      await refreshBootstrap();
      router.replace({
        pathname: "/(onboarding)/path-ready",
        params: { title: roadmap.title || roadmap.goal, phaseCount: String(roadmap.phases?.length ?? 0), roadmapId: roadmap.id },
      } as Href);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Your learning path could not be created. Your answers are saved here; try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll keyboardAvoiding contentContainerStyle={styles.screenContent}>
      <View style={styles.topRow}>
        <IconButton icon="arrow-left" label={step === 0 ? "Back" : "Previous step"} onPress={() => step === 0 ? router.back() : setStep(step - 1)} />
        <Typography variant="caption" color={colors.textSecondary}>STEP {step + 1} OF {stepTitles.length}</Typography>
        <View style={styles.topSpacer} />
      </View>
      <ProgressBar value={(step + 1) / stepTitles.length} label={`Step ${step + 1} of ${stepTitles.length}`} />

      <View style={styles.headingBlock}>
        <Typography variant="label" color={colors.primary}>BUILD A PATH THAT FITS YOU</Typography>
        <Typography variant="heading" style={styles.heading}>{stepTitles[step]}</Typography>
        <Typography color={colors.textSecondary}>
          {step === 0 ? "What would you like to learn? Start with a topic or a goal." : null}
          {step === 1 ? "A quick starting point helps us choose the right first lessons." : null}
          {step === 2 ? "Choose a pace that feels realistic. You can change it later." : null}
          {step === 3 ? "Here’s what we’ll use to shape your learning path." : null}
        </Typography>
      </View>

      {step === 0 ? (
        <View style={styles.stepBody}>
          <View style={styles.goalInputWrap}>
            <MaterialCommunityIcons name="magnify" size={21} color={colors.textMuted} />
            <TextInput
              accessibilityLabel="Learning goal"
              value={goal}
              onChangeText={(value) => { setGoal(value); setError(null); }}
              placeholder="e.g. Build my first website"
              placeholderTextColor={colors.textMuted}
              style={styles.goalInput}
              multiline
              maxLength={160}
              returnKeyType="done"
              textAlignVertical="top"
            />
          </View>
          <Typography variant="caption" color={colors.textMuted}>Be as broad or specific as you like.</Typography>
          <Typography variant="label" color={colors.textSecondary} style={styles.suggestionLabel}>IDEAS TO GET STARTED</Typography>
          <View style={styles.suggestionList}>
            {suggestions.map((item) => (
              <Pressable key={item} accessibilityRole="button" onPress={() => setGoal(item)} style={styles.suggestion}>
                <Typography variant="bodyMedium">{item}</Typography>
                <MaterialCommunityIcons name="arrow-top-left" size={19} color={colors.primary} />
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      {step === 1 ? (
        <View style={styles.choiceList}>
          {experienceChoices.map((choice) => {
            const selected = experience === choice.value;
            return (
              <Pressable
                key={choice.value}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => setExperience(choice.value)}
                style={[styles.experienceCard, selected && styles.choiceSelected]}
              >
                <View style={[styles.choiceIcon, selected && styles.choiceIconSelected]}>
                  <MaterialCommunityIcons name={choice.icon} size={22} color={selected ? colors.primary : colors.textSecondary} />
                </View>
                <View style={styles.choiceCopy}>
                  <Typography variant="bodyMedium">{choice.title}</Typography>
                  <Typography variant="caption" color={colors.textSecondary}>{choice.description}</Typography>
                </View>
                <MaterialCommunityIcons name={selected ? "check-circle" : "circle-outline"} size={22} color={selected ? colors.primary : colors.borderStrong} />
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {step === 2 ? (
        <View style={styles.studyList}>
          {studyChoices.map((choice, index) => {
            const selected = weeklyHours === choice.value;
            return (
              <Pressable key={choice.value} accessibilityRole="radio" accessibilityState={{ selected }} onPress={() => setWeeklyHours(choice.value)} style={[styles.studyChoice, selected && styles.choiceSelected]}>
                <View style={styles.studyIcon}><MaterialCommunityIcons name={index === 0 ? "clock-outline" : "calendar-clock-outline"} size={20} color={selected ? colors.primary : colors.textSecondary} /></View>
                <Typography variant="bodyMedium" style={styles.studyText}>{choice.label}</Typography>
                <Typography variant="caption" color={colors.textSecondary}>per week</Typography>
                <MaterialCommunityIcons name={selected ? "check-circle" : "circle-outline"} size={22} color={selected ? colors.primary : colors.borderStrong} />
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {step === 3 ? (
        <Card>
          <View style={styles.reviewItem}>
            <View style={styles.reviewIcon}><MaterialCommunityIcons name="target" size={20} color={colors.primary} /></View>
            <View style={styles.reviewCopy}><Typography variant="caption" color={colors.textSecondary}>YOUR GOAL</Typography><Typography variant="bodyMedium">{goal.trim()}</Typography></View>
            <Pressable accessibilityRole="button" accessibilityLabel="Edit goal" onPress={() => setStep(0)}><Typography variant="caption" color={colors.primary}>Edit</Typography></Pressable>
          </View>
          <View style={styles.reviewDivider} />
          <View style={styles.reviewItem}>
            <View style={styles.reviewIcon}><MaterialCommunityIcons name="signal-cellular-3" size={20} color={colors.primary} /></View>
            <View style={styles.reviewCopy}><Typography variant="caption" color={colors.textSecondary}>EXPERIENCE</Typography><Typography variant="bodyMedium">{experienceChoices.find((item) => item.value === experience)?.title}</Typography></View>
            <Pressable accessibilityRole="button" accessibilityLabel="Edit experience" onPress={() => setStep(1)}><Typography variant="caption" color={colors.primary}>Edit</Typography></Pressable>
          </View>
          <View style={styles.reviewDivider} />
          <View style={styles.reviewItem}>
            <View style={styles.reviewIcon}><MaterialCommunityIcons name="calendar-clock-outline" size={20} color={colors.primary} /></View>
            <View style={styles.reviewCopy}><Typography variant="caption" color={colors.textSecondary}>WEEKLY STUDY TIME</Typography><Typography variant="bodyMedium">{studyChoices.find((item) => item.value === weeklyHours)?.label}</Typography></View>
            <Pressable accessibilityRole="button" accessibilityLabel="Edit weekly study time" onPress={() => setStep(2)}><Typography variant="caption" color={colors.primary}>Edit</Typography></Pressable>
          </View>
        </Card>
      ) : null}

      {error ? (
        <View accessibilityRole="alert" style={styles.errorBox}>
          <MaterialCommunityIcons name="alert-circle-outline" size={20} color={colors.error} />
          <Typography variant="caption" color={colors.error} style={styles.errorCopy}>{error}</Typography>
        </View>
      ) : null}

      <View style={styles.footer}>
        {step < 3 ? (
          <Button label="Continue" disabled={!canContinue} onPress={() => { setError(null); setStep(step + 1); }} />
        ) : (
          <Button label="Create my learning path" loading={loading} onPress={() => void createPath()} />
        )}
        <Typography variant="caption" color={colors.textMuted} style={styles.footerHint}>
          {step === 3 ? "You can adjust your pace and preferences later." : "Your answers shape the first lessons in your path."}
        </Typography>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenContent: { paddingBottom: spacing.xl },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.md },
  topSpacer: { width: layout.iconButtonSize },
  headingBlock: { marginTop: spacing.xl, gap: spacing.sm },
  heading: { marginTop: spacing.xs },
  stepBody: { marginTop: spacing.xl },
  goalInputWrap: { minHeight: 124, flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, padding: spacing.md, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radii.lg, backgroundColor: colors.surface },
  goalInput: { flex: 1, minHeight: 92, padding: 0, color: colors.text, fontSize: 17, lineHeight: 25 },
  suggestionLabel: { marginTop: spacing.xl, marginBottom: spacing.sm },
  suggestionList: { gap: spacing.sm },
  suggestion: { minHeight: 52, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.md, borderRadius: radii.md, backgroundColor: colors.surface },
  choiceList: { gap: spacing.md, marginTop: spacing.xl },
  experienceCard: { minHeight: 92, flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, backgroundColor: colors.surface },
  choiceSelected: { borderColor: colors.primary, backgroundColor: colors.primaryTint },
  choiceIcon: { width: 44, height: 44, borderRadius: radii.md, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  choiceIconSelected: { backgroundColor: colors.primarySoft },
  choiceCopy: { flex: 1, gap: 4 },
  studyList: { gap: spacing.sm, marginTop: spacing.xl },
  studyChoice: { minHeight: 60, flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, backgroundColor: colors.surface },
  studyIcon: { width: 34, alignItems: "center" },
  studyText: { flex: 1 },
  reviewItem: { minHeight: 70, flexDirection: "row", alignItems: "center", gap: spacing.md },
  reviewIcon: { width: 40, height: 40, borderRadius: radii.md, alignItems: "center", justifyContent: "center", backgroundColor: colors.primarySoft },
  reviewCopy: { flex: 1, gap: 3 },
  reviewDivider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.xs },
  errorBox: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start", padding: spacing.md, marginTop: spacing.lg, borderRadius: radii.md, backgroundColor: colors.errorSoft },
  errorCopy: { flex: 1 },
  footer: { marginTop: spacing.xl, gap: spacing.sm },
  footerHint: { textAlign: "center" },
});
