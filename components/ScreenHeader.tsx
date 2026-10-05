import { MaterialCommunityIcons } from "@expo/vector-icons";
import { PropsWithChildren } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, layout, spacing } from "../theme/tokens";
import { IconButton } from "./IconButton";
import { Typography } from "./Typography";

type ScreenHeaderProps = PropsWithChildren<{
  title: string;
  subtitle?: string;
  onBack?: () => void;
  backLabel?: string;
  rightAction?: React.ReactNode;
  icon?: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  safeArea?: boolean;
  style?: ViewStyle;
}>;

export function ScreenHeader({
  title,
  subtitle,
  onBack,
  backLabel = "Back",
  rightAction,
  icon,
  safeArea = false,
  style,
}: ScreenHeaderProps) {
  const content = (
    <View style={[styles.container, style]}>
      <View style={styles.leading}>
        {onBack ? (
          <IconButton icon="arrow-left" label={backLabel} onPress={onBack} />
        ) : icon ? (
          <View style={styles.icon}>
            <MaterialCommunityIcons
              name={icon}
              size={layout.iconMedium}
              color={colors.primaryDark}
            />
          </View>
        ) : null}
      </View>
      <View style={styles.copy}>
        <Typography variant="screenTitle" numberOfLines={2}>
          {title}
        </Typography>
        {subtitle ? (
          <Typography variant="bodySmall" color={colors.textSecondary} numberOfLines={2}>
            {subtitle}
          </Typography>
        ) : null}
      </View>
      <View style={styles.trailing}>{rightAction}</View>
    </View>
  );
  return safeArea ? (
    <SafeAreaView edges={["top", "left", "right"]}>{content}</SafeAreaView>
  ) : (
    content
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: layout.iconButtonSize,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  leading: { width: layout.iconButtonSize, alignItems: "flex-start" },
  copy: { flex: 1, gap: spacing.xs },
  trailing: { minWidth: layout.iconButtonSize, alignItems: "flex-end" },
  icon: {
    width: layout.iconButtonSize,
    height: layout.iconButtonSize,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: layout.iconButtonSize / 2,
    backgroundColor: colors.surfaceSelected,
  },
});
