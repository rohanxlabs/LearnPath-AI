import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, ViewStyle } from "react-native";

import { colors, layout, spacing } from "../theme/tokens";
import { Typography } from "./Typography";

type TextLinkProps = {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  icon?: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  underline?: boolean;
  align?: "left" | "center" | "right";
  style?: ViewStyle;
};

export function TextLink({
  label,
  onPress,
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
  icon,
  underline = false,
  align = "left",
  style,
}: TextLinkProps) {
  const isInteractive = Boolean(onPress) && !disabled;
  const isDisabled = disabled || !onPress;
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled }}
      disabled={!isInteractive}
      hitSlop={4}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          justifyContent:
            align === "left"
              ? "flex-start"
              : align === "right"
                ? "flex-end"
                : "center",
        },
        pressed && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {icon ? (
        <MaterialCommunityIcons
          name={icon}
          size={16}
          color={colors.textLink}
        />
      ) : null}
      <Typography
        variant="textLink"
        color={colors.textLink}
        style={underline && styles.underline}
      >
        {label}
      </Typography>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: layout.minimumTouchTarget,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.45 },
  underline: { textDecorationLine: "underline" },
});
