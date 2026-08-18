# Getting Started

This guide walks you through setting up the development environment, configuring credentials, and launching the **Sagana Mobile** application on iOS, Android, and web simulators.

---

## 📋 System Requirements

Before starting, ensure your machine satisfies the following prerequisites:

- **Node.js**: `v20.x` or `v22.x` (LTS recommended)
- **Package Manager**: `npm` (v10+) or `pnpm` (v9+)
- **Mobile Runtime**:
  - **Expo Go** app on your physical mobile device, OR
  - **Xcode** (iOS Simulator) on macOS, OR
  - **Android Studio** (Android Emulator with SDK 34/35)
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
npm install
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

```env
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
npm run start
```

### Platform-Specific Launchers

::: code-group

```bash [Android]
# Launch in connected Android emulator or USB device
npm run android
```

```bash [iOS]
# Launch in iOS simulator (macOS only)
npm run ios
```

```bash [Web]
# Preview in Chrome / Safari
npm run web
```

:::

---

## 🧪 Verification & Code Quality

Sagana Mobile maintains strict formatting, type-safety, and linting standards:

```bash
# Verify static TypeScript types without emitting artifacts
npm run typecheck

# Lint all code and auto-fix stylistic issues
npm run lint

# Format TypeScript, JavaScript, and JSON files with Prettier
npm run format
```

---

## 📖 Documentation Site

You can run this VitePress documentation locally:

```bash
# Start VitePress in hot-reload dev mode
npm run docs:dev

# Build documentation for static deployment
npm run docs:build

# Preview production documentation build
npm run docs:preview
```
