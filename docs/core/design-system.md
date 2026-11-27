# Design System & Uniwind

The app uses **Uniwind + Tailwind CSS v4** and local **Spotify Mix** fonts. This page describes the source at `38b132d`; it does not certify visual parity or accessibility on devices.

## Styling entry points

| File | Responsibility |
| --- | --- |
| `global.css` | Imports `tailwindcss` and `uniwind`; defines theme colors and font utilities |
| `metro.config.js` | Wraps Expo's Metro config with `withUniwindConfig`, using `global.css` and generating `src/uniwind-types.d.ts` |
| `babel.config.js` | Uses `babel-preset-expo` |
| `uniwind-env.d.ts` | References `uniwind/types` and declares CSS modules |
| `src/constants/colors.ts` | Color constants for native styles, icons and gradients |
| `src/constants/layout.ts` + `src/hooks/use-layout.ts` | Shared layout dimensions and safe-area offsets |
| `app/_layout.tsx` | Imports CSS and loads bundled font files before rendering |

The NativeWind setup has been replaced. Keep CSS tokens and native color constants aligned when changing shared colors.

## Palette

| Purpose | Token | Value |
| --- | --- | --- |
| Page / card | `background`, `card` | `#FAF9EE` |
| Text | `foreground` | `#414141` |
| Primary action | `primary` | `#718619` |
| Secondary surface | `secondary` | `#E2E1DC` |
| Muted text | `muted-foreground` | `#AFAEA7` |
| Border / input | `border`, `input` | `#DCDBD5`, `#C8C7BE` |
| Loading placeholder | `skeleton` | `#E9E8D9` |
| Error / destructive | `destructive` | `#E84C4C` |
| Temperature / moisture | `temp`, `moisture` | `#AB6DD5`, `#51A7B1` |
| Oxygen / CO2 | `o2`, `co2` | `#DBCC41`, `#6CAD6C` |

Brand and sensor shade ramps live in `global.css` and `colors.ts`. Dashboard cards/actions use the existing green gradient (`#C9E752` to `#518251`). Reuse those definitions.

## Typography

Fonts load from `assets/fonts/` through `expo-font`. No Google-font package is needed.

| Utility | Local font |
| --- | --- |
| `font-sans`, `font-normal`, `font-regular` | SpotifyMix-Regular |
| `font-medium` | SpotifyMix-Medium |
| `font-semibold`, `font-bold` | SpotifyMix-Bold |
| `font-extrabold`, `font-black` | SpotifyMix-Extrabold, SpotifyMix-Black |
| `font-light`, `font-thin` | SpotifyMix-Light, SpotifyMix-Thin |

The root layout still registers `Montserrat-*` compatibility aliases, but they point to Spotify Mix files.

### Typography Scale & Line Heights

Always use semantic font tokens rather than arbitrary pixel classes (`text-[14px]` is forbidden). Tokens are configured in `global.css` with unitless line heights to prevent descender clipping on Spotify Mix:

| Token | Size | Line Height | Equivalent |
| --- | --- | --- | --- |
| `text-xs` | `0.75rem` (12px) | `1.35` | Helper text, metadata |
| `text-sm` | `0.875rem` (14px) | `1.4` | Standard UI body, form inputs |
| `text-base` | `1rem` (16px) | `1.45` | Primary body, button labels |
| `text-lg` | `1.125rem` (18px) | `1.4` | Card titles, subheadings |
| `text-xl` | `1.25rem` (20px) | `1.35` | Section headers |
| `text-2xl` | `1.5rem` (24px) | `1.25` | Screen titles, OTP digits |
| `text-3xl` | `2rem` (32px) | `1.2` | Hero metrics, screen hero headers |

### Text Scaling & Accessibility

Use `<Text>` from `@/components/ui/text` instead of raw React Native `<Text>`. It applies `maxFontSizeMultiplier = 1.15` by default to prevent large system accessibility font scales from overflowing cards, badges, and tab bars while keeping text accessible.

## Border Radii & Spacing

Always use existing tokens instead of arbitrary brackets (`rounded-[14px]` or `min-h-[99px]` are forbidden).

### Border Radii
| Token | Value | Common Usage |
| --- | --- | --- |
| `rounded-md` | `0.375rem` (6px) | Badges, small chips |
| `rounded-lg` | `0.5rem` (8px) | Inner card elements, small inputs |
| `rounded-xl` | `0.75rem` (12px) | Action sheets, standard inputs |
| `rounded-2xl` | `1rem` (16px) | Cards, dialog modals, primary surfaces |
| `rounded-3xl` | `1.5rem` (24px) | Large hero containers |
| `rounded-full` | `9999px` | Buttons, avatars, pill badges |

### Spacing Scale
- `--spacing` is set to `0.25rem` (4px).
- Use standard Tailwind utility steps (`p-4` = 16px, `gap-3` = 12px, `h-13` = 52px, `w-66` = 264px).
- Arbitrary dimension classes like `min-h-[99px]` must be mapped to the closest Tailwind spacing step (`min-h-25` = 100px).


## Components and feedback

1. Reuse `Button`, `Input`, and `Card` from `src/components/ui/`. `Button` uses `cva`, rounded-full styling, six variants, four sizes, and `loading`, `disabled` and opt-in `haptic` props. Not every component uses `cva` or `@rn-primitives`.
2. Use `ConfirmModal` for confirmation flows; `isDestructive` controls destructive presentation. Reuse the filter/date-range and birthday sheets for their existing flows.
3. The root mounts a custom Zustand-backed `Toast`; profile/settings use `useToast`. Some auth, batch and BLE paths still use `burnt`. Follow the component used in the flow you edit.
4. `BottomTabBar` uses native views and styles with active/inactive colors and haptics. The installed blur dependency does not mean the bar uses blur.

## Layout and form checks

Use `scrollPaddingBottom` and `floatingBottom` from `useDynamicLayout()` inside tabs; use `stackScrollPadding` outside tabs. These account for device insets and the tab bar.

For form changes, preserve keyboard avoidance, scrollable inputs, tap-to-dismiss behavior and visible submit buttons. Check loading, disabled, validation and dismissal states on a device. `userInterfaceStyle: automatic` is configured, but the audited CSS defines one palette; this is not proof of a complete dark theme.
