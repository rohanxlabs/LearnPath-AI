import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";

import { colors, layout, radii, spacing, typography } from "../theme/tokens";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "tertiary"
  | "ghost"
  | "quiet"
  | "destructive"
  | "dark";
type ButtonSize = "small" | "medium" | "large";

type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  accessibilityHint?: string;
};

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "medium",
  disabled = false,
  loading = false,
  accessibilityHint,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  
  const getStyles = (pressed: boolean) => {
    const baseStyles: any[] = [
      styles.base,
      styles[size],
      styles[variant],
    ];
    
    if (pressed && !isDisabled) {
      const pressedKey = `${variant}Pressed` as keyof typeof styles;
      if (styles[pressedKey]) {
        baseStyles.push(styles[pressedKey]);
      }
    }
    
    if (isDisabled) {
      baseStyles.push(styles.disabled);
    }
    
    return baseStyles;
  };
  
  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ busy: loading, disabled: isDisabled }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => getStyles(pressed)}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === "primary"
              ? colors.onAccent
              : variant === "dark"
                ? colors.surface
                : variant === "secondary"
                  ? colors.ink
                  : colors.primary
          }
        />
      ) : (
        <Text
          style={[
            styles.label,
            variant === "primary"
              ? styles.primaryLabel
              : variant === "dark"
                ? styles.darkLabel
                : variant === "secondary"
                  ? styles.secondaryLabel
                  : variant === "destructive"
                    ? styles.destructiveLabel
                    : styles.defaultLabel,
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: layout.buttonHeightMedium,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
  },
  small: { minHeight: layout.buttonHeightSmall, paddingHorizontal: spacing.md },
  medium: { minHeight: layout.buttonHeightMedium },
  large: { minHeight: layout.buttonHeightLarge, paddingHorizontal: spacing.xl },
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.surfaceSubtle },
  dark: { backgroundColor: colors.ink },
  outline: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  ghost: { backgroundColor: "transparent" },
  quiet: { backgroundColor: "transparent" },
  tertiary: { backgroundColor: "transparent" },
  destructive: { backgroundColor: colors.errorSoft },
  label: { ...typography.button },
  primaryLabel: { color: colors.onAccent },
  secondaryLabel: { color: colors.ink },
  darkLabel: { color: colors.surface },
  defaultLabel: { color: colors.primaryDark },
  destructiveLabel: { color: colors.error },
  primaryPressed: { backgroundColor: colors.primaryPressed, opacity: 1 },
  secondaryPressed: { backgroundColor: "#E4E6ED", opacity: 1 },
  darkPressed: { backgroundColor: "#000000", opacity: 1 },
  outlinePressed: { opacity: 0.82 },
  ghostPressed: { opacity: 0.82 },
  quietPressed: { opacity: 0.82 },
  tertiaryPressed: { opacity: 0.82 },
  destructivePressed: { opacity: 0.82 },
  disabled: { opacity: 0.45 },
});
