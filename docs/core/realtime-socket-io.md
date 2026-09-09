# Real-time WebSocket & Socket.IO

Sagana Mobile uses `socket.io-client` in `src/lib/socket.ts` and `src/hooks/use-socket.ts` for bidirectional real-time communication with the backend telemetry gateway and HiveMQ Cloud.

---

## 🏗️ 2-Way Real-time Architecture

```
[Firmware / ESP32] ──(MQTT: sagana/stream)──> [HiveMQ Cloud] ──> [NestJS Backend] ──(Socket.IO: 'telemetry')──> [Sagana Mobile]
[Sagana Mobile] ──(Socket.IO: 'command')──> [NestJS Backend] ──> [HiveMQ Cloud] ──(MQTT: sagana/commands)──> [Firmware / ESP32]
```

---

## 🌐 Gateway Architecture & Namespace

The backend gateway exposes a dedicated namespace for real-time telemetry:

- **Namespace**: `/telemetry`
- **Full Endpoint**: `${API_BASE_URL}/telemetry` (e.g. `http://localhost:3000/telemetry` or LAN IP)
- **Transports**: `['websocket', 'polling']`

---

## 📡 Event Matrix

### 1. Server ➔ Client Events (Subscribed on Mobile)

| Event Name | Payload Shape | Description |
|---|---|---|
| `'telemetry'` | `TelemetryData \| unknown` | Live hardware sensor readings received from HiveMQ topic `sagana/stream`. |

### 2. Client ➔ Server Events (Emitted by Mobile)

| Event Name | Payload Shape | Description |
|---|---|---|
| `'command'` | `string \| object` | Custom actuator control/instructions forwarded to HiveMQ topic `sagana/commands`. |

---

## 🔌 Socket Instance Management (`src/lib/socket.ts`)

The socket client is managed as a lazy singleton with auto-reconnection and centralized lifecycle logging:

```typescript
import { io, Socket } from 'socket.io-client';
import { getApiBaseUrl } from '@/api/client';

export function getSocket(): Socket {
  // Returns singleton Socket.IO instance configured for /telemetry
}

export function disconnectSocket(): void {
  // Tears down active connection on logout or app reset
}
```

---

## 🎣 React Hook (`useSocket`)

The `useSocket` hook manages subscription lifecycles, incoming telemetry state, and command dispatching:

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
    sendCommand('RELAY_ON');
  };
}
```
