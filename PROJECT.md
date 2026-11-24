# Project Memory: sagana-mobile

Mobile client for Sagana platform built with Expo SDK 57, React 19, React Native 0.86, Expo Router, Uniwind (Tailwind v4), and Clerk authentication.

## Commands

- `npm run dev` or `npm run start:app` — Start Expo development server
- `npm start` — Start Expo and VitePress documentation concurrently
- `npm run android` — Launch on Android emulator/device
- `npm run ios` — Launch on iOS simulator/device
- `npm run web` — Run web preview
- `npm run typecheck` — TypeScript type checking (`tsc --noEmit`)
- `npm run lint` — ESLint validation and autofix
- `npm run format` — Prettier formatting across codebase
- `npm run docs:dev` — VitePress documentation dev server
- `npx expo-doctor` — Verify native SDK package compatibility and peer dependencies

## Architecture & Conventions

- **Flat-Layered Architecture (`src/`)**:
  - `src/api/`: Typed REST endpoints (`apiFetch<T>`) — native fetch wrapper, unwraps `{ success, data }`, handles Clerk JWT injection. Modules: `user.api.ts`, `barangays.api.ts`, `machine.api.ts`, `notifications.api.ts`.
  - `src/hooks/`: TanStack Query v5 query/mutation hooks (`use-profile.ts`, `use-machines.ts`, `use-socket.ts`, `use-notifications.ts`).
  - `src/components/`: UI primitives (`@rn-primitives` + `cva`), auth widgets, navigation elements (`notification-bell.tsx`).
  - `src/context/`: Centralized state machines (`auth-context.tsx` wrapping Clerk Core).
  - `src/lib/`: Native hardware persistence (`token-cache.ts` using `expo-secure-store`), `socket.ts`, `notifications.ts` (Expo local push alerts & cold launch), logger (`createLogger` / `Logger`), and `cn()` utility.
  - `src/types/`: Single source of truth schemas (`auth.ts`, `api.ts`, `device.ts`) using Zod-first validation and inferred TypeScript types.
- **Routing Hierarchy (`app/`)**:
  - `(auth)`: Public authentication screens (`sign-in`, `sign-up`, `forgot-password`).
  - `(app)`: Protected app layouts and tabs (`(tabs)`: `index`, `profile`, `notifications.tsx`).
  - `_layout.tsx`: Provider pipeline: `GestureHandlerRootView` → `ClerkProvider` → `ClerkLoaded` → `AuthProvider` → `QueryClientProvider`.
  - AuthGate: Redirects unauthenticated users to `/(auth)/sign-in` and authenticated users to `/(app)/(tabs)`.
- **UI & Styling**:
  - Styled with Uniwind (Tailwind CSS v4) utility classes (`className`) and CSS tokens in `global.css`.
  - **Semantic Tokens Only**: Always use design tokens from `global.css` (`@theme`). Arbitrary bracketed pixel classes (`text-[14px]`, `rounded-[14px]`, `min-h-[99px]`) are forbidden. Use semantic typography (`text-xs`..`text-3xl`), border radii (`rounded-md`..`rounded-3xl`, `rounded-card`), and standard Tailwind spacing (`p-4`, `h-12`).
  - **Accessible Text**: Shared UI components use `<Text>` from `@/components/ui/text` which defaults to `maxFontSizeMultiplier = 1.15`.
  - Icons strictly imported from `lucide-react-native` (or custom SVGs in `src/components/icons/`).
  - Safe area metrics handled exclusively via `useSafeAreaInsets()` (legacy `<SafeAreaView>` is banned).
  - Tactile feedback with `expo-haptics` and toast notifications via `burnt`.
  - **Bottom Sheets**: Use `@gorhom/bottom-sheet` (via `BottomSheetModal`) for all bottom sheet modals to ensure smooth animations and native-like physics.
  - **Bottom Tab Bar**: Use `useDynamicLayout()` for `scrollPaddingBottom`, `floatingBottom`, and `stackScrollPadding`. Do not copy fixed tab-clearance values. The maintained UI workflow is `.agents/skills/ui-craftsman/SKILL.md`.
- **Telemetry & Logging**:
  - Centralized logger (`src/lib/logger.ts`) formatted in `Asia/Manila` timezone. No raw `console.log` in production.
- **Git & Commits**:
  - Conventional Commits format (`feat`, `fix`, `docs`, `refactor`, `chore`).
  - Pre-commit verification enforced via Husky (`.husky/pre-commit` runs `npm run lint` and `npm run typecheck`).

## Current Features & Routes

- **Authentication (`/(auth)`)**:
  - Sign in with email/password and OAuth (Google).
  - Multi-step sign up with verification code confirmation.
  - Password reset flow via verification code.
- **Protected Tabs (`/(app)/(tabs)`)**:
  - Dashboard (`index.tsx`): Real-time metrics and quick stats.
  - Profile (`profile.tsx`): User profile view and update.
- **Realtime / IoT & Notifications**:
  - 2-way IoT event bridge (`use-socket.ts`, `src/lib/socket.ts`): Inbound telemetry on topic `sagana/devices/+/telemetry` ➔ event `'telemetry'`; Outbound command dispatch on event `'command'` ➔ topic `sagana/devices/:mac/commands`.
  - Room synchronization: Emits `'join_barangay'` with `user.barangayId` on connect/reconnect.
  - Real-time Notifications: Listens to `'notification'` event, optimistically updates user's notifications list cache, invalidates `unread-count`, and schedules foreground local push alerts via `expo-notifications`.
  - Header Bell (`notification-bell.tsx`): Uniwind-styled badge indicator dynamically bound to unread notification count.
  - Dedicated Notifications Screen (`/(app)/notifications`): Filter by all/unread, infinite scrolling pagination, mark as read on tap, and "Mark all as read" batch action.

## Decisions & Dead-ends

- **Expo SDK 57 & React 19 Alignment**: Never install `@types/react-native` (built-in types used) or deprecated `@clerk/clerk-expo` (use `@clerk/expo` Core 3). Always install native modules via `npx expo install`.
- **Typed Native Fetch**: Replaced Axios with `apiFetch<T>()` to eliminate bundle bloat and ensure zero external HTTP runtime vulnerabilities.
- **Zod-first Types**: Inferred types from Zod schemas to guarantee 1:1 parity with `sagana-backend` DTOs without duplicating interfaces.
- **Semantic Design Tokens over Arbitrary Pixel Brackets**: Replaced all `text-[Npx]` and `rounded-[Npx]` arbitrary classes with semantic Tailwind v4 `@theme` tokens in `global.css` (e.g. `text-xs` through `text-3xl`, `rounded-card`). Arbitrary text classes omitted line heights and clipped font descenders on custom fonts, while semantic tokens provide consistent vertical rhythm and scale cleanly across iOS and Android device densities. Fixed viewport scaling multipliers (`--ui-scale` / `s(...)`) were rejected in favor of native platform density handling.
