# Real-time WebSocket & Socket.IO

Sagana Mobile uses `socket.io-client` in `src/lib/socket.ts` and `src/hooks/use-socket.ts` for bidirectional real-time communication with the backend telemetry gateway.

---

## 🌐 Gateway Architecture & Namespace

The backend gateway exposes a dedicated namespace for telemetry and protocol diagnostics:

- **Namespace**: `/telemetry`
- **Full Endpoint**: `${API_BASE_URL}/telemetry` (e.g. `http://localhost:3000/telemetry` or `http://192.168.x.x:3000/telemetry`)
- **Transports**: `['websocket', 'polling']`

---

## 📡 Event Matrix

### 1. Client ➔ Server Events (Emitted by Mobile)

| Event Name | Payload Shape | Description |
|---|---|---|
| `'ping'` | `{ message?: string, clientTimestamp: string }` | Sends ping to gateway; server responds with `'pong'` |

### 2. Server ➔ Client Events (Subscribed on Mobile)

| Event Name | Payload Shape | Description |
|---|---|---|
| `'pong'` | `{ status: 'ok', source: string, received: unknown, timestamp: string }` | Gateway reply to `'ping'` (used to compute round-trip latency) |
| `'mqtt:ping'` | `{ topic: string, message: string, timestamp: string }` | Broadcast when message is received on MQTT `sagana/ping` |
| `'mqtt:pong'` | `{ topic: string, message: string, timestamp: string }` | Broadcast when response is published to MQTT `sagana/pong` |
| `'telemetry:reading'` | `{ deviceId: string, sensorId: string, value: number, unit: string, batchId?: string, timestamp: string }` | Live sensor reading from IoT nodes |
| `'device:status'` | `{ deviceId: string, status: string, processingStage?: string, timestamp: string }` | Live device state update |

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

The `useSocket` hook manages subscription lifecycles, latency calculation, and state bindings:

```typescript
import { useSocket } from '@/hooks';

export function Dashboard() {
  const {
    isConnected,
    socketId,
    latency,
    latestPong,
    latestMqtt,
    logs,
    sendSocketPing,
    sendMqttCommand,
    clearLogs,
  } = useSocket();

  // Trigger test ping
  const onPing = () => {
    sendSocketPing('Hello from mobile!');
  };
}
```

---

## 🌉 MQTT Broker Bridging

The backend `TelemetryGateway` acts as a WebSocket bridge for MQTT broker events. When external IoT devices publish to `sagana/ping` or `sagana/pong`, the backend intercepts and broadcasts them over Socket.IO as `mqtt:ping` and `mqtt:pong`, enabling mobile clients to monitor MQTT streams without maintaining raw TCP/MQTT sockets.
