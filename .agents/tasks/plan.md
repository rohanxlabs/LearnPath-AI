# Implementation Plan: Roadmap Screen Visual Redesign

## Overview

This plan transforms `app/(learning)/roadmap/[roadmapId].tsx` to match the target visual design while preserving ALL existing business logic, data flow, API calls, and navigation patterns. This is a **visual-only redesign** — no changes to types, data fetching, state management, or functionality.

## Context

**Current state:**
- The screen uses `ScreenHeader` component with standard styling
- Progress is shown in a `Card` with icon, text, and `ProgressBar`
- Next step is shown in a `Card variant="selected"` with eyebrow, title, reason, and CTA button
- Phases are rendered as bordered `Card` components with timeline markers on the left
- Modules and lessons are nested inside phase cards
- All business logic (roadmapId param, API calls, cachedApiRequest, normalizeRoadmap, flattenLessons, targetLessonId detection, expandedPhaseId state, openLesson navigation) is working correctly

**Target design:**
- Custom header layout: large circular back button + "LEARNING PATH" eyebrow + roadmap title (28-30px bold)
- Progress card with larger percentage display (26-28px), rounded icon container, and refined spacing
- Next step card with strong periwinkle background, larger title (26-28px), dark CTA button
- "Your journey" section heading (NOT in a card, directly on page)
- **Continuous vertical timeline** — NOT boxed cards per phase
- Timeline rail (2px, left-aligned with phase markers, continuous from first to last phase)
- Phase markers (circles: 38px, completed=green with check, active=periwinkle with number, locked=gray with lock)
- Phase content (NO Card wrapper, flat/open layout integrated into timeline)
- Module headers (icon + name + count, flat in timeline)
- Lesson rows (status icon, title, metadata, chevron for available/recommended)
- Locked lessons: muted text (opacity 0.5 or `colors.textMuted`), lock icon, no chevron, NOT pressable

**Key constraint:** ALL existing functionality must be preserved — this is purely a visual transformation.

---

## Implementation Steps

- [ ] **1. Replace ScreenHeader with custom header layout**
  
  **What:** Remove the `<ScreenHeader>` component usage and create a custom header matching the design: large circular back button (~48px, light gray background, dark arrow-left icon) + "LEARNING PATH" eyebrow (12px, bold, uppercase, letter-spacing ~1, `colors.primaryDark`) + roadmap title from `roadmap.title` (28-30px, bold, `colors.ink`).
  
  **Files:** `app/(learning)/roadmap/[roadmapId].tsx`
  
  **Details:**
  - Create new style entries: `customHeader`, `backButton`, `headerEyebrow`, `headerTitle`
  - `backButton`: width/height 48, borderRadius full, backgroundColor `colors.surfaceSubtle`, centered icon
  - Keep `router.back()` behavior and `accessibilityLabel="Back to paths"`
  - Eyebrow: uppercase "LEARNING PATH", fontSize 12, fontWeight "700", letterSpacing 1, color `colors.primaryDark`
  - Title: `roadmap.title` (dynamic), fontSize 28, fontWeight "700", color `colors.ink`, tight letterSpacing -0.2
  - Keep all existing imports (MaterialCommunityIcons, useRouter, etc.)
  
  **Verify:** `npm run typecheck` — no TypeScript errors
  
- [ ] **2. Update Progress Card styling to match design**
  
  **What:** Keep the existing `<Card>` component but update the internal layout and styles: larger percentage display (26-28px bold, `colors.primaryDark`), rounded-square icon container (~42px, `colors.primarySoft` bg), "Your progress" label, lessons count metadata, and `<ProgressBar>` below.
  
  **Files:** `app/(learning)/roadmap/[roadmapId].tsx`
  
  **Details:**
  - Update `progressIcon` style: width/height 42, borderRadius `radii.md` (not full), backgroundColor `colors.primarySoft`
  - Change icon to `chart-timeline-variant` (already correct)
  - Create new style `progressPercentage`: fontSize 26, fontWeight "700", color `colors.primaryDark`
  - Use `Math.round(roadmap.progressPercent)` for percentage display (already correct)
  - Use actual `completed` and `lessonCount` values (already correct)
  - Card should use `variant="subtle"` for light gray/periwinkle background
  - Keep existing `<ProgressBar>` component with `value={roadmap.progressPercent / 100}`
  
  **Verify:** `npm run typecheck` — no TypeScript errors
  
- [ ] **3. Update Next Step Card to strong periwinkle background with dark CTA**
  
  **What:** Transform the next step card to use strong periwinkle background (`colors.primary`), larger title (26-28px bold, `colors.ink`), and a dark pill button (`variant="dark"`). Keep all existing data logic: `recommendedTitle || nextLesson.name`, `recommendationReason` or minutes/XP metadata, and `openLesson()` navigation.
  
  **Files:** `app/(learning)/roadmap/[roadmapId].tsx`
  
  **Details:**
  - Create new style `nextStepCard`: backgroundColor `colors.primary`, borderRadius `radii.card`, padding generous
  - Update `nextEyebrow`: use "✦ YOUR NEXT STEP" text (sparkle character), fontSize 12, bold, uppercase, color `colors.ink`
  - Create new style `nextStepTitle`: fontSize 26, fontWeight "700", color `colors.ink`
  - Keep existing `recommendedTitle || nextLesson.name` logic
  - Show metadata: "About {nextLesson.estimatedMinutes} minutes · {nextLesson.xpReward} XP" when no recommendationReason
  - Change button to `<Button label="Continue this lesson" variant="dark" onPress={...} />`
  - Button should be full width with 48-56px height (Button component already handles this)
  - Remove `Card variant="selected"` wrapper, use custom View with `nextStepCard` style
  
  **Verify:** `npm run typecheck` — no TypeScript errors
  
- [ ] **4. Add "Your journey" section heading (not in a card)**
  
  **What:** Add a section heading "Your journey" (22px bold, `colors.ink`) with subtitle "Open a phase to see its lessons." (caption, `colors.textSecondary`) directly on the page, NOT wrapped in a Card component.
  
  **Files:** `app/(learning)/roadmap/[roadmapId].tsx`
  
  **Details:**
  - Keep existing `journeyHeading` style with minor adjustments
  - "Your journey": fontSize 22, fontWeight "700", color `colors.ink`
  - Subtitle: use Typography variant `caption`, color `colors.textSecondary`
  - Ensure adequate spacing: marginTop `spacing.md`, marginBottom `spacing.sm`
  - This section sits BETWEEN the next step card and the phase timeline
  
  **Verify:** `npm run typecheck` — no TypeScript errors
  
- [ ] **5. Transform PhaseCard to continuous timeline layout (CRITICAL REDESIGN)**
  
  **What:** Remove the bordered `Card` wrapper around phase content. Create a continuous vertical timeline with: 2px rail (left-aligned with phase markers), phase markers as circles (38px: completed=green bg with white check icon, active=periwinkle bg with phase number in dark text, locked=light gray bg with gray border and lock icon), and phase content in open/flat layout (NO box, NO border).
  
  **Files:** `app/(learning)/roadmap/[roadmapId].tsx`
  
  **Details:**
  - **Timeline rail styling:** Update `journeyRail` to: position absolute, left 16 (center of 34px marker + 2px), top 34 (below first marker center), bottom -spacing.md, width 2, backgroundColor `colors.border`. The rail should span continuously from the first phase marker to the last.
  
  - **Phase marker updates:** Update `phaseMarker` to: width/height 38 (increased from 34), borderRadius full, centered content. 
    - Completed: backgroundColor `colors.success`, no border, white check icon (`check` or `check-circle-outline`)
    - Active/upcoming: backgroundColor `colors.primary`, borderWidth 2, borderColor `colors.primary`, display phase number as text (fontSize 16, fontWeight "700", color `colors.ink`)
    - Locked: backgroundColor `colors.surfaceSubtle`, borderWidth 2, borderColor `colors.borderStrong`, lock icon `lock-outline` (color `colors.textMuted`)
  
  - **Phase content layout:** REMOVE the Card wrapper (`borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, backgroundColor: colors.surface`). The phase content should be a flat View with NO border, NO background, NO rounded corners — just padding for internal spacing.
    - Update `phaseContent` style: remove borderWidth, borderColor, borderRadius, backgroundColor — keep only flex: 1, marginBottom, padding (for internal spacing)
  
  - **Phase header:** Keep existing Pressable with phase label ("PHASE {index+1}" / "COMPLETED" / "LOCKED"), phase name, and metadata. No visual changes here, just ensure it sits in the now-borderless layout.
  
  - **Phase labels:** Use existing color logic: completed=`colors.success`, locked=`colors.textMuted`, active=`colors.primary`
  
  - **Phase icons in markers:** 
    - Completed: render phase number text OR check icon — design shows check icon for completed phases
    - Active: render phase number as Text (not icon) — `{index + 1}` — styled with fontSize 16, fontWeight "700", color `colors.ink` (dark text on periwinkle background)
    - Locked: render lock icon
  
  - **Module headers:** Already flat/integrated (icon + name + count). Keep existing styles, ensure they're NOT boxed.
  
  - **Lesson rows:** Keep existing layout with adjustments for recommended and locked states (see next steps).
  
  **Verify:** `npm run typecheck` — no TypeScript errors
  
- [ ] **6. Update lesson row styling for recommended, available, and locked states**
  
  **What:** Refine lesson row visual treatment: recommended lessons get light periwinkle background (`colors.primaryTint`) with blue border (~1-2px `colors.primary`) and `play-circle-outline` icon; available/current lessons get `circle-outline` icon; locked lessons get muted text (opacity 0.5 or `colors.textMuted`), `lock-outline` icon, no chevron, and are NOT pressable.
  
  **Files:** `app/(learning)/roadmap/[roadmapId].tsx`
  
  **Details:**
  - **Recommended lesson style:** Update `recommendedLesson` to: backgroundColor `colors.primaryTint`, borderWidth 2, borderColor `colors.primary`, borderRadius `radii.md`
  - **Recommended icon:** Change from `play-circle` to `play-circle-outline` (outlined icon)
  - **Available/current lesson icon:** Change from `circle-outline` to `circle-outline` (keep as is)
  - **Completed lesson icon:** Change from `check-circle` to `check-circle-outline` (outlined icon), color `colors.success`
  - **Locked lesson styling:** Update `lockedLesson` style to remove opacity, instead style the text directly: use Typography with `style={{ color: colors.textMuted, opacity: 0.5 }}` or just `color: colors.textMuted` if that's sufficient
  - **Locked lesson chevron:** The existing code already hides the chevron for locked lessons (`{!disabled ? ... : null}`). Keep this logic.
  - **Locked lesson pressable:** The existing code already disables press for locked lessons (`disabled={disabled}`). Keep this logic.
  - **Lesson metadata text:** "Recommended next · {min} min" for recommended, "Completed · {min} min" for completed, "Ready · {min} min" for available, "Locked · {min} min" for locked
  
  **Verify:** `npm run typecheck` — no TypeScript errors
  
- [ ] **7. Update typography and icon sizing to match design specifications**
  
  **What:** Ensure all text and icon sizes match the design: header title 28-30px, progress percentage 26-28px, next step title 26-28px, "Your journey" heading 22px, phase title 21-22px, module name 16px semibold, lesson title 16px semibold, metadata 13px caption, icons appropriately sized.
  
  **Files:** `app/(learning)/roadmap/[roadmapId].tsx`
  
  **Details:**
  - Header title: fontSize 28, fontWeight "700", letterSpacing -0.2
  - Progress percentage: fontSize 26, fontWeight "700"
  - Next step title: fontSize 26, fontWeight "700"
  - "Your journey": fontSize 22, fontWeight "700"
  - Phase title: fontSize 21, fontWeight "700"
  - Module name: Typography `variant="bodyMedium"` (16px, 600) — already correct
  - Lesson title: Typography `variant="bodyMedium"` (16px, 600) — already correct
  - Metadata: Typography `variant="caption"` (13px, 600) — already correct
  - Icons: back arrow 20-22px, progress icon 20-22px, next step eyebrow icon 16-17px, phase marker icons 18-20px, module icon 18px, lesson icons 20-21px, chevrons 20-23px
  - Use existing MaterialCommunityIcons from `@expo/vector-icons`
  
  **Verify:** `npm run typecheck` — no TypeScript errors
  
- [ ] **8. Update StyleSheet entries and clean up unused styles**
  
  **What:** Add new style entries for custom header, next step card, updated timeline, and phase markers. Remove or update styles that are no longer needed after removing Card wrappers.
  
  **Files:** `app/(learning)/roadmap/[roadmapId].tsx`
  
  **Details:**
  - **Add new styles:**
    - `customHeader`: flexDirection row, alignItems center, gap spacing.md, marginBottom spacing.md
    - `backButton`: width 48, height 48, borderRadius full, backgroundColor surfaceSubtle, alignItems/justifyContent center
    - `headerEyebrow`: fontSize 12, fontWeight "700", textTransform uppercase, letterSpacing 1, color primaryDark
    - `headerTitle`: fontSize 28, fontWeight "700", color ink, letterSpacing -0.2
    - `headerTitleContainer`: flex 1, gap spacing.xs
    - `progressPercentage`: fontSize 26, fontWeight "700", color primaryDark
    - `nextStepCard`: backgroundColor primary, borderRadius radii.card, padding spacing.lg, gap spacing.md
    - `nextStepTitle`: fontSize 26, fontWeight "700", color ink
  
  - **Update existing styles:**
    - `progressIcon`: width/height 42 (from 42), borderRadius radii.md (not full)
    - `journeyRail`: left 16 (center of 38px marker = 19, but use 16 for visual alignment), width 2
    - `phaseMarker`: width/height 38 (from 34)
    - `phaseMarkerComplete`: backgroundColor success (no longer borderColor success)
    - `phaseMarkerLocked`: backgroundColor surfaceSubtle, borderWidth 2, borderColor borderStrong
    - `phaseContent`: REMOVE borderWidth, borderColor, borderRadius, backgroundColor — keep only flex 1, marginBottom, padding
    - `recommendedLesson`: add borderWidth 2, borderColor primary
    - `lockedLesson`: remove opacity (handle in text color instead)
  
  - **Remove or deprecate styles:**
    - Consider if `topBar` and `topBarSpacer` are still needed (they're not in current code, so likely already removed)
  
  - **Ensure all styles use tokens:** colors.*, spacing.*, radii.*, typography.* from theme/tokens.ts
  
  **Verify:** `npm run typecheck` — no TypeScript errors
  
- [ ] **9. Test rendering of phase markers with text (phase numbers) vs icons**
  
  **What:** Ensure phase markers correctly render: completed phases show white check icon on green background, active/upcoming phases show phase number (1, 2, 3...) as dark text on periwinkle background, locked phases show gray lock icon on light gray background.
  
  **Files:** `app/(learning)/roadmap/[roadmapId].tsx`
  
  **Details:**
  - Update PhaseCard component logic to determine marker content:
    - If `complete`: render `<MaterialCommunityIcons name="check" size={20} color={colors.surface} />` (white check on green)
    - If `locked`: render `<MaterialCommunityIcons name="lock-outline" size={18} color={colors.textMuted} />` (gray lock on light gray)
    - Otherwise (active/upcoming): render `<Typography style={phaseNumberStyle}>{index + 1}</Typography>` where phaseNumberStyle is fontSize 16, fontWeight "700", color `colors.ink`
  
  - Update marker background colors:
    - Completed: `colors.success` (green), no border
    - Active: `colors.primary` (periwinkle), borderWidth 2, borderColor `colors.primary`
    - Locked: `colors.surfaceSubtle` (light gray), borderWidth 2, borderColor `colors.borderStrong`
  
  **Verify:** `npm run typecheck` — no TypeScript errors
  
- [ ] **10. Verify all existing functionality is preserved**
  
  **What:** Ensure ALL existing business logic works correctly: roadmapId param, API calls (GET /api/roadmaps/:roadmapId and /api/roadmaps/:roadmapId/next-action), cachedApiRequest with CacheNotice, normalizeRoadmap, flattenLessons, targetLessonId detection, recommendedTitle/recommendationReason, expandedPhaseId state and toggle, completed/available/current/in_progress/locked lesson states, openLesson navigation, router.back(), loading/error/empty states, accessibility.
  
  **Files:** `app/(learning)/roadmap/[roadmapId].tsx`
  
  **Details:**
  - **NO CHANGES to:**
    - Type imports from `../../../lib/learning`
    - `useLocalSearchParams()`, `useRouter()`, `useAuth()` hooks
    - `loadRoadmap()` function (API calls, Promise.all, cachedApiRequest, normalizeRoadmap, flattenLessons)
    - State variables (roadmap, targetLessonId, recommendedTitle, recommendationReason, cachedAt, expandedPhaseId, loading, error)
    - `useMemo` for nextLesson, completed, lessonCount
    - `openLesson()` function with params (lessonId, status) and router.push
    - `router.back()` behavior
    - Loading state with ActivityIndicator and Card
    - Error state with error message, retry button
    - Empty roadmap state with Card and retry button
    - CacheNotice component usage
    - All accessibility roles, labels, states
  
  - **TEST that these work after redesign:**
    - Back button navigates back (router.back())
    - Progress card shows correct percentage and lesson count
    - Next step card shows correct lesson and opens on button press
    - Phase toggles expand/collapse correctly
    - Recommended lesson is highlighted with blue border
    - Locked lessons are not pressable, show muted text, no chevron
    - Available lessons open on press with openLesson()
    - Loading, error, and empty states still render correctly
  
  **Verify:** `npm run typecheck` and `npm run lint` — both pass with no errors
  
- [ ] **11. Final verification: lint and typecheck**
  
  **What:** Run the project's verification commands to ensure the redesign has no TypeScript errors, no linting issues, and follows the project's code quality standards.
  
  **Files:** All TypeScript files
  
  **Details:**
  - Run `npm run typecheck` — must pass with zero errors
  - Run `npm run lint` — must pass with zero errors (or only pre-existing warnings)
  - If there are any errors, fix them before declaring the task complete
  - The redesign should not introduce any new TypeScript errors or linting violations
  
  **Verify:** Both commands exit with code 0 (success)

---

## TypeScript Considerations

- **No new types needed:** All existing types from `lib/learning.ts` remain unchanged
- **All existing imports preserved:** MaterialCommunityIcons, expo-router hooks, React hooks, components, theme tokens
- **Component props unchanged:** PhaseCard receives same props (phase, index, expanded, currentLessonId, onToggle, onOpenLesson)
- **StyleSheet typing:** All new styles use StyleSheet.create() with proper React Native style types
- **Typography component:** Use existing Typography component for text, with variant prop and inline styles for custom sizes

## Timeline Rail Absolute Positioning Approach

The timeline rail uses `position: 'absolute'` within the `phaseShell` View:

```
<View style={styles.phaseShell}>  // flexDirection: row, alignItems: stretch
  <View style={styles.journeyRail} />  // position: absolute, left: 16, top: 34, bottom: -spacing.md, width: 2
  <View style={styles.phaseMarker} />  // width: 38, height: 38, zIndex: 1
  <View style={styles.phaseContent} />  // flex: 1
</View>
```

The rail is positioned:
- `left: 16` aligns with the center of the 38px marker (19px center, but 16 works visually)
- `top: 34` starts below the first marker's center
- `bottom: -spacing.md` extends down to the next phase's marker area
- `width: 2` creates a thin vertical line
- `backgroundColor: colors.border` for subtle gray color

Each phase's rail overlaps slightly with the next, creating a continuous line from first to last phase marker.

## Order of Changes for Implementation

1. **Header first** (step 1) — establishes new visual hierarchy at top
2. **Progress and Next Step cards** (steps 2-3) — relatively isolated changes, low risk
3. **Journey heading** (step 4) — simple addition between sections
4. **Timeline transformation** (steps 5-6) — MOST CRITICAL, requires careful removal of Card wrappers and marker updates
5. **Typography refinements** (step 7) — polish pass after structure is correct
6. **StyleSheet cleanup** (step 8) — consolidate all style changes
7. **Phase marker logic** (step 9) — ensure text/icon rendering works correctly
8. **Functionality verification** (step 10) — comprehensive manual testing
9. **Final verification** (step 11) — automated checks (typecheck, lint)

## Notes

- **This is a visual redesign only** — no changes to business logic, API calls, or data flow
- **The existing Card component** is REMOVED from phase content but still used for progress card, loading state, error state, and empty state
- **The ScreenHeader component** is replaced with custom JSX for the specific design requirements
- **All existing functionality** must work identically after the redesign
- **Accessibility** must be preserved — all existing accessibilityRole, accessibilityLabel, accessibilityState attributes remain
- **Loading, error, and empty states** are kept as-is with their existing Card wrappers
- **The Screen component** usage with `scroll` prop remains unchanged
- **All imports** that are currently used remain — no new dependencies needed

---

This plan provides a clear, step-by-step path to transform the roadmap screen's visual appearance while keeping all existing functionality intact. Each step is independently verifiable and leaves the codebase in a buildable state.
