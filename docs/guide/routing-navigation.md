# Routing & Navigation

The manifest declares `expo-router ~57.0.32`, with `expo-router/entry` as the entry point and typed routes enabled. Parenthesized route groups organize layouts without adding URL segments.

## Route tree

```text
app/
├── _layout.tsx
├── +not-found.tsx
├── (auth)/
│   ├── _layout.tsx
│   ├── sign-in.tsx
│   ├── sign-up.tsx
│   ├── forgot-password.tsx
│   ├── barangay-code.tsx
│   ├── onboarding.tsx
│   ├── splash.tsx
│   ├── suspended.tsx
│   └── uh-oh.tsx
└── (app)/
    ├── _layout.tsx
    ├── edit-profile.tsx
    ├── notifications.tsx
    ├── batch/new.tsx
    ├── machine-registration/new.tsx
    ├── change-password/
    │   ├── _layout.tsx
    │   ├── current-password.tsx
    │   ├── new-password.tsx
    │   └── success.tsx
    ├── machines/
    │   ├── [id].tsx                  # Machine details (hoisted to app stack)
    │   └── [id]/
    │       ├── settings.tsx          # Machine settings & Wi-Fi re-provisioning
    │       ├── aeration-settings.tsx # Aeration automation configuration
    │       ├── automation-logs.tsx   # Machine-scoped automation logs
    │       ├── sensors-history.tsx   # Machine-scoped sensor readings
    │       └── collect.tsx           # Harvest & chamber emptying wizard
    ├── history/
    │   ├── [batchId].tsx             # Batch details (hoisted to app stack)
    │   └── [batchId]/
    │       ├── sensors-history.tsx   # Batch-scoped sensor readings
    │       └── automation-logs.tsx   # Batch-scoped automation logs
    └── (tabs)/
        ├── _layout.tsx
        ├── index.tsx                 # Home / Dashboard
        ├── machines.tsx              # Machines list (flat tab root)
        ├── history.tsx               # Completed batches (flat tab root)
        └── profile.tsx               # Account
```

## Startup and guards

`app/_layout.tsx` loads local fonts, then mounts this provider chain:

```text
GestureHandlerRootView
  ClerkProvider → ClerkLoaded → AuthProvider
    QueryClientProvider → BottomSheetModalProvider
      StatusBar + AuthProtectedNavigation + Toast
```

1. Wait for `isLoaded`; if signed in, also wait for the normalized user.
2. Signed-out users outside `(auth)` go to sign-in; that redirect also clears the query cache.
3. Signed-in users without `user.birthday` go to sign-up to complete onboarding.
4. Signed-in users with a birthday leave auth routes for the app tabs.

The protected group also checks the session and birthday. The birthday check is the current completion gate, not comprehensive profile validation.

## Navigation behavior

The tabs display **Home**, **Machines**, **History**, and **Account**. `BottomTabBar` in `src/components/navigation/bottom-tab-bar.tsx` renders icons, labels, active colors, safe-area spacing and native haptics. It does not currently use `expo-blur`.

All tabs are flat root screens within `(tabs)` without nested stack navigators. This eliminates cross-tab stack pollution, tab hijacking, and leaking tab bars. Tapping any tab in the bottom bar always mounts its clean list root.

Machine detail routes (`machines/[id].tsx` and `machines/[id]/*`) and batch detail routes (`history/[batchId].tsx` and `history/[batchId]/*`) sit on the parent `(app)` stack outside the tab group. When entered, detail screens slide full-screen above the tab bar, naturally concealing bottom navigation.

Detail screens and headers (`HistoryHeader`) implement safe fallback navigation: when cold-launched via deep links or push notifications, back buttons verify `router.canGoBack()` and fallback to `/(app)/(tabs)/machines` or `/(app)/(tabs)/history` instead of freezing or failing.

Use `useDynamicLayout().scrollPaddingBottom` for tab content and `stackScrollPadding` for full-screen stack flows.

For what each screen does, read [UI & Feature Status](/guide/ui-status).

Machine and completed-batch sensor/log routes render the same two shared history screens with an explicit machine or batch scope. Machine history includes all recorded machine activity; batch history includes only explicitly assigned records within that batch’s lifetime.

## Dev Shortcuts (`expo-dev-client`)

`src/dev/dev-shortcuts.ts` registers deep-link shortcuts and `/_sitemap` in the Expo Dev Client menu so you can jump directly to nested screens during local development. `app/_layout.tsx` mounts `useDevShortcuts()` inside `AuthProtectedNavigation`.

### Activation

1. Set `EXPO_PUBLIC_IS_DEV=true` in `.env.local` (ignored by git via `.env*.local`; see [Environment Variables](/reference/env-vars)).
2. Restart Metro with `pnpm expo start --dev-client --clear` so Expo inlines the updated `EXPO_PUBLIC_*` value.
3. Open the Expo Dev Menu in a native `expo-dev-client` build:
   - **Android:** Shake the device, press `Ctrl + M` (Windows/Linux) or `Cmd + M` (macOS) in the emulator, run `adb shell input keyevent 82`, or press `m` in the Metro terminal.
   - **iOS:** Shake the device, press `Ctrl + Cmd + Z` or `Cmd + D` in the Simulator, or press `m` in the Metro terminal.
4. Select any `Dev: ...` item to collapse the menu automatically (`shouldCollapse: true`) and navigate via `router.push(...)`.

### Adding routes to `DEV_SHORTCUTS`

Edit `DEV_SHORTCUTS` in `src/dev/dev-shortcuts.ts` using the route path under `app/` (without `.tsx`):

```ts
export const DEV_SHORTCUTS: DevShortcut[] = [
  {
    name: 'Dev: Machine Aeration Settings',
    pathname: '/(app)/machines/[id]/aeration-settings',
    params: { id: '1' },
  },
  // ...
  {
    name: 'Dev: Open Sitemap',
    pathname: '/_sitemap',
  },
];
```

### Rules and production isolation

- **Release isolation:** `IS_DEV_MODE` requires `__DEV__ && process.env.EXPO_PUBLIC_IS_DEV === 'true'`, and `require('expo-dev-client')` is loaded lazily inside `if (__DEV__)` so Metro dead-code-eliminates the utility in production builds even if `EXPO_PUBLIC_IS_DEV=true` is present.
- **Native dev-client only:** Expo Go and web (`Platform.OS === 'web'`) safely no-op.
- **Auth guards stay active:** `AuthProtectedNavigation` is never bypassed. `/(app)/...` shortcuts require a signed-in session, and `/(auth)/...` shortcuts require being signed out. `/_sitemap` opens regardless to inspect available routes.
