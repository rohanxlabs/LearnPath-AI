import { StyleSheet, Text, View } from "react-native";

import {
  colors,
  learningColors,
  radii,
  spacing,
  typography,
} from "../theme/tokens";

type BadgeTone =
  | "neutral"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "inProgress"
  | "recommended"
  | "locked"
  | "needsReview"
  | "mastered";
type BadgeProps = { label: string; tone?: BadgeTone };

const toneTextColor: Record<BadgeTone, string> = {
  neutral: colors.textSecondary,
  success: colors.success,
  warning: colors.warning,
  error: colors.error,
  info: colors.info,
  inProgress: learningColors.inProgress.foreground,
  recommended: learningColors.recommended.foreground,
  locked: learningColors.locked.foreground,
  needsReview: learningColors.needsReview.foreground,
  mastered: learningColors.mastered.foreground,
};

export function Badge({ label, tone = "neutral" }: BadgeProps) {
  return (
    <View
      accessibilityLabel={label}
      accessibilityRole="text"
      style={[styles.base, styles[tone]]}
    >
      <Text style={[styles.label, { color: toneTextColor[tone] }]}>
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
  info: { backgroundColor: colors.infoSoft },
  inProgress: { backgroundColor: learningColors.inProgress.background },
  recommended: { backgroundColor: learningColors.recommended.background },
  locked: { backgroundColor: learningColors.locked.background },
  needsReview: { backgroundColor: learningColors.needsReview.background },
  mastered: { backgroundColor: learningColors.mastered.background },
  label: { ...typography.label },
});
