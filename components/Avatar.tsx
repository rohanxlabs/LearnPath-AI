import { StyleSheet, Text, View } from "react-native";

import { colors, radii, typography } from "../theme/tokens";

type AvatarProps = { initials: string; label: string; size?: number };

export function Avatar({ initials, label, size = 48 }: AvatarProps) {
  return (
    <View
      accessibilityLabel={label}
      accessibilityRole="image"
      style={[
        styles.base,
        { width: size, height: size, borderRadius: radii.circle },
      ]}
    >
      <Text style={styles.initials}>{initials.slice(0, 2).toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primarySoft,
  },
  initials: { ...typography.bodyMedium, color: colors.primaryDark },
});
