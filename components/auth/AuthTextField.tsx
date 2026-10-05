import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { colors, layout, radii, spacing, welcomeColors } from "../../theme/tokens";

type AuthTextFieldProps = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  accessibilityLabel: string;
  icon: "email-outline" | "lock-outline";
  secureTextEntry?: boolean;
  onToggleSecureTextEntry?: () => void;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  autoComplete?: "email" | "current-password";
  textContentType?: "emailAddress" | "password";
  keyboardType?: "email-address" | "default";
  returnKeyType?: "next" | "done";
  onSubmitEditing?: () => void;
};

export function AuthTextField({
  value,
  onChangeText,
  placeholder,
  accessibilityLabel,
  icon,
  secureTextEntry,
  onToggleSecureTextEntry,
  autoCapitalize = "none",
  autoComplete,
  textContentType,
  keyboardType = "default",
  returnKeyType,
  onSubmitEditing,
}: AuthTextFieldProps) {
  return (
    <View style={styles.field}>
      <MaterialCommunityIcons name={icon} size={24} color={welcomeColors.brandBlue} />
      <TextInput
        accessibilityLabel={accessibilityLabel}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmitEditing}
        placeholder={placeholder}
        placeholderTextColor={welcomeColors.mutedGray}
        returnKeyType={returnKeyType}
        secureTextEntry={secureTextEntry}
        textContentType={textContentType}
        value={value}
        style={styles.input}
      />
      {onToggleSecureTextEntry ? (
        <Pressable
          accessibilityLabel={secureTextEntry ? "Show password" : "Hide password"}
          accessibilityRole="button"
          accessibilityState={{ selected: !secureTextEntry }}
          hitSlop={8}
          onPress={onToggleSecureTextEntry}
          style={styles.eyeButton}
        >
          <MaterialCommunityIcons name={secureTextEntry ? "eye-outline" : "eye-off-outline"} size={24} color={colors.textSecondary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.mdPlus,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: welcomeColors.inputBorder,
    backgroundColor: welcomeColors.inputBg,
  },
  input: {
    flex: 1,
    minHeight: layout.minimumTouchTarget,
    paddingVertical: spacing.sm,
    color: welcomeColors.nearBlack,
    fontFamily: "Outfit_400Regular",
    fontSize: 16,
  },
  eyeButton: {
    width: layout.minimumTouchTarget,
    height: layout.minimumTouchTarget,
    alignItems: "center",
    justifyContent: "center",
    marginRight: -spacing.sm,
  },
});
