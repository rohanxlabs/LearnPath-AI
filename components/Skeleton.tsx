import { StyleSheet, View } from "react-native";

import { colors, radii } from "../theme/tokens";

type SkeletonProps = {
  width: number | `${number}%`;
  height: number;
  label?: string;
};

export function Skeleton({ width, height, label = "Loading" }: SkeletonProps) {
  return (
    <View
      accessibilityLabel={label}
      accessibilityRole="progressbar"
      style={[styles.base, { width, height }]}
    />
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radii.sm, backgroundColor: colors.border },
});
