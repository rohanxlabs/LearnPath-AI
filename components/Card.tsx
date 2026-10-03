import { PropsWithChildren } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { colors, elevation, radii, spacing } from "../theme/tokens";

type CardProps = PropsWithChildren<{
  onPress?: () => void;
  selected?: boolean;
  accessibilityLabel?: string;
}>;

export function Card({
  children,
  onPress,
  selected = false,
  accessibilityLabel,
}: CardProps) {
  const content = (
    <View style={[styles.base, selected && styles.selected]}>{children}</View>
  );
  if (!onPress) return content;
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    ...elevation.card,
  },
  selected: { borderWidth: 1, borderColor: colors.primary },
  pressed: { opacity: 0.85 },
});
