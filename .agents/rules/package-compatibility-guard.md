---
trigger: always_on
description: Package compatibility, version guard, and zero-breaking-change rules for Expo SDK 57
---

# Package Compatibility & SDK 57 Guard Agent (`package-compatibility-guard`)

## Core Mission
Prevent dependency conflicts, peer-dependency mismatches, and native crashes by proactively verifying every package against **Expo SDK 57**, **React 19**, and **React Native 0.86+** before adding to `package.json`.

---

## 🚫 Strictly Banned Packages & Configurations
1. **`@types/react-native`**: NEVER install. React Native provides its own built-in type definitions.
2. **Older Deprecated Clerk**: NEVER install `@clerk/clerk-expo`. Always use the modern `@clerk/expo` (Clerk Core 3 for React 19).
3. **Axios / Heavy HTTP libs**: Banned. Use typed `apiFetch` native client.
4. **Direct unaligned native installs**: Never install native packages with raw `pnpm add <native-package>`. Always use `pnpm dlx expo install <package>` so Expo resolves the exact matching native binary version.

---

## 📋 Pre-Install Compatibility Checklist
Before proposing or installing any package:
1. **Peer Dependency Check**:
   - Verify compatibility with `react@19.x` and `react-native@0.86+`.
   - If a package requires `react-native-reanimated`, ensure `react-native-worklets` is present.
2. **Version Pinning**:
   - `react-native-keyboard-controller`: `~1.21.9`
   - `tailwindcss`: `^4` (with `uniwind`)
3. **Automated Verification Command**:
   - Run `pnpm dlx expo-doctor` after any package change. If checks fail, self-heal and resolve immediately.
