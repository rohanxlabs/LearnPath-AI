import { StyleSheet, TextInput, TextInputProps, View } from "react-native";

import { colors, layout, radii, spacing } from "../theme/tokens";
import { Typography } from "./Typography";

type InputProps = TextInputProps & { label: string; error?: string };

export function Input({ label, error, ...props }: InputProps) {
  const inputId = props.accessibilityLabel ?? label;
  return (
    <View style={styles.wrapper}>
      <Typography variant="label" style={styles.label}>
        {label}
      </Typography>
      <TextInput
        {...props}
        accessibilityLabel={inputId}
        accessibilityState={{ disabled: props.editable === false }}
        style={[styles.input, error && styles.errorInput, props.style]}
        placeholderTextColor={colors.textMuted}
      />
      {error ? (
        <Typography color={colors.error} variant="caption">
          {error}
        </Typography>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.sm },
  label: { color: colors.textSecondary },
  input: {
    minHeight: layout.inputHeight,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radii.md,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  errorInput: { borderColor: colors.error },
});
