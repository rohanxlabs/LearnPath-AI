import { PropsWithChildren } from "react";
import { Pressable, StyleSheet, View, ViewStyle } from "react-native";

import { colors, elevation, layout, radii, spacing } from "../theme/tokens";

type SelectionCardProps = PropsWithChildren<{
  selected?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: ViewStyle;
}>;

export function SelectionCard({
  children,
  selected = false,
  disabled = false,
  onPress,
  accessibilityLabel,
  style,
}: SelectionCardProps) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        selected && styles.selected,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      <View style={styles.content}>{children}</View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: layout.minimumTouchTarget,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    ...elevation.none,
  },
  content: { flex: 1 },
  selected: {
    borderColor: colors.borderSelected,
    backgroundColor: colors.surfaceSelected,
  },
  disabled: {
    backgroundColor: colors.surfaceDisabled,
    opacity: 0.55,
  },
  pressed: { opacity: 0.82 },
});
