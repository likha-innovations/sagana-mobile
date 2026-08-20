---
trigger: always_on
description: UI standards for ui-craftsman using honey-design, React Native Reusables (shadcn), and Uniwind
---

# UI Design & Styling Rules (ui-craftsman)

## 1. Component Standards (`@rn-primitives` + `cva`)

- Use React Native Reusables (`@rn-primitives`) in `src/components/ui/` for **all** core primitives: `Button`, `Input`, `Card`, `Dialog`, `Avatar`, `Tabs`, `Separator`, `Label`, `Switch`, `Select`, `Checkbox`.
- All components must expose standard `variant` and `size` props via `class-variance-authority` (`cva`).
- **Reuse first**: Always check if a component already exists in `src/components/ui/` before creating a new one. Only create new components when no existing primitive covers the need.

## 2. Uniwind & Theme Tokens

- Style **exclusively** using Uniwind utility classes (`className` prop) and CSS theme variables defined in `global.css`.
- **Standard Scale over Arbitrary Values**: Always use the predefined Tailwind scale tokens instead of arbitrary values (e.g. use `p-3`, `p-4`, `gap-4`, `rounded-xl`, `text-sm`, `h-12` instead of `p-[12px]`, `p-[16px]`, `gap-[16px]`, `rounded-[12px]`, `text-[14px]`, `h-[48px]`). Arbitrary bracket syntax (`[...]`) is strictly reserved for edge-case hardware/dynamic metrics that cannot map to the scale.
- Use semantic theme tokens to guarantee dark/light mode compatibility:
  - Backgrounds: `bg-background`, `bg-card`, `bg-muted`, `bg-primary`, `bg-secondary`, `bg-destructive`
  - Text: `text-foreground`, `text-muted-foreground`, `text-primary-foreground`, `text-card-foreground`
  - Borders: `border-border`, `border-input`
  - Ring: `ring-ring`
- **Never** use raw hex/rgb colors in className or inline styles for themed surfaces (e.g. `bg-[#10b981]` is banned in favor of `bg-emerald-600` or `bg-primary`). Use theme tokens or Tailwind color classes.
- Inline `style={}` is allowed **only** for fixed numeric dimensions (image width/height, dynamic insets) that Tailwind cannot express.

## 3. Icons — Lucide & Custom SVG Brand Icons

- Use **`lucide-react-native`** for all standard UI icons (`Mail`, `Lock`, `User`, `Phone`, `MapPin`, etc.).
- Place brand vector icons in **`src/components/icons/`** using `react-native-svg` (e.g. `GoogleIcon`).
- Common pattern: `<Mail size={18} color="#94a3b8" />`, `<GoogleIcon size={18} />`.

## 4. Safe Area — `useSafeAreaInsets()` Hook

- Use `useSafeAreaInsets()` from `react-native-safe-area-context` for safe area handling.
- **Do NOT** use the legacy `<SafeAreaView>` wrapper component.
- Apply insets directly via style: `style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}`.

## 5. Honey-Design Efficiency

- **Compact, token-dense markup**: Every `<View>` must earn its existence. If a parent can carry the styles, don't add a wrapper.
- **Flat hierarchies**: Flatten nested View trees. Prefer `gap-*` on a parent over margin on each child.
- **Shared classes**: Extract repeated className strings into a `const` or a `cva` variant rather than duplicating long class lists.
- **Minimal state**: Derive values from existing state instead of creating new state variables. Use `useMemo` only when profiling shows a need.
- **No speculative abstractions**: Don't create "generic" wrappers, HOCs, or context providers unless 3+ consumers exist today.

## 6. Animations & Transitions

- Use `react-native-reanimated` for all animations. Prefer `Animated.View` with shared values.
- Animations must be **smooth** — use spring configs (`withSpring`) for natural motion, timing for linear fades.
- Keep animation durations short: 150–300ms for micro-interactions, 300–500ms for page transitions.
- Avoid layout thrashing — animate `transform` and `opacity` only, not `width`/`height`/`top`/`left`.

## 7. Micro-Interactions & Haptics

- Include tactile vibration feedback via `expo-haptics` on button presses, toggles, destructive actions, and form submissions.
- Use `ImpactFeedbackStyle.Light` for taps, `.Medium` for toggles, `.Heavy` for destructive.
- Surface backend errors and notifications using `burnt` native toasts — never use `Alert.alert()` for API errors.
- Prevent keyboard overlaps with `KeyboardAvoidingView` (behavior `padding` on iOS, `height` on Android) on all scrollable screens.

## 8. UX Fundamentals

- **Touch targets**: Minimum 44×44pt hit area on all interactive elements.
- **Loading states**: Every async action must show a loading indicator (spinner, skeleton, or disabled state).
- **Error states**: Display inline error text below inputs; use `burnt` toast for global errors.
- **Empty states**: Never show a blank screen — provide helpful messaging and a CTA.
- **Keyboard dismiss**: Scrollable screens should dismiss keyboard on scroll/tap outside inputs.
