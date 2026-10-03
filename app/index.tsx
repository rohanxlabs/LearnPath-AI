import { Redirect, type Href } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { useAuth } from "../hooks/useAuth";
import { colors } from "../theme/tokens";

export default function Index() {
  const { status } = useAuth();
  if (status === "loading") {
    return <View style={styles.loading}><ActivityIndicator color={colors.primary} /></View>;
  }
  const destination: Href = status === "authenticated" ? "/(tabs)/home" : "/(auth)/welcome";
  return <Redirect href={destination} />;
}

const styles = StyleSheet.create({ loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background } });