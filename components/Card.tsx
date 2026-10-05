import { PropsWithChildren } from "react";
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from "react-native";

import { colors, elevation, radii, spacing } from "../theme/tokens";

type CardVariant =
  | "default"
  | "elevated"
  | "outlined"
  | "subtle"
  | "selected"
  | "interactive";

type CardProps = PropsWithChildren<{
  onPress?: () => void;
  selected?: boolean;
  accessibilityLabel?: string;
  variant?: CardVariant;
  style?: StyleProp<ViewStyle>;
}>;

export function Card({
  children,
  onPress,
  selected = false,
  accessibilityLabel,
  variant = "default",
  style,
}: CardProps) {
  const content = (
    <View style={[styles.base, styles[variant], selected && styles.selected, style]}>
      {children}
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        pressed && styles.pressed,
        selected && styles.selectedPressable,
      ]}
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
  },
  default: { ...elevation.subtle },
  elevated: { ...elevation.card },
  outlined: { borderWidth: 1, borderColor: colors.border, ...elevation.none },
  subtle: { backgroundColor: colors.surfaceSubtle, ...elevation.none },
  selected: {
    backgroundColor: colors.surfaceSelected,
    borderWidth: 1,
    borderColor: colors.borderSelected,
    ...elevation.none,
  },
  interactive: { borderWidth: 1, borderColor: colors.border, ...elevation.none },
  selectedPressable: {},
  pressed: { opacity: 0.85 },
});
