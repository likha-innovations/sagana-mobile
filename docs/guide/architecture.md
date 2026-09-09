# Architecture & Layers

Sagana Mobile follows a **role-based flat-layered architecture** designed for modularity, strict separation of concerns, and ease of testing.

---

## 🏛️ Layer Overview

All application source code resides under `src/` and `app/`. The project is intentionally structured to prevent deep nesting and circular dependencies:

```text
sagana-mobile/
├── app/                           # 🧭 Expo Router File-Based Pages & Layouts
├── src/
│   ├── api/                       # 🌐 Typed HTTP Client & REST Endpoints
│   ├── components/                # 🎨 Visual UI Elements & Base Primitives
│   ├── context/                   # 🔐 Global React State Machines
│   ├── hooks/                     # 🎣 TanStack Query & React Hooks
│   ├── lib/                       # 🔌 Native Drivers, Utilities & Logger
│   └── types/                     # 📦 Zod Schemas & Inferred TypeScript Types
└── global.css                     # 🎨 Tailwind CSS v4 / Uniwind Theme Tokens
```

---

## 🧱 Layer Responsibilities

### 1. `app/` (Routing & Views)
- Contains all **Expo Router** file-based routes and nested layouts.
- Organized by layout groups: `(auth)` for public entry flows and `(app)` for protected authenticated views.
- **Rule**: Screens should be thin orchestrators that consume custom hooks from `src/hooks/` and render UI components from `src/components/`.

### 2. `src/api/` (Network & REST)
- Exclusively dedicated to HTTP communication.
- Uses a typed native `apiFetch<T>` wrapper around `fetch` (Zero Axios).
- Handles base URL resolution, JWT token injection, API envelope unwrapping, and throwing structured `ApiError` instances.

### 3. `src/hooks/` (Server State & Query Factories)
- Contains all **TanStack Query v5** queries and mutations.
- Encapsulates caching policies, background refetching, and cache invalidation.
- Connects UI screens to `src/api/` endpoints without leaking fetch logic into components.

### 4. `src/components/` (Presentation & UI)
- Divided into reusable sub-layers:
  - `ui/`: Core primitives built with `@rn-primitives` and `class-variance-authority` (Button, Input, Card).
  - `navigation/`: Custom application navigation bars (FloatingTabBar).
  - `icons/`: Custom vector SVGs (GoogleIcon) and brand iconography.
- **Rule**: Components must be presentational and accept props/callbacks.

### 5. `src/context/` (Global App State)
- Houses global reactive state providers, such as `AuthProvider` (`AuthContext`).
- Manages authentication state restoration, Clerk session lifecycles, and user normalization.

### 6. `src/lib/` (Platform Drivers & Utilities)
- Integrations with device hardware and native SDKs:
  - `auth-token.ts`: Clerk JWT Bearer token resolution for API calls.
  - `token-cache.ts`: Hardware-backed `expo-secure-store` session caching.
  - `logger.ts`: Centralized scoped `Logger` (`createLogger`) formatted with Asia/Manila timestamps and ANSI colors.
  - `utils.ts`: Tailwind classname merging helper (`cn`).

### 7. `src/types/` (Zod Schemas & Contracts)
- Single source of truth for all data models and forms.
- Uses **Zod** runtime schemas (`userSchema`, `signInSchema`, `signUpSchema`, `updateProfileSchema`) to infer strict TypeScript types via `z.infer<typeof schema>`.
- Mirrors backend Prisma schemas 1:1.

---

## 📐 Data Flow Diagram

The following diagram illustrates how user interactions flow through the layers:

```
[ UI Screen (app/(app)/(tabs)/profile.tsx) ]
                     │
                     ▼
[ Custom Hook (src/hooks/use-profile.ts) ]
                     │ (TanStack useQuery / useMutation)
                     ▼
[ API Endpoint (src/api/user.api.ts) ]
                     │
                     ▼
[ Typed Client (src/api/client.ts) ] ◄── Token Provider (src/lib/auth-token.ts)
                     │
                     ▼
[ Backend REST API (/api/users/profile) ]
```
