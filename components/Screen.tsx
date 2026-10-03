import { PropsWithChildren } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, layout } from "../theme/tokens";

type ScreenProps = PropsWithChildren<{
  scroll?: boolean;
  keyboardAvoiding?: boolean;
  contentContainerStyle?: ViewStyle;
}>;

export function Screen({
  children,
  scroll = false,
  keyboardAvoiding = false,
  contentContainerStyle,
}: ScreenProps) {
  const innerContent = <View style={styles.innerContent}>{children}</View>;
  const content = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
      keyboardShouldPersistTaps="handled"
    >
      {innerContent}
    </ScrollView>
  ) : (
    <View style={[styles.content, contentContainerStyle]}>{innerContent}</View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      {keyboardAvoiding ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.flex}
        >
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { flex: 1, paddingHorizontal: layout.screenPadding },
  scrollContent: { flexGrow: 1, padding: layout.screenPadding },
  innerContent: {
    width: "100%",
    maxWidth: layout.maxContentWidth,
    alignSelf: "center",
    flexGrow: 1,
  },
});
