import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet } from "react-native";

import { colors, layout, radii } from "../theme/tokens";

type IconButtonProps = {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  label: string;
  onPress?: () => void;
  selected?: boolean;
  disabled?: boolean;
};

export function IconButton({
  icon,
  label,
  onPress,
  selected = false,
  disabled = false,
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
        selected && styles.selected,
        pressed && styles.pressed,
      ]}
    >
      <MaterialCommunityIcons
        name={icon}
        size={22}
        color={selected ? colors.primary : colors.textSecondary}
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
  selected: { backgroundColor: colors.primarySoft },
  pressed: { opacity: 0.7 },
});
