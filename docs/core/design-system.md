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

## Components and feedback

1. Reuse `Button`, `Input`, and `Card` from `src/components/ui/`. `Button` uses `cva`, rounded-full styling, six variants, four sizes, and `loading`, `disabled` and opt-in `haptic` props. Not every component uses `cva` or `@rn-primitives`.
2. Use `ConfirmModal` for confirmation flows; `isDestructive` controls destructive presentation. Reuse the filter/date-range and birthday sheets for their existing flows.
3. The root mounts a custom Zustand-backed `Toast`; profile/settings use `useToast`. Some auth, batch and BLE paths still use `burnt`. Follow the component used in the flow you edit.
4. `BottomTabBar` uses native views and styles with active/inactive colors and haptics. The installed blur dependency does not mean the bar uses blur.

## Layout and form checks

Use `scrollPaddingBottom` and `floatingBottom` from `useDynamicLayout()` inside tabs; use `stackScrollPadding` outside tabs. These account for device insets and the tab bar.

For form changes, preserve keyboard avoidance, scrollable inputs, tap-to-dismiss behavior and visible submit buttons. Check loading, disabled, validation and dismissal states on a device. `userInterfaceStyle: automatic` is configured, but the audited CSS defines one palette; this is not proof of a complete dark theme.
