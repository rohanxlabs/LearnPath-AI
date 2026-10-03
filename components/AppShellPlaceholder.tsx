import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";

import { Button, Card, Screen, Typography } from "./index";
import { colors, radii, spacing } from "../theme/tokens";

type AppShellPlaceholderProps = {
  title: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
};

export function AppShellPlaceholder({ title, icon }: AppShellPlaceholderProps) {
  const router = useRouter();
  return (
    <Screen>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons
            name={icon}
            size={30}
            color={colors.primary}
          />
        </View>
        <Typography variant="heading">{title}</Typography>
        <Typography color={colors.textSecondary} style={styles.body}>
          This navigation destination is ready for a future product phase.
        </Typography>
        <Card>
          <Typography variant="bodyMedium">Phase 1 app shell</Typography>
          <Typography
            color={colors.textSecondary}
            variant="caption"
            style={styles.cardBody}
          >
            Product content is intentionally not included in the design-system
            foundation.
          </Typography>
          <Button
            label="Open design showcase"
            variant="secondary"
            onPress={() => router.push("/showcase")}
          />
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  iconCircle: {
    alignItems: "center",
    justifyContent: "center",
    width: 64,
    height: 64,
    borderRadius: radii.full,
    backgroundColor: colors.primarySoft,
  },
  body: { maxWidth: 300, textAlign: "center" },
  cardBody: { marginTop: spacing.sm, marginBottom: spacing.lg },
});
