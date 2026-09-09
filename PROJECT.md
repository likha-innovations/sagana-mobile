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
  - `src/api/`: Typed REST endpoints (`apiFetch<T>`) — native fetch wrapper, unwraps `{ success, data }`, handles Clerk JWT injection. Axios is strictly banned.
  - `src/hooks/`: TanStack Query v5 query/mutation hooks (`use-profile.ts`, `use-socket.ts`).
  - `src/components/`: UI primitives (`@rn-primitives` + `cva`), auth widgets, and navigation elements.
  - `src/context/`: Centralized state machines (`auth-context.tsx` wrapping Clerk Core).
  - `src/lib/`: Native hardware persistence (`token-cache.ts` using `expo-secure-store`), `socket.ts`, logger (`createLogger` / `Logger`), and `cn()` utility.
  - `src/types/`: Single source of truth schemas (`auth.ts`, `api.ts`, `device.ts`) using Zod-first validation and inferred TypeScript types.
- **Routing Hierarchy (`app/`)**:
  - `(auth)`: Public authentication screens (`sign-in`, `sign-up`, `forgot-password`).
  - `(app)`: Protected app layouts and tabs (`(tabs)`: `index`, `profile`).
  - `_layout.tsx`: Provider pipeline: `GestureHandlerRootView` → `ClerkProvider` → `ClerkLoaded` → `AuthProvider` → `QueryClientProvider`.
  - AuthGate: Redirects unauthenticated users to `/(auth)/sign-in` and authenticated users to `/(app)/(tabs)`.
- **UI & Styling**:
  - Styled with Uniwind (Tailwind CSS v4) utility classes (`className`) and CSS tokens in `global.css`.
  - Icons strictly imported from `lucide-react-native` (or custom SVGs in `src/components/icons/`).
  - Safe area metrics handled exclusively via `useSafeAreaInsets()` (legacy `<SafeAreaView>` is banned).
  - Tactile feedback with `expo-haptics` and toast notifications via `burnt`.
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
- **Realtime / IoT**:
  - 2-way IoT event bridge (`use-socket.ts`, `src/lib/socket.ts`): Inbound telemetry on topic `sagana/stream` ➔ event `'telemetry'`; Outbound command dispatch on event `'command'` ➔ topic `sagana/commands`.

## Decisions & Dead-ends

- **Expo SDK 57 & React 19 Alignment**: Never install `@types/react-native` (built-in types used) or deprecated `@clerk/clerk-expo` (use `@clerk/expo` Core 3). Always install native modules via `npx expo install`.
- **Typed Native Fetch**: Replaced Axios with `apiFetch<T>()` to eliminate bundle bloat and ensure zero external HTTP runtime vulnerabilities.
- **Zod-first Types**: Inferred types from Zod schemas to guarantee 1:1 parity with `sagana-backend` DTOs without duplicating interfaces.
