import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { StyleSheet, View } from "react-native";

import { Button, Card, ProgressBar, Screen, Typography } from "../../components";
import { colors, radii, spacing } from "../../theme/tokens";

export default function PathReadyScreen() {
  const router = useRouter();
  const { title, phaseCount } = useLocalSearchParams<{ title?: string; phaseCount?: string }>();
  const count = Number(phaseCount) || 0;

  return (
    <Screen scroll contentContainerStyle={styles.screenContent}>
      <View style={styles.hero}>
        <View style={styles.successMark}><MaterialCommunityIcons name="check" size={30} color={colors.surface} /></View>
        <Typography variant="label" color={colors.primaryDark}>YOUR PATH IS READY</Typography>
        <Typography variant="heading" style={styles.title}>{title || "Your learning path"}</Typography>
        <Typography color={colors.textSecondary} style={styles.body}>A clear next step, shaped around what you want to learn.</Typography>
      </View>
      <Card>
        <View style={styles.cardHeading}>
          <View style={styles.cardIcon}><MaterialCommunityIcons name="map-marker-path" size={21} color={colors.primaryDark} /></View>
          <View style={styles.cardTitleWrap}><Typography variant="bodyMedium">Your learning roadmap</Typography><Typography variant="caption" color={colors.textSecondary}>{count ? `${count} ${count === 1 ? "phase" : "phases"} to explore` : "Ready for your first lesson"}</Typography></View>
        </View>
        <ProgressBar value={0} label="Path progress, just getting started" />
        <Typography variant="caption" color={colors.textMuted} style={styles.progressNote}>Progress begins when you complete your first lesson.</Typography>
      </Card>
      <Card>
        <View style={styles.nextStep}>
          <MaterialCommunityIcons name="lightbulb-on-outline" size={21} color={colors.primaryDark} />
          <View style={styles.nextCopy}><Typography variant="label" color={colors.primaryDark}>YOUR FIRST STEP</Typography><Typography variant="bodyMedium" style={styles.nextTitle}>Open your path and choose where to begin.</Typography></View>
        </View>
      </Card>
      <View style={styles.footer}>
        <Button label="View my paths" onPress={() => router.replace("/(tabs)/paths" as Href)} />
        <Button label="Go to Home" variant="quiet" onPress={() => router.replace("/(tabs)/home" as Href)} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenContent: { justifyContent: "center", paddingBottom: spacing.xl },
  hero: { alignItems: "center", gap: spacing.sm, marginBottom: spacing.xl },
  successMark: { width: 64, height: 64, alignItems: "center", justifyContent: "center", borderRadius: radii.full, backgroundColor: colors.success, marginBottom: spacing.sm },
  title: { textAlign: "center", marginTop: spacing.xs },
  body: { textAlign: "center", maxWidth: 320 },
  cardHeading: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.lg },
  cardIcon: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: radii.md, backgroundColor: colors.primarySoft },
  cardTitleWrap: { flex: 1, gap: 3 },
  progressNote: { marginTop: spacing.sm },
  nextStep: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  nextCopy: { flex: 1, gap: spacing.xs },
  nextTitle: { lineHeight: 23 },
  footer: { gap: spacing.xs, marginTop: spacing.lg },
});
