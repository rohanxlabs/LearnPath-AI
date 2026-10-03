import { StyleSheet, Text, View } from "react-native";

import { colors, radii, spacing, typography } from "../theme/tokens";

type BadgeTone = "neutral" | "success" | "warning" | "error";
type BadgeProps = { label: string; tone?: BadgeTone };

export function Badge({ label, tone = "neutral" }: BadgeProps) {
  return (
    <View
      accessibilityLabel={label}
      accessibilityRole="text"
      style={[styles.base, styles[tone]]}
    >
      <Text
        style={[
          styles.label,
          tone === "neutral" ? styles.neutralLabel : styles.coloredLabel,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
  },
  neutral: { backgroundColor: colors.border },
  success: { backgroundColor: colors.successSoft },
  warning: { backgroundColor: colors.warningSoft },
  error: { backgroundColor: colors.errorSoft },
  label: { ...typography.label },
  neutralLabel: { color: colors.textSecondary },
  coloredLabel: { color: colors.text },
});
