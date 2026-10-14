# Routing & Navigation

The manifest declares `expo-router ~57.0.24`, with `expo-router/entry` as the entry point and typed routes enabled. Parenthesized route groups organize layouts without adding URL segments.

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
│   └── uh-oh.tsx
└── (app)/
    ├── _layout.tsx
    ├── edit-profile.tsx
    ├── batch/new.tsx
    ├── machine-registration/new.tsx
    ├── change-password/
    │   ├── _layout.tsx
    │   ├── current-password.tsx
    │   ├── new-password.tsx
    │   └── success.tsx
    └── (tabs)/
        ├── _layout.tsx
        ├── index.tsx            # Home
        ├── profile.tsx          # Account
        ├── history/
        │   ├── _layout.tsx
        │   ├── index.tsx
        │   └── [batchId]/
        │       ├── index.tsx
        │       ├── sensors-history.tsx
        │       └── automation-logs.tsx
        └── machines/
            ├── _layout.tsx
            ├── index.tsx
            └── [id]/
                ├── index.tsx
                ├── settings.tsx
                ├── automation-logs.tsx
                └── sensors-history.tsx
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

History has a nested headerless stack keyed by `batchId`; its tab remains selected on batch details, sensors and logs. Dashboard completed rows open batch details, and completed View All opens History with search and filters cleared. All tabs use outline inactive icons and Figma solid selected icons.

Machines has a nested headerless stack and `popToTopOnBlur: true`. Batch creation, machine registration, profile editing and password changes sit outside the tab group. Batch creation accepts an optional `machineId`; machine detail routes use `id`.

Use `useDynamicLayout().scrollPaddingBottom` for tab content and `stackScrollPadding` for full-screen stack flows. Several existing calls still use `as any`; typed routes being enabled does not mean all navigation is statically checked.

For what each screen does, read [UI & Feature Status](/guide/ui-status).

Machine and completed-batch sensor/log routes render the same two shared history screens with an explicit machine or batch scope. Route wrappers retain focus logging and remain inside their original tab stacks. Machine history includes all recorded machine activity; batch history includes only explicitly assigned records within that batch’s lifetime.
