# Architecture & Folder Structure

Audited against mobile commit `38b132d` on 13 October 2026. Paths are relative to `sagana-mobile`.

## Where to work

```text
sagana-mobile/
├── app/                       # Expo Router screens and layouts
│   ├── (auth)/                # Sign-in, sign-up, reset, fallback
│   ├── (app)/                 # Protected screens
│   │   ├── (tabs)/            # Home, Machines stack, Account
│   │   ├── batch/             # New compost batch wizard
│   │   ├── machine-registration/ # BLE registration wizard
│   │   ├── change-password/   # Current, new, success
│   │   └── edit-profile.tsx
│   ├── _layout.tsx            # Providers, fonts, auth routing
│   └── +not-found.tsx
├── src/
│   ├── api/                   # client, user, barangays, device commands
│   ├── components/
│   │   ├── auth/              # OTP, birthday/policy sheets, form helpers
│   │   ├── dashboard/         # Metric cards and quick actions
│   │   ├── devices/           # Machine cards, graphs, registration steps
│   │   ├── icons/             # Custom SVG components
│   │   ├── navigation/        # bottom-tab-bar.tsx
│   │   └── ui/                # Buttons, inputs, modals, filters, toast
│   ├── constants/             # colors.ts, layout.ts
│   ├── context/               # auth-context.tsx
│   ├── data/                  # data.json: demo fixtures
│   ├── hooks/                 # Profile, machines, batches, BLE, Wi-Fi, socket
│   ├── lib/                   # BLE/socket drivers, tokens, logger, utilities
│   ├── types/                 # auth, api, barangay, device, machine, batch
│   └── uniwind-types.d.ts     # Metro-generated Uniwind declarations
├── assets/                    # Local fonts, logo and images
├── docs/                      # This VitePress site
├── .github/workflows/         # mobile-quality.yml
├── .husky/                    # Pre-commit lint and typecheck
├── app.json                   # App version, native plugins and permissions
├── eas.json                   # Development, preview, production profiles
├── global.css                 # Tailwind v4 / Uniwind theme and fonts
├── metro.config.js            # Uniwind integration
├── babel.config.js            # babel-preset-expo
├── uniwind-env.d.ts           # Uniwind types and CSS module declaration
├── tsconfig.json              # Strict TypeScript and aliases
├── package.json               # Dependencies and commands
├── pnpm-workspace.yaml        # Workspace, overrides, build policy
└── pnpm-lock.yaml             # Saved dependency graph
```

## Data boundaries

| Area | Current path | Contributor rule |
| --- | --- | --- |
| Profile | Screen → `use-profile.ts` → `user.api.ts` → `/me` | Keep REST calls in `src/api`; update the profile query after saving. |
| Barangays | Screen → `use-barangays.ts` → `barangays.api.ts` | Reuse the shared query for location selectors. |
| Machines and batches | Screen → hooks → `data.json` and module-level arrays | These are mock stores. Changes reset when the JS runtime reloads. |
| Pairing | Registration → `use-bluetooth.ts` → `lib/bluetooth.ts` | Coordinate the protocol with firmware; backend registration is pending. |
| Telemetry | `use-socket.ts` → `lib/socket.ts` | Infrastructure exists, but current screens do not call the hook. |
| Authentication | `AuthProvider` → Clerk | Read session state through `useAuthContext()`. |

`types/machine.ts` owns machine status, readings, logs and history. `types/batch.ts` owns batches and feedstocks. `types/device.ts` retains telemetry, command and registration contracts. These are client contracts; do not assume every field matches Prisma or every response is runtime-validated.

Use `@/*` for `src/*`, `@/assets/*` for assets, and `~/*` for root-relative imports. Keep reusable presentation in components and shared data operations in hooks/API modules.

See [all routes](/guide/routing-navigation), [screen status](/guide/ui-status), and [state ownership](/core/state-management).
