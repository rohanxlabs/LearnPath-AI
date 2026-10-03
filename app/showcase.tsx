import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

import {
  Avatar,
  Badge,
  Button,
  Card,
  Chip,
  Divider,
  IconButton,
  Input,
  ProgressBar,
  Screen,
  SectionHeader,
  Skeleton,
  Typography,
} from "../components";
import { colors, spacing } from "../theme/tokens";

export default function DesignSystemShowcase() {
  return (
    <Screen scroll keyboardAvoiding>
      <Typography variant="label" color={colors.primary}>
        LEARNPATH DESIGN SYSTEM
      </Typography>
      <Typography variant="display" style={styles.title}>
        Showcase
      </Typography>
      <Typography color={colors.textSecondary} style={styles.intro}>
        Reusable Phase 1 primitives and visual tokens.
      </Typography>

      <SectionHeader title="Typography" />
      <Card>
        <Typography variant="heading">Heading hierarchy</Typography>
        <Typography variant="title">Section title</Typography>
        <Typography variant="body">
          Readable body copy for learning content.
        </Typography>
        <Typography variant="caption" color={colors.textMuted}>
          Caption and supporting information
        </Typography>
      </Card>

      <SectionHeader title="Actions" />
      <View style={styles.row}>
        <Button label="Primary" />
        <Button label="Secondary" variant="secondary" />
      </View>
      <View style={styles.row}>
        <Button label="Quiet" variant="quiet" />
        <Button label="Loading" loading />
        <IconButton icon="heart-outline" label="Save example" />
      </View>

      <SectionHeader title="Status and progress" />
      <View style={styles.row}>
        <Chip label="Selected" selected />
        <Chip label="Filter" />
        <Badge label="Complete" tone="success" />
        <Badge label="Estimate" tone="warning" />
      </View>
      <Card>
        <Typography variant="bodyMedium">Learning progress</Typography>
        <Typography
          color={colors.textSecondary}
          variant="caption"
          style={styles.progressLabel}
        >
          68% complete
        </Typography>
        <ProgressBar value={0.68} label="Learning progress 68 percent" />
      </Card>

      <SectionHeader title="Inputs and identity" />
      <Input label="Goal" placeholder="A labeled input foundation" />
      <View style={styles.identityRow}>
        <Avatar initials="LP" label="LearnPath profile" />
        <Typography color={colors.textSecondary}>
          Avatar fallback with initials
        </Typography>
        <MaterialCommunityIcons
          name="check-circle-outline"
          size={22}
          color={colors.success}
        />
      </View>

      <SectionHeader title="Surfaces and layout" />
      <Card>
        <Typography variant="bodyMedium">Card surface</Typography>
        <Divider />
        <Typography color={colors.textSecondary} variant="caption">
          Dividers, spacing, radii, and elevation are centralized.
        </Typography>
      </Card>
      <Skeleton width="100%" height={16} label="Loading preview" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: spacing.sm },
  intro: { marginTop: spacing.sm, marginBottom: spacing.xl },
  row: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  progressLabel: { marginTop: spacing.xs, marginBottom: spacing.md },
  identityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginVertical: spacing.md,
  },
});
