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
| Machines | Screen → `use-machines.ts` → `machine.api.ts` → `/machines` | Responses are validated by `machineSchema`; registration and updates use camelCase request fields. |
| Batches | Screen → `use-batches.ts` → module-level arrays | Batch creation is local; data resets when the JS runtime reloads. |
| Pairing | Registration → `use-bluetooth.ts` and `/machines/register` | Coordinate the Bluetooth protocol with firmware. |
| Telemetry | App layout → `use-socket.ts` → `lib/socket.ts` | Socket events update the machine query cache. |
| Authentication | `AuthProvider` → Clerk | Read session state through `useAuthContext()`. |

`types/machine.ts` defines machines and current readings; `types/batch.ts` defines batches and feedstocks. Machine and batch objects use `id` for their own identifier and camelCase properties. Fields such as `machineId` and `batchId` identify related records. `types/device.ts` retains telemetry, command and registration contracts.

Use `@/*` for `src/*`, `@/assets/*` for assets, and `~/*` for root-relative imports. Keep reusable presentation in components and shared data operations in hooks/API modules.

See [all routes](/guide/routing-navigation), [screen status](/guide/ui-status), and [state ownership](/core/state-management).
