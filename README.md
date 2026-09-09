# 🌿 Sagana Mobile

> Next-generation mobile client for the **Sagana** smart aquaculture and IoT telemetry ecosystem by **Likha Innovations**.

---

## 📱 Overview

**Sagana Mobile** delivers real-time monitoring, telemetry control, and account management for modern aquaculture operators. Built with **Expo SDK 57**, **React Native 0.86**, and **React 19**, it utilizes a streamlined architecture designed for speed, security, and hardware-accelerated user experiences.

---

## ⚡ Tech Stack & Architecture

| Layer | Technology |
| :--- | :--- |
| **Framework** | [Expo SDK 57](https://docs.expo.dev/) (Managed Workflow) with `expo-router` |
| **Runtime** | [React Native 0.86](https://reactnative.dev/) & [React 19](https://react.dev/) |
| **Styling & Theme** | [Uniwind](https://github.com/uniwind) + [Tailwind CSS v4](https://tailwindcss.com/) with CSS theme variables |
| **Components** | [@rn-primitives](https://rnprimitives.com/) + `class-variance-authority` (cva) |
| **Authentication** | [@clerk/expo](https://clerk.com/) (Clerk Core 3) with hardware-backed [expo-secure-store](https://docs.expo.dev/versions/latest/sdk/securestore/) session caching |
| **Server State** | [@tanstack/react-query v5](https://tanstack.com/query/latest) with structured query key factories |
| **Validation** | [Zod](https://zod.dev/) & [React Hook Form](https://react-hook-form.com/) |
| **Typography & Icons** | `@expo-google-fonts/montserrat`, [lucide-react-native](https://lucide.dev/), `react-native-svg` |
| **Feedback & UX** | `expo-haptics`, [Burnt](https://burnt.dev/) native toasts, `react-native-keyboard-controller` |
| **Quality** | ESLint 10, Prettier, TypeScript strict mode, Husky pre-commit hooks |

---

## 🚀 Features Implemented

### 🔐 Authentication & Session Management
- **Hardware-Encrypted Session Persistence**: Clerk JWT sessions persisted via `expo-secure-store` with encrypted keychain caching.
- **Centralized Auth Machine (`AuthContext`)**: Single reactive provider managing sign-in, sign-up, sign-out, session restoration, and user normalization.
- **Email & Password Authentication**: Complete validation using Zod schemas with inline error states and tactile feedback.
- **6-Digit OTP Email Verification**: Interactive step-by-step verification modal with auto-focus and resend timers.
- **Self-Service Password Reset**: Secure password recovery flow powered by email reset codes.
- **Google Single Sign-On (SSO)**: Native browser OAuth handshakes using `expo-web-browser` and `expo-auth-session`.
- **Automatic JWT Bearer Injection**: Custom `apiFetch<T>` automatically attaches Clerk Bearer tokens to all authenticated outgoing requests.

### 🧭 Navigation & Layout System
- **Expo Router Groups**: Separation of public auth flows `(auth)` and protected application tabs `(app)`.
- **Global Route Guarding**: Root layout state listener automatically redirecting unauthenticated traffic to `/sign-in` and authenticated sessions to `/(tabs)`.
- **Floating Glassmorphic Tab Bar**: Custom tab navigation bar with safe-area handling and backdrop blur.
- **Profile & Account Management**: Profile viewing and editing synced with backend database records via TanStack Query.

### 🎨 Design System & Accessibility
- **Semantic Theme Engine**: Full light and dark mode support using CSS variables (`--primary: 152 76% 36%`).
- **Responsive Inset Handling**: Strict utilization of `useSafeAreaInsets()` preventing display notches and home indicators overlap.
- **Native Keyboard Avoidance**: Seamless input scrolling and dismissals via `react-native-keyboard-controller`.
- **Centralized Scoped Logger**: `createLogger` / `Logger` utility formatting events and network errors in `Asia/Manila` timezone with ANSI terminal colors.

---

## 📁 Directory Structure

```text
sagana-mobile/
├── app/                           # 🧭 Expo Router file-based routes
│   ├── (app)/                     # Protected routes
│   │   ├── (tabs)/                # Bottom tab navigators
│   │   │   ├── index.tsx          # Dashboard / Home tab
│   │   │   ├── profile.tsx        # User profile & settings
│   │   │   └── _layout.tsx        # Tabs layout with floating bar
│   │   └── _layout.tsx            # Protected layout guard
│   ├── (auth)/                    # Public authentication routes
│   │   ├── sign-in.tsx            # Sign in screen
│   │   ├── sign-up.tsx            # Sign up + OTP verification
│   │   ├── forgot-password.tsx    # Password reset flow
│   │   └── _layout.tsx            # Auth stack layout
│   ├── +not-found.tsx             # 404 fallback screen
│   └── _layout.tsx                # Root layout (Providers & Auth Guard)
│
├── src/
│   ├── api/                       # 🌐 Typed HTTP Client & REST Endpoints
│   │   ├── client.ts              # Native apiFetch wrapper (Zero Axios)
│   │   ├── user.api.ts            # Profile endpoints (get/update)
│   │   └── index.ts               # Barrel exports
│   │
│   ├── components/                # 🎨 Visual UI Components
│   │   ├── icons/                 # Brand SVG icons (GoogleIcon, etc.)
│   │   ├── navigation/            # Navigation UI (FloatingTabBar)
│   │   └── ui/                    # Base primitives (@rn-primitives: Button, Input)
│   │
│   ├── context/                   # 🔐 Global State Machines
│   │   └── auth-context.tsx       # Centralized AuthProvider & useAuthContext
│   │
│   ├── hooks/                     # 🎣 TanStack Query & React Hooks
│   │   ├── use-profile.ts         # User profile queries & mutations
│   │   └── index.ts               # Barrel exports
│   │
│   ├── lib/                       # 🔌 Native Utilities & Drivers
│   │   ├── auth-token.ts          # Clerk JWT token provider
│   │   ├── logger.ts              # Centralized scoped Logger (createLogger)
│   │   ├── token-cache.ts         # SecureStore token storage
│   │   └── utils.ts               # Classname merging helper (cn)
│   │
│   └── types/                     # 📦 Schemas & Type Contracts
│       ├── api.ts                 # ApiResponse<T>, ApiError
│       ├── auth.ts                # Zod schemas & inferred user types
│       └── index.ts               # Barrel exports
│
├── assets/                        # 🖼️ Static assets, app icons, and splashes
├── global.css                     # 🎨 Tailwind CSS v4 & theme variables
└── package.json
```

---

## 🛠️ Getting Started

### Prerequisites

- **Node.js**: `v20.x` or higher
- **Package Manager**: `npm` or `pnpm`
- **Expo Go** or **Expo Development Client** installed on your iOS/Android device or simulator.

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/likha-innovations/sagana-mobile.git
cd sagana-mobile
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory (refer to [.env.example](file:///.env.example)):

```bash
cp .env.example .env
```

Set the appropriate keys:

```env
# Clerk Authentication Publishable Key
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key

# Backend API Endpoint (Optional: leave empty for local development)
EXPO_PUBLIC_API_BASE_URL=

# Local Machine IP Address (For connecting to local backend over LAN/Wi-Fi)
EXPO_PUBLIC_IP_ADDRESS=192.168.1.100
```

### 3. Start Development Server

```bash
# Start Metro bundler
npm run start

# Launch on Android simulator/device
npm run android

# Launch on iOS simulator
npm run ios

# Launch in web browser
npm run web
```

---

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run start` | Starts the Expo development server and Metro bundler |
| `npm run android` | Starts Metro and attempts to launch the Android emulator |
| `npm run ios` | Starts Metro and attempts to launch the iOS simulator |
| `npm run typecheck` | Runs static type verification with `tsc --noEmit` |
| `npm run lint` | Lints and automatically fixes formatting issues via ESLint |
| `npm run format` | Formats all TypeScript, JavaScript, and JSON files via Prettier |

---

## 🔒 API Contracts & Error Handling

All backend communication adheres to the **Unified API Envelope**:

```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-08-18T13:50:00.000Z"
}
```

The typed `apiFetch<T>()` client automatically unwraps `data` for React hooks and components. If the server returns a non-2xx status, a structured `ApiError` is raised and presented using `burnt` native toasts.

---

## 🗺️ Roadmap & Upcoming Milestones

- [x] **Phase 1**: Project initialization, Uniwind setup, typography & design system tokens.
- [x] **Phase 2**: Clerk authentication, SecureStore hardware caching, and Google SSO.
- [x] **Phase 3**: User profile management, TanStack Query v5 server state, and floating tab navigation.
- [ ] **Phase 4**: Real-time IoT Device Telemetry, WebSocket feeds, and Bluetooth Low Energy (BLE) sensor provisioning.
- [ ] **Phase 5**: Offline telemetry caching, push notifications, and production EAS builds.

---

## 👥 Authors & License

Developed with 💚 by **Likha Innovations**.  
Licensed under the [MIT License](file:///LICENSE).
