---
trigger: always_on
description: UI standards for ui-craftsman using honey-design, React Native Reusables (shadcn), and Uniwind
---

# UI Design & Styling Rules (ui-craftsman)

## 1. 1:1 Figma Design Adherence

- **Visual Fidelity**: Replicate Figma screens, layouts, component hierarchies, spacings, and copy exactly.
- **Component Geometry & Radii**:
  - Buttons: `rounded-full` (Figma `50px` pill).
  - Cards & Inputs: `rounded-2xl` (Figma `14px` radius).
  - Menu list items / rows: `rounded-lg` (Figma `8px` radius).
  - Input field border width: `1.5px` (`border-[1.5px]`).
- **Complete State Coverage**:
  - Always implement all interactive states shown in Figma: idle, focused, loading, disabled, error states (e.g., incorrect OTP, password mismatch), and confirmation/success modals.

## 2. Strict Adherence to Global Theme Colors (`global.css`)

- Style **exclusively** with semantic theme variables defined in `global.css`. Never use raw hex/rgb values or hardcoded generic palette classes (`bg-emerald-*`, `bg-slate-*`, `bg-white`) for themed surfaces:
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

## 3. Mandatory Keyboard Avoidance & Form Handling

- Every screen containing text inputs or form submission MUST implement keyboard avoidance:
  - Wrap screen content with `KeyboardAvoidingView` using `behavior={Platform.OS === 'ios' ? 'padding' : 'height'}`.
  - Wrap inputs inside a `ScrollView` with `keyboardShouldPersistTaps="handled"` and `showsVerticalScrollIndicator={false}`.
  - Implement dismiss-on-tap outside: wrap non-interactive background areas in `TouchableWithoutFeedback` calling `Keyboard.dismiss`.
  - Ensure action buttons (e.g. submit, next, log in) remain visible and accessible when the virtual keyboard is open.

## 4. Typography & Font Mapping

- SAGANA Mobile uses **Spotify Mix** loaded from `assets/fonts/` via `expo-font`:
  - `font-sans`: `SpotifyMix-Regular` (400) — input placeholders, bullet descriptions
  - `font-medium`: `SpotifyMix-Medium` (500) — body text, input value text
  - `font-semibold`: `SpotifyMix-Bold` (600/700) — card titles, field labels, badges
  - `font-bold`: `SpotifyMix-Bold` (700) — screen titles (`text-2xl`/`text-3xl`), primary button labels
- Never leave text unstyled with default system fonts.

## 5. Component Standards (`@rn-primitives` + `cva`)

- Use React Native Reusables (`@rn-primitives`) in `src/components/ui/` for core primitives: `Button`, `Input`, `Card`, `Dialog`, `Avatar`, `Tabs`, `Separator`, `Label`, `Switch`, `Select`, `Checkbox`.
- All components must expose standard `variant` and `size` props via `class-variance-authority` (`cva`).
- **Reuse first**: Always check if a component already exists in `src/components/ui/` before creating a new one.

## 6. Icons — Lucide & Custom SVG Brand Icons

- Use **`lucide-react-native`** for all standard UI icons (`Mail`, `Lock`, `User`, `Phone`, `MapPin`, `Check`, `AlertCircle`, etc.).
- Place custom brand vector icons in **`src/components/icons/`** using `react-native-svg` (e.g. `GoogleIcon`).
- Use theme tokens or palette colors for icon strokes (e.g. `color="#414141"` or `color="#718619"`).

## 7. Safe Area — `useSafeAreaInsets()` Hook

- Use `useSafeAreaInsets()` from `react-native-safe-area-context` for safe area handling.
- **Do NOT** use the legacy `<SafeAreaView>` wrapper component.
- Apply insets directly via style: `style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}`.

## 8. Honey-Design Efficiency

- **Compact, token-dense markup**: Every `<View>` must earn its existence. If a parent can carry the styles, don't add a wrapper.
- **Flat hierarchies**: Flatten nested View trees. Prefer `gap-*` on a parent over margin on each child.
- **Shared classes**: Extract repeated className strings into a `const` or a `cva` variant rather than duplicating long class lists.
- **Minimal state**: Derive values from existing state instead of creating new state variables.

## 9. Animations & Micro-Interactions

- Use `react-native-reanimated` for smooth animations (spring configs `withSpring` for natural motion, 150–300ms duration).
- Include tactile vibration feedback via `expo-haptics`:
  - `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)` on button presses and OTP typing.
  - `Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)` on validation failures.
- Surface backend errors and notifications using `burnt` native toasts — never use `Alert.alert()` for API errors.

## 10. UX Fundamentals

- **Touch targets**: Minimum 44×44pt hit area on all interactive elements.
- **Loading states**: Every async action must show a loading indicator (spinner, skeleton, or disabled state).
- **Inline errors**: Display inline error text directly below inputs (`text-xs text-destructive mt-1 font-medium`).
- **Empty states**: Never show a blank screen — provide clear messaging and a CTA.
