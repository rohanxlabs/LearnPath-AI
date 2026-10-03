export const colors = {
  primary: "#6557C8",
  primaryDark: "#4B3EA8",
  primarySoft: "#EEEAFE",
  primaryTint: "#F6F4FF",
  background: "#FBFAFE",
  surface: "#FFFFFF",
  text: "#211F2B",
  textSecondary: "#686575",
  textMuted: "#767385",
  border: "#E8E5F0",
  borderStrong: "#D4D0E1",
  success: "#31805A",
  successSoft: "#EAF6EF",
  warning: "#A86B1D",
  warningSoft: "#FFF4DF",
  error: "#B84C59",
  errorSoft: "#FCEBED",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export const radii = {
  sm: 8,
  md: 14,
  lg: 20,
  full: 999,
} as const;

export const typography = {
  display: { fontSize: 30, lineHeight: 38, fontWeight: "700" as const },
  heading: { fontSize: 24, lineHeight: 32, fontWeight: "700" as const },
  title: { fontSize: 20, lineHeight: 28, fontWeight: "700" as const },
  body: { fontSize: 16, lineHeight: 24, fontWeight: "400" as const },
  bodyMedium: { fontSize: 16, lineHeight: 24, fontWeight: "600" as const },
  label: { fontSize: 12, lineHeight: 16, fontWeight: "700" as const },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: "600" as const },
} as const;

export const elevation = {
  card: {
    shadowColor: "#211F2B",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
} as const;

export const layout = {
  screenPadding: spacing.lg,
  maxContentWidth: 640,
  minimumTouchTarget: 44,
  androidTouchTarget: 48,
  iconButtonSize: 48,
  inputHeight: 52,
  progressHeight: 8,
} as const;

export const motion = {
  fast: 140,
  normal: 240,
  slow: 380,
  easing: "easeInOut" as const,
} as const;

