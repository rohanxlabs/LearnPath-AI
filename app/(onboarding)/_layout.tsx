import { Redirect, Stack } from "expo-router";

import { useAuth } from "../../hooks/useAuth";

export default function OnboardingLayout() {
  const { status } = useAuth();
  if (status === "loading") return null;
  if (status !== "authenticated") return <Redirect href="/(auth)/welcome" />;

  return <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }} />;
}
