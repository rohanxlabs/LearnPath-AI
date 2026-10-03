import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet } from "react-native";

import { colors, layout, radii } from "../theme/tokens";

type IconButtonProps = {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  label: string;
  onPress?: () => void;
  selected?: boolean;
  disabled?: boolean;
  size?: "small" | "medium" | "large";
};

export function IconButton({
  icon,
  label,
  onPress,
  selected = false,
  disabled = false,
  size = "medium",
}: IconButtonProps) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[size],
        selected && styles.selected,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <MaterialCommunityIcons
        name={icon}
        size={
          size === "small"
            ? layout.iconSmall
            : size === "large"
              ? layout.iconLarge
              : layout.iconButton
        }
        color={
          selected
            ? colors.primary
            : disabled
              ? colors.textDisabled
              : colors.textSecondary
        }
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    width: layout.iconButtonSize,
    height: layout.iconButtonSize,
    borderRadius: radii.full,
  },
  small: { width: 44, height: 44, borderRadius: radii.circle },
  medium: { width: layout.iconButtonSize, height: layout.iconButtonSize },
  large: { width: 56, height: 56, borderRadius: radii.circle },
  selected: { backgroundColor: colors.primarySoft },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.55 },
});
