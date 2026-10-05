import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  type ImageSourcePropType,
} from "react-native";

import { layout, radii, spacing, typography } from "../theme/tokens";

type SocialButtonProps = {
  label: string;
  onPress?: () => void;
  icon?: ImageSourcePropType;
  disabled?: boolean;
  loading?: boolean;
  backgroundColor?: string;
  textColor?: string;
  accessibilityHint?: string;
};

export function SocialButton({
  label,
  onPress,
  icon,
  disabled = false,
  loading = false,
  backgroundColor = "#0E0E12",
  textColor = "#FFFFFF",
  accessibilityHint,
}: SocialButtonProps) {
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
        { backgroundColor },
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <>
          {icon ? <Image source={icon} style={styles.icon} /> : null}
          <Text style={[styles.label, { color: textColor }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minHeight: layout.buttonHeightLarge,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.full,
    gap: spacing.sm,
  },
  label: { ...typography.button },
  icon: {
    width: 20,
    height: 20,
    resizeMode: "contain",
  },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.45 },
});
