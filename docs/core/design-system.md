# Design System & Uniwind

Sagana Mobile uses **Uniwind** (Tailwind CSS v4 for React Native) paired with **@rn-primitives** and **class-variance-authority (cva)**.

---

## 🎨 Theme Variables & Semantic Tokens

Theme tokens are defined in `global.css` using CSS custom properties with automatic light/dark mode switching:

```css
@layer base {
  :root {
    --background: 55 55% 96%;        /* #FAF9EE - Warm Cream */
    --foreground: 0 0% 25.5%;        /* #414141 - Dark Charcoal */
    --card: 55 55% 96%;
    --card-foreground: 0 0% 25.5%;
    --primary: 71.6 68.6% 31.2%;     /* #718619 - Sagana Olive */
    --primary-foreground: 55 55% 96%;
    --secondary: 50 9.4% 87.5%;      /* #E2E1DC - Stone Gray */
    --secondary-foreground: 0 0% 25.5%;
    --muted: 50 9.4% 87.5%;
    --muted-foreground: 51 3.5% 57.5%; /* #96958F - Muted Text */
    --border: 52 8% 81.2%;           /* #D3D2CB - Card Border */
    --input: 54 8.5% 76.5%;          /* #C8C7BE - Input Border */
    --destructive: 0 77.2% 60.4%;    /* #E84C4C - Error Red */
    --ring: 71.6 68.6% 31.2%;
  }

  .dark {
    --background: 60 10% 10%;
    --foreground: 55 55% 96%;
    --card: 60 11% 13%;
    --card-foreground: 55 55% 96%;
    --primary: 71 68% 44%;
    --primary-foreground: 60 10% 10%;
    --border: 60 11% 22%;
    --input: 60 11% 22%;
  }
}
```

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
