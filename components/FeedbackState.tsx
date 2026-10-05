import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { colors, layout, spacing } from "../theme/tokens";
import { Button } from "./Button";
import { Typography } from "./Typography";

type FeedbackKind = "loading" | "empty" | "error" | "offline";
const content: Record<
  FeedbackKind,
  {
    icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
    color: string;
    title: string;
  }
> = {
  loading: { icon: "progress-clock", color: colors.primaryDark, title: "Loading" },
  empty: {
    icon: "bookshelf",
    color: colors.textSecondary,
    title: "Nothing here yet",
  },
  error: {
    icon: "alert-circle-outline",
    color: colors.error,
    title: "Something went wrong",
  },
  offline: {
    icon: "cloud-off-outline",
    color: colors.warning,
    title: "Youâ€™re offline",
  },
};

export function FeedbackState({
  kind,
  message,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  title,
  icon,
}: {
  kind: FeedbackKind;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  title?: string;
  icon?: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
}) {
  const state = content[kind];
  return (
    <View
      accessibilityRole={kind === "error" ? "alert" : undefined}
      style={styles.container}
    >
      {kind === "loading" ? (
        <ActivityIndicator color={state.color} size="small" />
      ) : (
        <MaterialCommunityIcons
          name={icon ?? state.icon}
          size={layout.iconLarge}
          color={state.color}
        />
      )}
      <Typography variant="cardTitle" style={styles.title}>
        {title ?? state.title}
      </Typography>
      <Typography
        variant="bodySmall"
        color={colors.textSecondary}
        style={styles.message}
      >
        {message}
      </Typography>
      {actionLabel && onAction ? (
        <Button
          label={actionLabel}
          variant="secondary"
          size="small"
          onPress={onAction}
        />
      ) : null}
      {secondaryActionLabel && onSecondaryAction ? (
        <Button
          label={secondaryActionLabel}
          variant="tertiary"
          size="small"
          onPress={onSecondaryAction}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", gap: spacing.sm, padding: spacing.lg },
  title: { textAlign: "center" },
  message: { maxWidth: 320, textAlign: "center" },
});
