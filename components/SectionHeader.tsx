import { StyleSheet, View } from "react-native";

import { colors, spacing } from "../theme/tokens";
import { Typography } from "./Typography";

type SectionHeaderProps = {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function SectionHeader({
  title,
  actionLabel,
  onAction,
}: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <Typography variant="title">{title}</Typography>
      {actionLabel ? (
        <Typography
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          color={colors.primary}
          onPress={onAction}
        >
          {actionLabel}
        </Typography>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
});
