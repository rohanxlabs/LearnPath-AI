import { StyleSheet, View } from "react-native";

import { colors, layout, radii } from "../theme/tokens";

type ProgressBarProps = { value: number; label?: string };

export function ProgressBar({ value, label }: ProgressBarProps) {
  const clampedValue = Math.min(1, Math.max(0, value));
  return (
    <View
      accessibilityLabel={
        label ?? `Progress ${Math.round(clampedValue * 100)} percent`
      }
      accessibilityRole="progressbar"
      accessibilityValue={{ max: 1, min: 0, now: clampedValue }}
      style={styles.track}
    >
      <View style={[styles.fill, { width: `${clampedValue * 100}%` }]} />
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
  fill: {
    height: "100%",
    borderRadius: radii.full,
    backgroundColor: colors.primary,
  },
});
