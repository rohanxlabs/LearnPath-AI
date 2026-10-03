import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

import { layout, learningColors, radii, spacing } from "../theme/tokens";
import { Typography } from "./Typography";

export type LearningStatus = keyof typeof learningColors;

const statusContent: Record<
  LearningStatus,
  {
    label: string;
    icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  }
> = {
  notStarted: { label: "Not started", icon: "circle-outline" },
  inProgress: { label: "In progress", icon: "progress-clock" },
  completed: { label: "Completed", icon: "check-circle-outline" },
  mastered: { label: "Mastered", icon: "school-outline" },
  recommended: { label: "Recommended", icon: "star-outline" },
  locked: { label: "Locked", icon: "lock-outline" },
  current: { label: "Current", icon: "record-circle-outline" },
  needsReview: { label: "Needs review", icon: "reload" },
};

export function LearningState({
  status,
  supportingText,
}: {
  status: LearningStatus;
  supportingText?: string;
}) {
  const content = statusContent[status];
  const tone = learningColors[status];
  return (
    <View
      accessibilityLabel={`${content.label}${supportingText ? `: ${supportingText}` : ""}`}
      style={[styles.row, { backgroundColor: tone.background }]}
    >
      <MaterialCommunityIcons
        name={content.icon}
        size={layout.iconMedium}
        color={tone.foreground}
      />
      <View style={styles.copy}>
        <Typography variant="bodyMedium" color={tone.foreground}>
          {content.label}
        </Typography>
        {supportingText ? (
          <Typography variant="bodySmall" color={tone.foreground}>
            {supportingText}
          </Typography>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
  },
  copy: { flex: 1 },
});
