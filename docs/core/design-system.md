# Design System & Uniwind

Sagana Mobile uses **Uniwind** (Tailwind CSS v4 for React Native) paired with **@rn-primitives** and **class-variance-authority (cva)**.

---

## 🎨 Theme Variables & Palette Tokens

All colors follow the Figma **Color Schema and Usage Guide** (node `679:1957`). Tokens are exposed as Tailwind utilities via `global.css` and as strongly-typed constants via `@/constants`:

### Semantic Tokens

| Token | Class | Hex | Description |
| :--- | :--- | :--- | :--- |
| `background` | `bg-background` | `#FAF9EE` | Warm cream page background |
| `card` | `bg-card` | `#FAF9EE` | Surface cards |
| `skeleton` | `bg-skeleton` | `#E9E8D9` | Skeleton loading screens |
| `primary` | `bg-primary`, `text-primary` | `#718619` | Primary action buttons & confirmed status |
| `secondary` | `bg-secondary` | `#E2E1DC` | Secondary gray button background |
| `foreground` | `text-foreground` | `#414141` | Primary text and icons |
| `muted-foreground` | `text-muted-foreground` | `#AFAEA7` | Gray text & inactive navigation |
| `border` | `border-border` | `#DCDBD5` | Card and separator borders |
| `input` | `border-input`, `bg-gray-progress` | `#C8C7BE` | Input strokes & progress bar tracks |
| `destructive` | `bg-destructive`, `text-destructive` | `#E84C4C` | Errors, alerts, destructive actions |

### IoT Sensor Telemetry Palette

| Sensor | Color Ramp | Base (500) | Notes |
| :--- | :--- | :--- | :--- |
| **Temperature** | `purple-50` .. `purple-900` | `#AB6DD5` | Thermometer indicators |
| **Moisture** | `teal-50` .. `teal-900` | `#51A7B1` | Droplets moisture indicators |
| **Oxygen (O2)** | `yellow-50` .. `yellow-900` | `#DBCC41` | Wind / O2 status indicators |
| **Carbon Dioxide (CO2)** | `green-50` .. `green-900` | `#6CAD6C` | Cloud / CO2 status indicators |

### Brand & Red Shade Ramps

- **BRAND**: `50 (#F5F7E8)` · `100 (#E5ECC4)` · `200 (#CAD88C)` · `300 (#A3BA4C)` · `500 (#718619)` · `700 (#566811)` · `900 (#35420A)`
- **NEUTRAL**: `50 (#F5F5F3)` · `100 (#E5E5E1)` · `200 (#C8C8C2)` · `300 (#8E8E87)` · `500 (#414141)` · `700 (#292929)` · `900 (#171717)`
- **RED**: `50 (#FEF2F2)` · `100 (#FBDDDD)` · `200 (#F6B1B1)` · `300 (#F08080)` · `500 (#E84C4C)` · `700 (#B83030)` · `900 (#7B2020)`

### Gradients (237°)

- **Stat Cards**: `linear-gradient(237deg, #C9E752 33%, #518251 100%)`
- **Dashboard Action Buttons**: `linear-gradient(237deg, #C9E752 0%, #518251 90%)`

---

## 🧩 UI Primitives & `cva`

All core elements in `src/components/ui/` use `cva` to define variants, sizes, and responsive states.

### Button Component (`src/components/ui/button.tsx`)

```tsx
const buttonVariants = cva(
  'group flex items-center justify-center rounded-xl flex-row',
  {
    variants: {
      variant: {
        default: 'bg-primary active:opacity-90',
        destructive: 'bg-destructive active:opacity-90',
        outline: 'border border-border bg-background active:bg-accent',
        secondary: 'bg-secondary active:opacity-80',
        ghost: 'active:bg-accent',
        link: 'text-primary underline-offset-4 active:underline',
      },
      size: {
        default: 'h-12 px-5 py-3',
        sm: 'h-9 px-3',
        lg: 'h-14 px-8',
        icon: 'h-11 w-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);
```

---

## 🔤 Typography & Fonts

Custom typography uses Google's **Montserrat** font family loaded via `@expo-google-fonts/montserrat`:

| Utility Class | Font Family | Weight |
| :--- | :--- | :--- |
| `font-sans` | `Montserrat-Regular` | 400 |
| `font-medium` | `Montserrat-Medium` | 500 |
| `font-semibold` | `Montserrat-SemiBold` | 600 |
| `font-bold` | `Montserrat-Bold` | 700 |

---

## 📱 Safe Areas & Haptics

- **Safe Areas**: Use `useSafeAreaInsets()` from `react-native-safe-area-context` instead of legacy `<SafeAreaView>`.
- **Haptic Feedback**: Use `expo-haptics` on all primary buttons, tab switches, and confirmations (`Haptics.ImpactFeedbackStyle.Light`).
- **Toasts**: Use `burnt` native toasts for asynchronous feedback.

---

## ⌨️ Mandatory Keyboard Avoidance & Form Handling

Every screen containing inputs or forms MUST implement keyboard avoidance so inputs and buttons never get blocked:

- **KeyboardAvoidingView**: Wrap screen contents with `KeyboardAvoidingView` using `behavior={Platform.OS === 'ios' ? 'padding' : 'height'}`.
- **Scroll Container**: Inputs must live inside a `ScrollView` with `keyboardShouldPersistTaps="handled"` and `showsVerticalScrollIndicator={false}`.
- **Dismiss on Background Tap**: Wrap outside non-interactive areas in `TouchableWithoutFeedback` calling `Keyboard.dismiss`.
- **Submit Visibility**: Ensure CTA buttons (e.g. Next, Submit, Save) remain visible above the software keyboard.
