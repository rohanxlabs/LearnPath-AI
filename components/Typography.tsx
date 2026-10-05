import { Text as NativeText, TextProps, StyleSheet } from "react-native";

import { colors, typography } from "../theme/tokens";

export type TextVariant = keyof typeof typography;

type TypographyProps = TextProps & {
  variant?: TextVariant;
  color?: string;
};

const fontFamilyMap: Record<string, string> = {
  "400": "Outfit_400Regular",
  "600": "Outfit_600SemiBold",
  "700": "Outfit_700Bold",
};

export function Typography({
  variant = "body",
  color = colors.text,
  style,
  ...props
}: TypographyProps) {
  const variantStyle = typography[variant];
  const fontFamily = fontFamilyMap[String(variantStyle.fontWeight)] || "Outfit_400Regular";
  
  const textStyle: any = {
    fontSize: variantStyle.fontSize,
    lineHeight: variantStyle.lineHeight,
    fontFamily,
    color,
  };
  
  if ("letterSpacing" in variantStyle) {
    textStyle.letterSpacing = variantStyle.letterSpacing;
  }
  
  if ("fontVariant" in variantStyle) {
    textStyle.fontVariant = [...variantStyle.fontVariant];
  }
  
  return (
    <NativeText
      allowFontScaling
      {...props}
      style={[styles.base, textStyle, style]}
    />
  );
}

export const Text = Typography;

const styles = StyleSheet.create({ base: {} });
