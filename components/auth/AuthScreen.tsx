import { PropsWithChildren } from "react";
import { StyleSheet, View } from "react-native";

import { Screen, Typography } from "../index";
import { colors, radii, spacing } from "../../theme/tokens";

export function AuthScreen({ title, subtitle, children }: PropsWithChildren<{ title: string; subtitle: string }>) {
  return (
    <Screen scroll keyboardAvoiding contentContainerStyle={styles.content}>
      <View style={styles.brand}>
        <View style={styles.mark}>
          <Typography variant="title" color={colors.primary}>L</Typography>
        </View>
        <Typography variant="bodyMedium">LearnPath</Typography>
      </View>
      <View style={styles.heading}>
        <Typography variant="heading">{title}</Typography>
        <Typography color={colors.textSecondary}>{subtitle}</Typography>
      </View>
      <View style={styles.form}>{children}</View>
      <Typography variant="caption" color={colors.textMuted} style={styles.footnote}>
        Your learning path and progress stay connected to your account.
      </Typography>
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
  brand: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  mark: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primarySoft,
  },
  heading: { gap: spacing.sm, marginTop: spacing.xxl, marginBottom: spacing.lg },
  form: { gap: spacing.md },
  footnote: { textAlign: "center", marginTop: spacing.xxl },
  errorBox: {
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.errorSoft,
    backgroundColor: colors.errorSoft,
  },
});