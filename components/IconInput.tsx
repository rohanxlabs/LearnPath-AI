import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState, type ReactNode } from "react";
import {
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
} from "react-native";

import { colors, layout, radii, spacing } from "../theme/tokens";

type IconInputProps = Omit<TextInputProps, "style"> & {
  accessibilityLabel: string;
  leftIcon?: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  leftIconColor?: string;
  rightAccessory?: ReactNode;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  placeholderColor?: string;
};

export function IconInput({
  accessibilityLabel,
  leftIcon,
  leftIconColor = colors.primary,
  rightAccessory,
  backgroundColor = colors.surfaceSubtle,
  borderColor = colors.border,
  textColor = colors.text,
  placeholderColor = colors.textMuted,
  ...props
}: IconInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor, borderColor },
        focused && styles.focused,
      ]}
    >
      {leftIcon ? (
        <View style={styles.iconWrapper}>
          <MaterialCommunityIcons
            name={leftIcon}
            size={20}
            color={leftIconColor}
          />
        </View>
      ) : null}
      <TextInput
        {...props}
        accessibilityLabel={accessibilityLabel}
        onFocus={(event) => {
          setFocused(true);
          props.onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          props.onBlur?.(event);
        }}
        style={[styles.input, { color: textColor }]}
        placeholderTextColor={placeholderColor}
      />
      {rightAccessory ? (
        <View style={styles.rightAccessory}>{rightAccessory}</View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: layout.inputHeight,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderRadius: radii.full,
    gap: spacing.sm,
  },
  focused: {
    borderWidth: 2,
  },
  iconWrapper: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    minHeight: layout.inputHeight - spacing.xs,
  },
  rightAccessory: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
});
