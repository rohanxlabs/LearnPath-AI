import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";

import { colors, layout, radii, spacing, typography } from "../theme/tokens";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "tertiary"
  | "ghost"
  | "quiet"
  | "destructive";
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
  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ busy: loading, disabled: isDisabled }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[size],
        styles[variant],
        pressed &&
          !isDisabled &&
          (variant === "primary" ? styles.primaryPressed : styles.pressed),
        isDisabled && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === "primary" ? colors.surface : colors.primary
          }
        />
      ) : (
        <Text
          style={[
            styles.label,
            variant === "primary"
              ? styles.primaryLabel
              : variant === "destructive"
                ? styles.destructiveLabel
                : styles.secondaryLabel,
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
    borderRadius: radii.md,
  },
  small: { minHeight: layout.buttonHeightSmall, paddingHorizontal: spacing.md },
  medium: { minHeight: layout.buttonHeightMedium },
  large: { minHeight: layout.buttonHeightLarge, paddingHorizontal: spacing.xl },
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.primarySoft },
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
  primaryLabel: { color: colors.surface },
  secondaryLabel: { color: colors.primaryDark },
  destructiveLabel: { color: colors.error },
  primaryPressed: { backgroundColor: colors.primaryPressed, opacity: 1 },
  pressed: { opacity: 0.82 },
  disabled: { opacity: 0.45 },
});
