# Getting Started

For the planned Node 24.13.0 / pnpm 12.11.2 setup, collaborator onboarding, and EAS migration checklist, see [Team Setup: pnpm, CI, and EAS](/guide/team-setup). CI uses these exact versions; package.json and EAS version pins are still pending.

This guide walks you through setting up the development environment, configuring credentials, and launching the **Sagana Mobile** application on iOS, Android, and web simulators.

---

## 📋 System Requirements

Before starting, ensure your machine satisfies the following prerequisites:

- **Node.js**: `24.13.0` (CI version)
- **Package Manager**: `pnpm` 12.11.2 (CI version; no package.json pin yet)
- **Mobile Runtime**:
  - **Expo development client** on your physical mobile device (required for Bluetooth), OR
  - **Xcode** (iOS Simulator) on macOS, OR
  - **Android Studio** with the Android SDK required by Expo SDK 57
- **Git**: Configured for local commit hooks (Husky).

---

## 🛠️ Step-by-Step Installation

### 1. Clone the Repository

```bash
git clone https://github.com/likha-innovations/sagana-mobile.git
cd sagana-mobile
```

### 2. Install Dependencies

```bash
pnpm install --frozen-lockfile
```

> [!NOTE]
> During installation, Husky pre-commit hooks will automatically be initialized via the `prepare` script.

---

## 🔑 Environment Configuration

Sagana Mobile uses Expo's public environment variables (`EXPO_PUBLIC_*`). Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Open `.env` and configure the following variables:

```ini
# Clerk Authentication Publishable Key (Required)
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key

# Backend API URL (Optional: leave empty for local development)
EXPO_PUBLIC_API_BASE_URL=

# Local Machine IP Address (For connecting physical devices or emulators to local backend)
EXPO_PUBLIC_IP_ADDRESS=192.168.1.100
```

> [!TIP]
> When testing on a **physical device** or **Android emulator**, set `EXPO_PUBLIC_IP_ADDRESS` to your local development machine's LAN IP address (e.g. `192.168.1.x`) so the mobile app can reach the backend server running on port `3000`.

---

## 🚀 Running the Application

Start the Metro development server with Expo CLI:

### Start Development Server
```bash
pnpm run start:app --dev-client
```

### Platform-Specific Launchers

::: code-group

```bash [Android]
# Launch in connected Android emulator or USB device
pnpm run android
```

```bash [iOS]
# Launch in iOS simulator (macOS only)
pnpm run ios
```

```bash [Web]
# Preview in Chrome / Safari
pnpm run web
```

:::

---

## 🧪 Verification & Code Quality

Sagana Mobile maintains strict formatting, type-safety, and linting standards:

```bash
# Verify static TypeScript types without emitting artifacts
pnpm run typecheck

# Lint all code and auto-fix stylistic issues
pnpm run lint

# Format TypeScript, JavaScript, and JSON files with Prettier
pnpm run format
```

---

## 📖 Documentation Site

You can run this VitePress documentation locally:

```bash
# Start VitePress in hot-reload dev mode
pnpm run docs:dev

# Build documentation for static deployment
pnpm run docs:build

# Preview production documentation build
pnpm run docs:preview
```
