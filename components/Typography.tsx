import { Text as NativeText, TextProps, StyleSheet } from "react-native";

import { colors, typography } from "../theme/tokens";

export type TextVariant = keyof typeof typography;

type TypographyProps = TextProps & {
  variant?: TextVariant;
  color?: string;
};

export function Typography({
  variant = "body",
  color = colors.text,
  style,
  ...props
}: TypographyProps) {
  return (
    <NativeText
      allowFontScaling
      {...props}
      style={[styles.base, typography[variant], { color }, style]}
    />
  );
}

export const Text = Typography;

const styles = StyleSheet.create({ base: {} });
