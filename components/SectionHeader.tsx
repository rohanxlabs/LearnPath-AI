import { StyleSheet, View } from "react-native";

import { colors, spacing } from "../theme/tokens";
import { TextLink } from "./TextLink";
import { Typography } from "./Typography";

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function SectionHeader({
  title,
  subtitle,
  actionLabel,
  onAction,
}: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        <Typography variant="sectionTitle">{title}</Typography>
        {subtitle ? (
          <Typography variant="metadata" color={colors.textSecondary}>
            {subtitle}
          </Typography>
        ) : null}
      </View>
      {actionLabel ? (
        <TextLink
          label={actionLabel}
          onPress={onAction}
        />
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
  copy: { flex: 1, gap: spacing.xs },
});
