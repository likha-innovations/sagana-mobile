# Design System & Uniwind

Sagana Mobile uses **Uniwind** (Tailwind CSS v4 for React Native) paired with **@rn-primitives** and **class-variance-authority (cva)**.

---

## 🎨 Theme Variables & Semantic Tokens

Theme tokens are defined in `global.css` using CSS custom properties with automatic light/dark mode switching:

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --primary: 152 76% 36%;           /* Sagana Emerald */
    --primary-foreground: 355.7 100% 97.3%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 152 76% 36%;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 6.5%;
    --card-foreground: 210 40% 98%;
    --primary: 152 76% 42%;
    --primary-foreground: 144.9 80.4% 10%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
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
