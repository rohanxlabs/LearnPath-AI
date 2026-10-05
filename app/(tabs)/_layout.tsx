import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import { StyleSheet, View } from "react-native";

import { useAuth } from "../../hooks/useAuth";
import { colors, spacing, typography } from "../../theme/tokens";

const tabIcons = {
  home: "home-variant-outline",
  paths: "map-marker-path",
  mentor: "message-text-outline",
  progress: "chart-line",
} as const;

export default function TabsLayout() {
  const { status } = useAuth();
  if (status === "loading") return null;
  if (status !== "authenticated") return <Redirect href="/(auth)/welcome" />;

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: typography.navigation,
        tabBarStyle: {
          minHeight: 80,
          paddingTop: spacing.sm,
          paddingBottom: spacing.sm,
          borderTopColor: colors.border,
          backgroundColor: colors.surface,
        },
        tabBarIcon: ({ color, size, focused }) => (
          <View style={[styles.tabIconSlot, focused && styles.tabIconSelected]}>
            <MaterialCommunityIcons
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              name={tabIcons[route.name as keyof typeof tabIcons]}
              size={focused ? 25 : size}
              color={focused ? colors.ink : color}
            />
          </View>
        ),
      })}
    >
      <Tabs.Screen
        name="home"
        options={{ title: "Home", tabBarAccessibilityLabel: "Home tab" }}
      />
      <Tabs.Screen
        name="paths"
        options={{ title: "Paths", tabBarAccessibilityLabel: "Paths tab" }}
      />
      <Tabs.Screen
        name="mentor"
        options={{ title: "Mentor", tabBarAccessibilityLabel: "Mentor tab" }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: "Progress",
          tabBarAccessibilityLabel: "Progress tab",
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIconSlot: {
    width: 54,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
  },
  tabIconSelected: { backgroundColor: colors.primary },
});
