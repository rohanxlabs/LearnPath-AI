import { StyleSheet, View } from "react-native";

import { colors } from "../theme/tokens";

export function Divider() {
  return <View accessibilityRole="none" style={styles.divider} />;
}

const styles = StyleSheet.create({
  divider: { height: 1, backgroundColor: colors.border },
});
