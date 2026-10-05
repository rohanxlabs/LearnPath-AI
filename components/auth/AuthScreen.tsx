import { PropsWithChildren } from "react";
import { Image, StyleSheet, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { Screen, Typography } from "../index";
import { colors, radii, spacing, welcomeColors } from "../../theme/tokens";

export function AuthScreen({ title, subtitle, children, welcome = false }: PropsWithChildren<{ title: string; subtitle: string; welcome?: boolean }>) {
  return (
    <Screen scroll keyboardAvoiding contentContainerStyle={welcome ? styles.welcomeContent : styles.content}>
      <View style={[styles.brand, welcome && styles.welcomeBrand]}>
        <View style={[styles.mark, welcome && styles.welcomeMark]}>
          {welcome ? <MaterialCommunityIcons name="source-branch" size={28} color={welcomeColors.nearBlack} /> : <Typography variant="title" color={colors.primaryDark}>L</Typography>}
        </View>
        <Typography variant={welcome ? "title" : "bodyMedium"} style={welcome && styles.brandName}>LearnPath AI</Typography>
      </View>
      {welcome ? <Image source={require("../../assets/images/auth/learning-journey.jpg")} accessibilityLabel="A learner following a path toward a goal" style={styles.hero} resizeMode="cover" /> : null}
      <View style={[styles.heading, welcome && styles.welcomeHeading]}>
        <Typography variant={welcome ? "display" : "heading"} style={welcome && styles.welcomeTitle}>{title}</Typography>
        <Typography color={colors.textSecondary} style={welcome && styles.welcomeSubtitle}>{subtitle}</Typography>
      </View>
      <View style={[styles.form, welcome && styles.welcomeForm]}>{children}</View>
      {!welcome ? <Typography variant="caption" color={colors.textMuted} style={styles.footnote}>
        Your learning path and progress stay connected to your account.
      </Typography> : null}
    </Screen>
  );
}

export function AuthError({ message }: { message: string }) {
  return (
    <View accessibilityRole="alert" style={styles.errorBox}>
      <Typography color={colors.error}>{message}</Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { justifyContent: "center", paddingVertical: spacing.xxl },
  welcomeContent: { justifyContent: "flex-start", paddingTop: spacing.xl, paddingBottom: spacing.xl, gap: 0 },
  brand: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  welcomeBrand: { justifyContent: "center", marginBottom: spacing.lg },
  brandName: { fontSize: 22, lineHeight: 28, letterSpacing: -0.4 },
  mark: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primarySoft,
  },
  welcomeMark: { width: 48, height: 48, borderRadius: 24, backgroundColor: welcomeColors.periwinkle },
  hero: { width: "100%", aspectRatio: 1.25, borderRadius: 28, marginBottom: spacing.lg, backgroundColor: welcomeColors.periwinkle },
  heading: { gap: spacing.sm, marginTop: spacing.xxl, marginBottom: spacing.lg },
  welcomeHeading: { alignItems: "center", marginTop: 0, marginBottom: spacing.lg, gap: spacing.sm },
  welcomeTitle: { textAlign: "center", fontSize: 34, lineHeight: 38, letterSpacing: -0.8 },
  welcomeSubtitle: { textAlign: "center", fontSize: 16, lineHeight: 23 },
  form: { gap: spacing.md },
  welcomeForm: { gap: spacing.md },
  footnote: { textAlign: "center", marginTop: spacing.xxl },
  errorBox: {
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.errorSoft,
    backgroundColor: colors.errorSoft,
  },
});
