# Routing & Navigation

Sagana Mobile uses **Expo Router v4** (powered by `react-navigation`) with file-based routing and layout groups.

---

## 🗂️ Route Hierarchy

The directory structure inside `app/` defines the navigation hierarchy:

```text
app/
├── (app)/                         # 🔒 Protected Group
│   ├── (tabs)/                    # 📑 Tab Navigator
│   │   ├── index.tsx              # Home / Dashboard tab
│   │   ├── profile.tsx            # User Profile tab
│   │   └── _layout.tsx            # Tabs Layout (Floating Bar)
│   └── _layout.tsx                # Protected Stack Layout
│
├── (auth)/                        # 🔓 Public Auth Group
│   ├── sign-in.tsx                # Sign In Screen
│   ├── sign-up.tsx                # Sign Up + 6-digit OTP verification
│   ├── forgot-password.tsx        # Password Reset Flow
│   └── _layout.tsx                # Auth Stack Layout
│
├── +not-found.tsx                 # 🚫 404 Fallback Screen
└── _layout.tsx                    # 🌐 Root Layout & Global Providers
```

---

## 🛡️ Root Layout & Auth Guards

The root layout at `app/_layout.tsx` coordinates provider hierarchy and automatic route guarding.

### Provider Chain Order

Providers are wrapped in strict dependency order:

```tsx
<GestureHandlerRootView style={{ flex: 1 }}>
  <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
    <ClerkLoaded>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <RootLayoutNav />
        </QueryClientProvider>
      </AuthProvider>
    </ClerkLoaded>
  </ClerkProvider>
</GestureHandlerRootView>
```

### Reactive Route Guard

A reactive `useEffect` watches the authentication state (`isAuthenticated` and `isLoading`) and automatically redirects users:

- If **unauthenticated** and trying to access `(app)` ➔ redirects to `/(auth)/sign-in`.
- If **authenticated** and currently on `(auth)` ➔ redirects to `/(app)/(tabs)`.

```tsx
useEffect(() => {
  if (isLoading) return;

  const inAuthGroup = segments[0] === '(auth)';

  if (!isAuthenticated && !inAuthGroup) {
    router.replace('/(auth)/sign-in');
  } else if (isAuthenticated && inAuthGroup) {
    router.replace('/(app)/(tabs)');
  }
}, [isAuthenticated, isLoading, segments]);
```

---

## 🚀 Floating Tab Bar Navigation

The main app tab navigator utilizes a custom floating tab bar component (`FloatingTabBar`) located at `src/components/navigation/floating-tab-bar.tsx`.

### Key Capabilities

1. **Glassmorphic Effect**: Uses `expo-blur` and backdrop filters for a modern, frosted appearance.
2. **Safe Area Insets**: Computes bottom spacing dynamically via `useSafeAreaInsets()` so the floating bar stays elevated above home indicator bars across different device form factors.
3. **Tactile Haptic Feedback**: Triggers `Haptics.impactAsync(ImpactFeedbackStyle.Light)` on tab selection.
4. **Animated Active Indicators**: Highlights active tabs with emerald branding (`bg-primary`).
