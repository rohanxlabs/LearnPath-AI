import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, type Href } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from "react-native";

import { Button, IconButton, ProgressBar, Screen, Typography } from "../../components";
import { useAuth } from "../../hooks/useAuth";
import { apiRequest } from "../../lib/api";
import { colors, layout, radii, spacing } from "../../theme/tokens";

const suggestions = ["Learn Python", "Improve my writing", "Understand personal finance"];
const experienceChoices = [
  { value: "Beginner", title: "New to this", description: "I'm starting from the basics.", icon: "sprout-outline" },
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
    <Screen scroll keyboardAvoiding contentContainerStyle={step === 0 ? styles.goalScreenContent : step <= 3 ? styles.experienceScreenContent : styles.screenContent}>
      <View style={[styles.topRow, step === 0 && styles.goalTopRow, step > 0 && step <= 3 && styles.experienceTopRow]}>
        <View style={step <= 3 && styles.goalBackButton}>
          <IconButton icon="arrow-left" label={step === 0 ? "Back" : step <= 3 ? "Go back" : "Previous step"} onPress={() => step === 0 ? router.back() : setStep(step - 1)} size={step <= 3 ? "large" : "medium"} />
        </View>
        <Typography variant="caption" color={colors.textSecondary}>STEP {step + 1} OF {stepTitles.length}</Typography>
        <View style={styles.topSpacer} />
      </View>
      <ProgressBar value={(step + 1) / stepTitles.length} label={`Step ${step + 1} of ${stepTitles.length}`} />

      <View style={[styles.headingBlock, step === 0 && styles.goalHeadingBlock, step > 0 && step <= 3 && styles.experienceHeadingBlock]}>
        <Typography variant="label" color={colors.primaryDark} style={step <= 3 && styles.goalEyebrow}>BUILD A PATH THAT FITS YOU</Typography>
        <Typography variant={step <= 3 ? "display" : "heading"} style={[styles.heading, step === 0 && styles.goalHeading, step > 0 && step <= 3 && styles.experienceHeading]}>{stepTitles[step]}</Typography>
        <Typography color={colors.textSecondary} style={step > 0 && step <= 3 && styles.experienceDescription}>
          {step === 0 ? "What would you like to learn? Start with a topic or a goal." : null}
          {step === 1 ? "A quick starting point helps us choose the right first lessons." : null}
          {step === 2 ? "Choose a pace that feels realistic. You can change it later." : null}
          {step === 3 ? "Here’s what we’ll use to shape your learning path." : null}
        </Typography>
      </View>

      {step === 0 ? (
        <View style={styles.goalStepBody}>
          <View style={styles.goalInputWrap}>
            <MaterialCommunityIcons name="magnify" size={21} color={colors.textMuted} />
            <TextInput
              accessibilityLabel="Learning goal"
              value={goal}
              onChangeText={(value) => { setGoal(value); setError(null); }}
              placeholder="What would you like to learn?"
              placeholderTextColor={colors.textMuted}
              style={styles.goalInput}
              maxLength={160}
              returnKeyType="done"
              autoCapitalize="sentences"
            />
            {goal.length > 0 ? (
              <Pressable accessibilityRole="button" accessibilityLabel="Clear goal" onPress={() => { setGoal(""); setError(null); }} hitSlop={8} style={styles.clearGoalButton}>
                <MaterialCommunityIcons name="close" size={23} color={colors.textSecondary} />
              </Pressable>
            ) : null}
          </View>
          <Typography variant="bodySmall" color={colors.textMuted} style={styles.goalHint}>Be as broad or specific as you like.</Typography>
          <Typography variant="label" color={colors.textSecondary} style={styles.suggestionLabel}>IDEAS TO GET STARTED</Typography>
          <View style={styles.suggestionList}>
            {suggestions.map((item) => (
              <Pressable
                key={item}
                accessibilityRole="button"
                accessibilityLabel={item}
                accessibilityState={{ selected: goal.trim().toLowerCase() === item.toLowerCase() }}
                onPress={() => { setGoal(item); setError(null); }}
                style={[styles.suggestion, goal.trim().toLowerCase() === item.toLowerCase() && styles.suggestionSelected]}
              >
                {goal.trim().toLowerCase() === item.toLowerCase() ? <MaterialCommunityIcons name="check" size={19} color={colors.primaryDark} /> : null}
                <Typography variant="bodyMedium" color={goal.trim().toLowerCase() === item.toLowerCase() ? colors.primaryDark : colors.text}>
                  {item}
                </Typography>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      {step === 1 ? (
        <View style={[styles.choiceList, styles.experienceChoiceList]}>
          {experienceChoices.map((choice) => {
            const selected = experience === choice.value;
            return (
              <Pressable
                key={choice.value}
                accessibilityRole="radio"
                accessibilityLabel={`${choice.title}. ${choice.description}`}
                accessibilityState={{ selected }}
                onPress={() => setExperience(choice.value)}
                style={[styles.experienceCard, selected && styles.experienceSelected]}
              >
                <View style={[styles.choiceIcon, styles.experienceChoiceIcon, selected && styles.experienceChoiceIconSelected]}>
                  <MaterialCommunityIcons name={choice.icon} size={22} color={selected ? colors.primaryDark : colors.textSecondary} />
                </View>
                <View style={styles.choiceCopy}>
                  <Typography variant="bodyMedium" style={styles.experienceTitle}>{choice.title}</Typography>
                  <Typography color={colors.textSecondary} style={styles.experienceDescription}>{choice.description}</Typography>
                </View>
                <View style={[styles.experienceRadio, selected ? styles.experienceRadioSelected : styles.experienceRadioUnselected]}>
                  {selected ? <MaterialCommunityIcons name="check" size={19} color={colors.surface} /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {step === 2 ? (
        <View style={styles.studyTimeList}>
          {studyChoices.map((choice, index) => {
            const selected = weeklyHours === choice.value;
            return (
              <Pressable
                key={choice.value}
                accessibilityRole="radio"
                accessibilityLabel={`${choice.label} per week`}
                accessibilityState={{ selected }}
                onPress={() => setWeeklyHours(choice.value)}
                style={[styles.studyTimeChoice, selected && styles.studyTimeSelected]}
              >
                <View style={[styles.studyIcon, styles.studyTimeIcon, selected && styles.studyTimeIconSelected]}>
                  <MaterialCommunityIcons name={index === 0 ? "clock-outline" : "calendar-clock-outline"} size={24} color={colors.primaryDark} />
                </View>
                <Typography variant="bodyMedium" style={styles.studyText}>{choice.label}</Typography>
                <Typography variant="bodySmall" color={colors.textSecondary} style={styles.perWeek}>per week</Typography>
                <View style={[styles.experienceRadio, selected ? styles.experienceRadioSelected : styles.experienceRadioUnselected]}>
                  {selected ? <MaterialCommunityIcons name="check" size={19} color={colors.surface} /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {step === 3 ? (
        <View style={styles.reviewCard}>
          <View style={styles.reviewItem}>
            <View style={styles.reviewIcon}><MaterialCommunityIcons name="crosshairs" size={25} color={colors.ink} /></View>
            <View style={styles.reviewCopy}><Typography variant="caption" color={colors.textSecondary} style={styles.reviewLabel}>YOUR GOAL</Typography><Typography variant="bodyMedium" style={styles.reviewValue}>{goal.trim()}</Typography></View>
            <Pressable accessibilityRole="button" accessibilityLabel="Edit goal" onPress={() => setStep(0)} style={styles.reviewEdit}><Typography variant="bodyStrong" color={colors.primaryDark}>Edit</Typography></Pressable>
          </View>
          <View style={styles.reviewDivider} />
          <View style={styles.reviewItem}>
            <View style={styles.reviewIcon}><MaterialCommunityIcons name="chart-bar" size={25} color={colors.ink} /></View>
            <View style={styles.reviewCopy}><Typography variant="caption" color={colors.textSecondary} style={styles.reviewLabel}>EXPERIENCE</Typography><Typography variant="bodyMedium" style={styles.reviewValue}>{experienceChoices.find((item) => item.value === experience)?.title}</Typography></View>
            <Pressable accessibilityRole="button" accessibilityLabel="Edit experience" onPress={() => setStep(1)} style={styles.reviewEdit}><Typography variant="bodyStrong" color={colors.primaryDark}>Edit</Typography></Pressable>
          </View>
          <View style={styles.reviewDivider} />
          <View style={styles.reviewItem}>
            <View style={styles.reviewIcon}><MaterialCommunityIcons name="calendar-clock-outline" size={25} color={colors.ink} /></View>
            <View style={styles.reviewCopy}><Typography variant="caption" color={colors.textSecondary} style={styles.reviewLabel}>WEEKLY STUDY TIME</Typography><Typography variant="bodyMedium" style={styles.reviewValue}>{studyChoices.find((item) => item.value === weeklyHours)?.label}</Typography></View>
            <Pressable accessibilityRole="button" accessibilityLabel="Edit weekly study time" onPress={() => setStep(2)} style={styles.reviewEdit}><Typography variant="bodyStrong" color={colors.primaryDark}>Edit</Typography></Pressable>
          </View>
        </View>
      ) : null}

      {error ? (
        <View accessibilityRole="alert" style={styles.errorBox}>
          <MaterialCommunityIcons name="alert-circle-outline" size={20} color={colors.error} />
          <Typography variant="caption" color={colors.error} style={styles.errorCopy}>{error}</Typography>
        </View>
      ) : null}

      <View style={[styles.footer, step === 0 && styles.goalFooter, (step === 1 || step === 2) && styles.experienceFooter, step === 3 && styles.reviewFooter]}>
        {step === 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Continue"
            accessibilityState={{ disabled: !canContinue }}
            disabled={!canContinue}
            onPress={() => { setError(null); setStep(step + 1); }}
            style={({ pressed }) => [styles.goalContinue, (!canContinue || pressed) && styles.goalContinuePressed]}
          >
            <Typography variant="bodyStrong">Continue</Typography>
          </Pressable>
        ) : step === 1 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Continue"
            accessibilityState={{ disabled: !canContinue }}
            disabled={!canContinue}
            onPress={() => { setError(null); setStep(step + 1); }}
            style={({ pressed }) => [styles.experienceContinue, (!canContinue || pressed) && styles.goalContinuePressed]}
          >
            <Typography variant="bodyStrong">Continue</Typography>
          </Pressable>
        ) : step === 2 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Continue"
            accessibilityState={{ disabled: !canContinue }}
            disabled={!canContinue}
            onPress={() => { setError(null); setStep(step + 1); }}
            style={({ pressed }) => [styles.experienceContinue, (!canContinue || pressed) && styles.goalContinuePressed]}
          >
            <Typography variant="bodyStrong">Continue</Typography>
          </Pressable>
        ) : step < 3 ? (
          <Button label="Continue" disabled={!canContinue} onPress={() => { setError(null); setStep(step + 1); }} />
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Create my learning path"
            accessibilityState={{ busy: loading, disabled: loading }}
            disabled={loading}
            onPress={() => void createPath()}
            style={({ pressed }) => [styles.createPathButton, pressed && !loading && styles.goalContinuePressed]}
          >
            {loading ? <ActivityIndicator color={colors.surface} /> : <>
              <MaterialCommunityIcons name="creation" size={22} color={colors.surface} />
              <Typography variant="bodyStrong" color={colors.surface}>Create my learning path</Typography>
            </>}
          </Pressable>
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
  goalScreenContent: { paddingTop: spacing.xl, paddingBottom: spacing.lg },
  experienceScreenContent: { paddingTop: spacing.xl, paddingBottom: spacing.lg },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.md },
  goalTopRow: { minHeight: 56, marginBottom: spacing.md },
  experienceTopRow: { minHeight: 56, marginBottom: spacing.md },
  goalBackButton: { width: 56, height: 56, alignItems: "center", justifyContent: "center", borderRadius: radii.full, backgroundColor: colors.surfaceSubtle },
  topSpacer: { width: layout.iconButtonSize },
  headingBlock: { marginTop: spacing.xl, gap: spacing.sm },
  goalHeadingBlock: { marginTop: spacing.xlPlus, gap: spacing.sm },
  experienceHeadingBlock: { marginTop: spacing.xlPlus, gap: spacing.sm },
  goalEyebrow: { letterSpacing: 1.1 },
  heading: { marginTop: spacing.xs },
  goalHeading: { marginTop: 0, fontSize: 42, lineHeight: 48, letterSpacing: -0.8 },
  experienceHeading: { marginTop: 0, fontSize: 42, lineHeight: 48, letterSpacing: -0.8 },
  experienceDescription: { fontSize: 17, lineHeight: 25 },
  stepBody: { marginTop: spacing.xl },
  goalStepBody: { marginTop: spacing.xlPlus },
  goalInputWrap: { minHeight: 62, flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.mdPlus, borderWidth: 2, borderColor: colors.primaryDark, borderRadius: radii.full, backgroundColor: colors.surfaceSubtle },
  goalInput: { flex: 1, minHeight: 54, padding: 0, color: colors.text, fontFamily: "Outfit_600SemiBold", fontSize: 17, lineHeight: 23 },
  clearGoalButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  goalHint: { marginTop: spacing.sm, marginLeft: spacing.mdPlus },
  suggestionLabel: { marginTop: spacing.xlPlus, marginBottom: spacing.smPlus, letterSpacing: 0.7 },
  suggestionList: { flexDirection: "row", flexWrap: "wrap", columnGap: spacing.smPlus, rowGap: spacing.smPlus },
  suggestion: { minHeight: 42, flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radii.full, backgroundColor: colors.surface },
  suggestionSelected: { backgroundColor: colors.primarySoft, borderColor: colors.primaryDark },
  choiceList: { gap: spacing.md, marginTop: spacing.xl },
  experienceCard: { minHeight: 108, flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.mdPlus, borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.xl, backgroundColor: colors.surface },
  experienceChoiceList: { gap: spacing.md, marginTop: spacing.xlPlus },
  experienceSelected: { borderColor: colors.primaryDark, backgroundColor: colors.primarySoft },
  experienceChoiceIcon: { width: 48, height: 48, borderRadius: radii.lg, backgroundColor: colors.surfaceSubtle },
  experienceChoiceIconSelected: { backgroundColor: colors.primary },
  experienceTitle: { fontSize: 18, lineHeight: 24 },
  experienceRadio: { width: 32, height: 32, alignItems: "center", justifyContent: "center", borderRadius: radii.full },
  experienceRadioSelected: { backgroundColor: colors.primaryDark },
  experienceRadioUnselected: { borderWidth: 2, borderColor: "#A4A9B7" },
  choiceSelected: { borderColor: colors.primary, backgroundColor: colors.primaryTint },
  choiceIcon: { width: 44, height: 44, borderRadius: radii.md, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  choiceIconSelected: { backgroundColor: colors.primarySoft },
  choiceCopy: { flex: 1, gap: 4 },
  studyList: { gap: spacing.sm, marginTop: spacing.xl },
  studyTimeList: { gap: spacing.md, marginTop: spacing.xlPlus },
  studyChoice: { minHeight: 60, flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, backgroundColor: colors.surface },
  studyIcon: { width: 34, alignItems: "center" },
  studyTimeChoice: { minHeight: 94, flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.mdPlus, borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.xl, backgroundColor: colors.surface },
  studyTimeSelected: { borderColor: colors.primaryDark, backgroundColor: colors.primarySoft },
  studyTimeIcon: { width: 48, height: 48, justifyContent: "center", borderRadius: radii.lg, backgroundColor: colors.surfaceSubtle },
  studyTimeIconSelected: { backgroundColor: colors.primary },
  studyText: { flex: 1, fontSize: 18, lineHeight: 24 },
  perWeek: { fontSize: 15, lineHeight: 21 },
  reviewCard: { marginTop: spacing.xlPlus, paddingHorizontal: spacing.mdPlus, paddingVertical: spacing.sm, borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.xl, backgroundColor: colors.surface },
  reviewItem: { minHeight: 78, flexDirection: "row", alignItems: "center", gap: spacing.md },
  reviewIcon: { width: 48, height: 48, borderRadius: radii.lg, alignItems: "center", justifyContent: "center", backgroundColor: colors.primary },
  reviewCopy: { flex: 1, gap: 3 },
  reviewLabel: { letterSpacing: 0.8 },
  reviewValue: { fontSize: 20, lineHeight: 26 },
  reviewEdit: { minWidth: 76, minHeight: 48, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.md, borderRadius: radii.full, backgroundColor: colors.primarySoft },
  reviewDivider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  errorBox: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start", padding: spacing.md, marginTop: spacing.lg, borderRadius: radii.md, backgroundColor: colors.errorSoft },
  errorCopy: { flex: 1 },
  footer: { marginTop: spacing.xl, gap: spacing.sm },
  goalFooter: { marginTop: "auto", gap: spacing.md },
  experienceFooter: { marginTop: "auto", gap: spacing.md },
  reviewFooter: { marginTop: "auto", gap: spacing.md },
  goalContinue: { minHeight: 62, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.xl, borderRadius: radii.full, backgroundColor: colors.primary },
  experienceContinue: { minHeight: 62, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.xl, borderRadius: radii.full, backgroundColor: colors.primary },
  createPathButton: { minHeight: 62, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.smPlus, paddingHorizontal: spacing.xl, borderRadius: radii.full, backgroundColor: colors.ink },
  goalContinuePressed: { opacity: 0.55 },
  footerHint: { textAlign: "center" },
});
