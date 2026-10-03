import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider } from "../providers/AuthProvider";
import { ActivePathProvider } from "../providers/ActivePathProvider";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ActivePathProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }} />
        </ActivePathProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
