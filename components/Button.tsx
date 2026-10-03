import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";

import { colors, layout, radii, spacing, typography } from "../theme/tokens";

type ButtonVariant = "primary" | "secondary" | "quiet" | "destructive";

type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  accessibilityHint?: string;
};

export function Button({
  label,
  onPress,
  variant = "primary",
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
        styles[variant],
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? colors.surface : colors.primary}
        />
      ) : (
        <Text
          style={[
            styles.label,
            variant === "primary" ? styles.primaryLabel : styles.secondaryLabel,
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
    minHeight: layout.androidTouchTarget,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
  },
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.primarySoft },
  quiet: { backgroundColor: "transparent" },
  destructive: { backgroundColor: colors.errorSoft },
  label: { ...typography.bodyMedium },
  primaryLabel: { color: colors.surface },
  secondaryLabel: { color: colors.primaryDark },
  pressed: { opacity: 0.82 },
  disabled: { opacity: 0.45 },
});
