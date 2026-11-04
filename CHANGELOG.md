# Changelog

All notable changes to the SAGANA Mobile application will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Historical batch sensor graphs with custom date range and interval filters.
- Batch detail screens linking machine occupancy directly to composting progress.

### Fixed
- Added image fallback handling and visual asset mappings for feedstock grid cards.
- Improved loading skeletons and error modal recovery states.

---

## [1.3.0] - 2026-11-03

### Changed
- **BREAKING**: Standardized all machine domain models and mutation payloads to `camelCase` (`macAddress`, `wifiSsid`, `barangayId`, `createdAt`, `lastSeen`, `removedAt`).
- Removed redundant intermediate `toMachine` adapter layer; machine queries now parse backend API responses directly with `machineSchema`.
- Updated `useUpdateMachineWifi` and `useRegisterMachine` mutations to send `camelCase` payloads matching backend DTOs.
- Updated `useSocket` listeners to patch TanStack query cache directly using canonical camelCase keys.

### Fixed
- Added `inactive` state to `machineStatusSchema` enum to prevent client crashes when reading soft-deleted machines.
- Corrected MQTT command response interface property from `deviceId` to `macAddress`.

---

## [1.2.0] - 2026-10-25

### Added
- **Real-Time Telemetry & Status Sync**: `useSocket` hook subscribing to Socket.IO `/telemetry` gateway for 0ms UI updates on machine connectivity.
- Enforced pure WebSocket transport (`transports: ['websocket']`) for stable background socket connections in React Native.
- Machine settings screen (`machines/[id]/settings`) supporting in-app machine renaming and Wi-Fi credential updates.
- Live feedstock catalog integration using `useFeedstocks` query with 1-hour stale cache.

### Fixed
- Handled offline status fallbacks when hardware disconnects unexpectedly.

---

## [1.1.0] - 2026-10-18

### Added
- **BLE Hardware Provisioning**: 5-step machine registration flow (`TurnOnStep`, `ConnectStep`, `WifiCredentialsStep`, `NameMachineStep`, `SuccessStep`).
- Automatic GATT MTU negotiation (512 bytes) preventing packet truncation on notification receipts.
- Hardware handshake verification: writes Base64 credentials and listens for `SUCCESS,<MAC>` notifications on `BLE_NOTIFY_CHARACTERISTIC_UUID`.
- Post-provisioning backend registration binding the physical machine MAC address to the user's barangay.

### Fixed
- Gracefully handled BLE name-write disconnects when the ESP32 shuts down its BLE radio after saving to NVS.

---

## [1.0.0] - 2026-10-06

### Added
- **Foundation**: Expo SDK 57, React Native 0.86, React 19, and Expo Router file-based navigation.
- **Design System**: Uniwind (Tailwind CSS v4 engine), Figma-aligned theme tokens, and custom SVG icons.
- **Authentication**: Multi-step registration, email verification code input, password reset, and Clerk authentication integration.
- **Networking**: Typed `apiFetch` wrapper with automatic Clerk JWT injection, structured `ApiError` handling, and response unwrapping.
- **Logging**: Scoped `createLogger` utility with timestamps formatted in `Asia/Manila` timezone.

