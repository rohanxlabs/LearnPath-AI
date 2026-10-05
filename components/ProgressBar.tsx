import { StyleSheet, View } from "react-native";

import { colors, layout, radii } from "../theme/tokens";

type ProgressBarProps = {
  value: number;
  label?: string;
  tone?: "brand" | "success" | "warning";
  thick?: boolean;
};

export function ProgressBar({
  value,
  label,
  tone = "brand",
  thick = false,
}: ProgressBarProps) {
  const clampedValue = Math.min(1, Math.max(0, value));
  return (
    <View
      accessibilityLabel={
        label ?? `Progress ${Math.round(clampedValue * 100)} percent`
      }
      accessibilityRole="progressbar"
      accessibilityValue={{ max: 1, min: 0, now: clampedValue }}
      style={[styles.track, thick && styles.thickTrack]}
    >
      <View
        style={[styles.fill, styles[tone], { width: `${clampedValue * 100}%` }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: layout.progressHeight,
    overflow: "hidden",
    borderRadius: radii.full,
    backgroundColor: colors.border,
  },
  thickTrack: { height: 14 },
  fill: {
    height: "100%",
    borderRadius: radii.full,
  },
  brand: { backgroundColor: colors.primary },
  success: { backgroundColor: colors.success },
  warning: { backgroundColor: colors.warning },
});
