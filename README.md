# Sagana Mobile

Sagana Mobile is the mobile app for operators of Sagana automated composting machines (AIVSP units) by Likha Innovations.

Operators use the app to monitor composting cycles, check sensor readings, and manage their operator accounts.

## Getting started

### Prerequisites

- Node.js 20 or higher
- npm or pnpm
- Expo Go on iOS or Android, or an emulator / simulator

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create your environment file:
   ```bash
   cp .env.example .env
   ```

3. Configure your `.env` variables:
   ```env
   # Clerk publishable key (required for login and signup)
   EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_key
   ```

4. Start the app:
   ```bash
   npm run start
   ```

Press `a` for Android, `i` for iOS simulator, `w` for web preview, or scan the QR code using Expo Go.

## Commands

| Command | Purpose |
| :--- | :--- |
| `npm run start` | Starts Expo Metro bundler and documentation preview |
| `npm run dev` | Starts Expo Metro bundler directly |
| `npm run android` | Starts Metro and launches the Android emulator |
| `npm run ios` | Starts Metro and launches the iOS simulator |
| `npm run web` | Launches web preview |
| `npm run typecheck` | Checks TypeScript types without building |
| `npm run lint` | Runs ESLint and fixes auto-fixable issues |
| `npm run format` | Formats code with Prettier |

---

License: MIT. Likha Innovations.
