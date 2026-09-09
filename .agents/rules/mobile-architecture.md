---
trigger: always_on
description: Core mobile architecture rules for sagana-mobile covering folder structure, routing, auth, Zod validation, TanStack Query, typed networking, and Uniwind
---

# Mobile Architecture Rules (mobile-architect & auth-guardian)

## 1. Project Directory Structure
All client code inside `sagana-mobile/src/` must adhere strictly to the role-based flat-layered architecture:

```text
src/
├── api/                  # 🌐 STRICTLY REST API & HTTP CALLS
│   ├── client.ts         # Typed apiFetch wrapper around native fetch
│   ├── user.api.ts       # getProfile(), updateProfile()
│   ├── device.api.ts     # (Phase 4) getDevices(), getTelemetry()
│   └── index.ts          # Barrel export for API endpoints
│
├── hooks/                # 🎣 ALL TANSTACK & REACT HOOKS
│   ├── use-profile.ts    # TanStack useQuery / useMutation calling userApi
│   ├── use-devices.ts    # (Phase 4) TanStack useQuery calling deviceApi
│   ├── use-socket.ts     # (Phase 4) WebSocket telemetry subscription hook
│   ├── use-bluetooth.ts  # (Phase 4) BLE scanning & pairing hook
│   └── index.ts          # Barrel export for hooks
│
├── components/           # 🎨 ALL VISUAL UI
│   ├── ui/               # Base primitives (@rn-primitives: button, input, card)
│   ├── auth/             # Auth UI (auth-header.tsx, oauth-buttons.tsx)
│   ├── navigation/       # App navigation (floating-tab-bar.tsx)
│   └── devices/          # (Phase 4) Device UI cards & telemetry charts
│
├── context/              # 🔐 GLOBAL APP STATE MACHINES
│   └── auth-context.tsx  # Centralized AuthProvider & useAuthContext
│
├── lib/                  # 🔌 HARDWARE DRIVERS, NATIVE SDKs & UTILITIES
│   ├── token-cache.ts    # SecureStore hardware persistence
│   ├── socket.ts         # (Phase 4) Socket.IO client instance
│   ├── bluetooth.ts      # (Phase 4) BLE manager (scanning/GATT)
│   ├── logger.ts         # Centralized scoped Logger (createLogger)
│   └── utils.ts          # cn() class helper
│
└── types/                # 📦 CENTRALIZED SCHEMAS & CONTRACTS
    ├── auth.ts           # Prisma User schema & form validators
    ├── api.ts            # ApiResponse<T>, ApiError
    ├── device.ts         # (Phase 4) IoT device models
    └── index.ts          # Barrel export: export * from '@/types'
```

## 2. Routing Hierarchy & Layout Groups
- Always use Expo Router layout groups:
  - `(auth)` for public authentication flows (`sign-in`, `sign-up`, `forgot-password`).
  - `(app)` for protected application routes (`(tabs)`: `index`, `devices`, `analytics`, `profile`).
- The root layout (`app/_layout.tsx`) must wrap all global providers in the following order:
  `GestureHandlerRootView` -> `ClerkProvider` -> `ClerkLoaded` -> `AuthProvider` -> `QueryClientProvider`.
- Use the route guard in `app/_layout.tsx` to automatically redirect unauthenticated users to `(auth)/sign-in` and authenticated users to `(app)/(tabs)`.

## 3. Centralized Authentication (`AuthContext`)
- All authentication actions (`signIn`, `signUp`, `verifyEmail`, `signInWithGoogle`, `resetPassword`, `signOut`) must be consumed via `useAuthContext()` from `@/context/auth-context`.
- Never call low-level Clerk hooks directly in UI screens.
- Persist Clerk JWT tokens in hardware-encrypted storage using `expo-secure-store` via `src/lib/token-cache.ts`.
- Normalized user profile (`user` in `AuthContext`) must mirror the backend Prisma `model User` (`id`, `fullName`, `email`, `contactNumber`, `location`).

## 4. Centralized Types & Zod-First Validation
- All data models, payload contracts, and form schemas must live in **`src/types/`**:
  - `src/types/auth.ts`: Zod schemas (`userSchema`, `signInSchema`, `signUpSchema`, `updateProfileSchema`) and inferred TypeScript types (`User`, `SignInInput`, `SignUpInput`).
  - `src/types/api.ts`: Standard response envelopes (`ApiResponse<T>`, `ApiErrorResponse`, `ApiError`).
  - `src/types/device.ts`: IoT telemetry and device models.
  - `src/types/index.ts`: Barrel export for all types.
- **Single Source of Truth**: Define runtime validation with Zod first, and infer TypeScript types using `z.infer<typeof schema>`. Never duplicate type definitions.

## 5. Server State Management (TanStack Query v5)
- All server data interactions must use `@tanstack/react-query` v5 in `src/hooks/`:
  - `useQuery` for reads and polling (calling `src/api/`).
  - `useMutation` for writes and form submissions (calling `src/api/`).
- Never use raw `useState` + `useEffect` for network data fetching.
- Organize query keys into structured factory objects (e.g. `userKeys = { all: ['user'], profile: () => ['user', 'profile'] }`).
- Invalidate appropriate query caches on mutation success.

## 6. Zero Axios & Typed Native Fetch Wrapper
- All network calls must use `apiFetch<T>()` in `src/api/client.ts`.
- Axios is strictly banned.
- `apiFetch<T>()` must automatically:
  - Unwrap `{ success: true, data: T, timestamp: string }` and return `T`.
  - Throw a structured `ApiError(statusCode, message)` on failure.
  - Inject `Authorization: Bearer <clerk_jwt>` on authenticated requests.

## 7. Styling & Design System (Uniwind)
- Style exclusively using Uniwind utility classes (`className` prop) and semantic theme tokens in `global.css`.
- Use `@rn-primitives` in `src/components/ui/` for core primitives (`Button`, `Input`, `Card`, etc.) with `cva` variants.
- Icons must strictly come from **`lucide-react-native`**.
- Safe area handling must strictly use the **`useSafeAreaInsets()`** hook (legacy `<SafeAreaView>` is banned).

## 8. Centralized Logging & Telemetry
- All application events, auth flows, navigation transitions, and network errors must be logged via `Logger` (`createLogger`) in `src/lib/logger.ts`.
- Format all log timestamps in `Asia/Manila` timezone.
- Never leave raw `console.log` statements in production code.
