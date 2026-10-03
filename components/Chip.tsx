import { Pressable, StyleSheet, Text } from "react-native";

import { colors, layout, radii, spacing, typography } from "../theme/tokens";

type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  disabled?: boolean;
};

export function Chip({
  label,
  selected = false,
  onPress,
  disabled = false,
}: ChipProps) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole={onPress ? "button" : "text"}
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.base,
        selected && styles.selected,
        disabled && styles.disabled,
      ]}
    >
      <Text style={[styles.label, selected && styles.selectedLabel]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: layout.minimumTouchTarget,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
    backgroundColor: colors.primaryTint,
  },
  selected: { backgroundColor: colors.primary },
  disabled: { opacity: 0.45 },
  label: { ...typography.caption, color: colors.primaryDark },
  selectedLabel: { color: colors.surface },
});
