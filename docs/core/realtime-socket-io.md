# Real-time WebSocket & Socket.IO

Sagana Mobile provides `socket.io-client` infrastructure in `src/lib/socket.ts` and `src/hooks/use-socket.ts` for communication with the backend telemetry gateway. MQTT communication is managed entirely on the backend and firmware layer.

::: tip ⚡ Global Gateway Subscription
`useSocket()` is mounted at the root layout in `app/(app)/_layout.tsx`. As long as the operator is signed in, the client maintains a persistent WebSocket connection, streaming live status transitions and cache invalidations across all views with 0ms UI lag.
:::

---

## 🏗️ 2-Way Real-time Architecture

```
[Firmware / ESP32] ──(MQTT: sagana/devices/:mac/telemetry)──> [HiveMQ Cloud] ──> [NestJS Backend] ──(Socket.IO: 'telemetry')──> [Sagana Mobile]
[Sagana Mobile] ──(Socket.IO: 'command')──> [NestJS Backend] ──> [HiveMQ Cloud] ──(MQTT: sagana/devices/:mac/commands)──> [Firmware / ESP32]
```

---

## 🌐 Gateway Architecture & Namespace

The backend gateway exposes a dedicated namespace for real-time telemetry:

- **Namespace**: `/telemetry`
- **Full Endpoint**: `${API_BASE_URL}/telemetry` (e.g. `http://localhost:3000/telemetry` or local LAN IP)
- **Transports**: `['websocket']` *(enforced pure WebSocket transport for React Native stability)*

---

## 📡 Event Matrix

### 1. Server ➔ Client Events (Subscribed on Mobile)

| Event Name | Payload Shape | Description & TanStack Cache Sync |
| :--- | :--- | :--- |
| **`telemetry`** | `TelemetryData \| Record<string, unknown>` | Live sensor readings. Updates latest telemetry readings in cache for active machine views. |
| **`status`** | `{ machineId?: string; macAddress?: string; status?: string }` | Machine connectivity changes (`online`/`active` vs `offline`). Directly flips `machine.status` in the `['machines']` list query cache with zero latency. |
| **`machine_added`** | `{ machineId: string; name: string; macAddress: string; barangayId?: string; wifiSsid?: string \| null; status?: string; createdAt?: string }` | Emitted when a new machine is registered or re-provisioned. Prepends/appends the machine into the `['machines']` list cache and invalidates query. |
| **`machine_updated`** | `{ machineId: string; name?: string; barangayId?: string }` | Emitted on machine rename or config update. Patches name in both list and detail query cache. |
| **`machine_removed`** | `{ machineId: string; barangayId?: string }` | Emitted on soft-deletion. Removes machine from the `['machines']` list cache immediately. |

### 2. Client ➔ Server Events (Emitted by Mobile)

| Event Name | Payload Shape | Description |
| :--- | :--- | :--- |
| **`command`** | `string \| object` | Custom actuator control/instructions forwarded to HiveMQ command topic for the machine. |

---

## 🔌 Socket Instance Management (`src/lib/socket.ts`)

The socket client is managed as a lazy singleton with auto-reconnection and centralized lifecycle logging:

```typescript
import { io, Socket } from 'socket.io-client';
import { getApiBaseUrl } from '@/api/client';

export function getSocket(): Socket {
  // Configured with pure websocket transport:
  // transports: ['websocket']
}

export function disconnectSocket(): void {
  // Tears down active connection on logout or app reset
}
```

---

## 🎣 React Hook (`useSocket`)

The `useSocket` hook manages subscription lifecycles, incoming telemetry state, TanStack cache patching, and command dispatching:

```typescript
import { useSocket } from '@/hooks';

export function Dashboard() {
  const {
    isConnected,
    socketId,
    latestTelemetry,
    logs,
    sendCommand,
    clearLogs,
  } = useSocket();

  // Send an actuator command to firmware
  const onToggleRelay = () => {
    sendCommand({ action: 'RELAY_ON' });
  };
}
```
