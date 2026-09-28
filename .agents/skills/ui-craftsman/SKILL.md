---
name: ui-craftsman
description: UI design and implementation skill for SAGANA Mobile. Use whenever creating, styling, or updating screens, navigation routes, components, forms, modals, or theme tokens. Enforces 1:1 Figma adherence, Expo Router conventions, global theme variables, mandatory keyboard avoidance, and accessible primitives.
---

# UI Craftsman Skill (SAGANA Mobile)

## 1. 1:1 Figma Design Adherence
- **Visual Fidelity**: Replicate Figma screens, layouts, component hierarchies, spacings, and copy exactly.
- **Component Geometry & Radii**:
  - Buttons: `rounded-full` (Figma `50px` pill).
  - Cards & Inputs: `rounded-2xl` (Figma `14px` radius).
  - Menu list items / rows: `rounded-lg` (Figma `8px` radius).
  - Input field border width: `1.5px` (`border-[1.5px]`).
- **Complete State Coverage**:
  - Always implement all interactive states shown in Figma: idle, focused, loading, disabled, error states (e.g., incorrect OTP, password mismatch), and confirmation/success modals.

## 2. Mandatory Keyboard Avoidance & Form Handling
Every screen containing inputs or forms MUST implement keyboard avoidance so inputs and buttons never get blocked:
- **KeyboardAvoidingView**: Wrap screen contents with `KeyboardAvoidingView` using `behavior={Platform.OS === 'ios' ? 'padding' : 'height'}`.
- **Scroll Container**: Inputs must live inside a `ScrollView` with `keyboardShouldPersistTaps="handled"` and `showsVerticalScrollIndicator={false}`.
- **Dismiss on Background Tap**: Wrap outside non-interactive areas in `TouchableWithoutFeedback` calling `Keyboard.dismiss`.
- **Submit Visibility**: Ensure CTA buttons (e.g. Next, Submit, Save) remain visible above the software keyboard.

## 3. Strict Adherence to Global Theme Colors (`global.css`)
Style **exclusively** with semantic theme variables defined in `global.css`. Never use raw hex/rgb values or hardcoded generic palette classes (`bg-emerald-*`, `bg-slate-*`, `bg-white`) for themed surfaces:
- Background: `bg-background` (`#FAF9EE` warm cream)
- Card & Surfaces: `bg-card` (`#FAF9EE`)
- Primary Brand: `bg-primary` (`#718619` olive green), `text-primary-foreground` (`#FAF9EE`)
- Secondary Action: `bg-secondary` (`#E2E1DC` stone gray), `text-secondary-foreground` (`#414141`)
- Primary Text / Headings: `text-foreground` (`#414141` charcoal)
- Secondary / Helper Text: `text-muted-foreground` (`#96958F`)
- Inactive Navigation: `text-[#AFAEA7]`
- Borders: `border-border` (`#D3D2CB` card outlines), `border-input` (`#C8C7BE` input strokes)
- Destructive / Errors: `bg-destructive`, `text-destructive`, `border-destructive` (`#E84C4C`)
- Accent / Focus Ring: `ring-primary`

## 4. Typography & Font Mapping
- SAGANA Mobile uses **Spotify Mix** loaded from `assets/fonts/` via `expo-font`:
  - `font-sans`: `SpotifyMix-Regular` (400) — input placeholders, bullet descriptions
  - `font-medium`: `SpotifyMix-Medium` (500) — body text, input value text
  - `font-semibold`: `SpotifyMix-Bold` (600/700) — card titles, field labels, badges
  - `font-bold`: `SpotifyMix-Bold` (700) — screen titles (`text-2xl`/`text-3xl`), primary button labels
- Never leave text unstyled with default system fonts.

## 5. Primitives, Icons & Safe Area
- Use `@rn-primitives` in `src/components/ui/` with `cva` for core primitives (`Button`, `Input`, `Card`).
- Icons must come from `lucide-react-native` (or custom SVG in `src/components/icons/`).
- Safe area handling must strictly use `useSafeAreaInsets()` from `react-native-safe-area-context` (never legacy `<SafeAreaView>`).
- Haptics: `expo-haptics` on button presses (`Light`) and validation errors (`NotificationFeedbackType.Error`).
- Native toasts: `burnt` for API errors and success alerts.

## 6. Expo Router Integration & Screen Architecture
- **Layout Groups**:
  - `(auth)` for public authentication screens (`sign-in`, `sign-up`, `forgot-password`).
  - `(app)` for protected application routes (`(tabs)`: `index`, `devices`, `analytics`, `profile`).
- **Navigation Hooks**:
  - Use `useRouter()` from `expo-router` for programmatic transitions (`router.push()`, `router.replace()`, `router.back()`).
  - Use `<Link href="...">` with `asChild` for accessible tap targets.
  - Never use React Navigation's legacy `navigation.navigate()`.
- **Screen Options**:
  - Configure headers declaratively using `<Stack.Screen options={{ headerShown: false, ... }} />` inside screens.
- **Route Parameters**:
  - Use `useLocalSearchParams<Type>()` for typed route params.
- **Route Guards**:
  - Route authentication checks live in root layout (`app/_layout.tsx`), not duplicated inside individual screens.
