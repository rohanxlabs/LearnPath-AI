import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";

import { useAuth } from "../../hooks/useAuth";
import { colors, layout, typography } from "../../theme/tokens";

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
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: typography.label,
        tabBarStyle: {
          minHeight: layout.androidTouchTarget + 12,
          paddingTop: 8,
          paddingBottom: 8,
          borderTopColor: colors.border,
          backgroundColor: colors.surface,
        },
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            name={tabIcons[route.name as keyof typeof tabIcons]}
            size={size}
            color={color}
          />
        ),
      })}
    >
      <Tabs.Screen name="home" options={{ title: "Home", tabBarAccessibilityLabel: "Home tab" }} />
      <Tabs.Screen name="paths" options={{ title: "Paths", tabBarAccessibilityLabel: "Paths tab" }} />
      <Tabs.Screen name="mentor" options={{ title: "Mentor", tabBarAccessibilityLabel: "Mentor tab" }} />
      <Tabs.Screen name="progress" options={{ title: "Progress", tabBarAccessibilityLabel: "Progress tab" }} />
    </Tabs>
  );
}