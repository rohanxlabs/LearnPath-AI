import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

import { Typography } from "./Typography";
import { colors, radii, spacing } from "../theme/tokens";

export function CacheNotice({
  savedAt,
  children,
}: {
  savedAt?: string;
  children?: string;
}) {
  const date = savedAt ? new Date(savedAt) : null;
  const dateLabel =
    date && !Number.isNaN(date.getTime())
      ? `Saved ${date.toLocaleDateString()}`
      : "Saved version";
  return (
    <View accessibilityRole="alert" style={styles.notice}>
      <MaterialCommunityIcons
        name="cloud-off-outline"
        size={18}
        color={colors.warning}
      />
      <Typography
        variant="caption"
        color={colors.textSecondary}
        style={styles.copy}
      >
        {children ?? `${dateLabel}. Some actions need an internet connection.`}
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.warningSoft,
    borderRadius: radii.md,
  },
  copy: { flex: 1 },
});
