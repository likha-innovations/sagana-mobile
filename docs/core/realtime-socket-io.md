# Real-time WebSocket & Socket.IO

Sagana Mobile uses `socket.io-client` in `src/lib/socket.ts` and `src/hooks/use-socket.ts` for bidirectional real-time communication with the backend telemetry gateway.

---

## 🌐 Gateway Architecture & Namespace

The backend gateway exposes a dedicated namespace for real-time telemetry:

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

The `useSocket` hook manages subscription lifecycles, latency calculation, and real-time state bindings:

```typescript
import { useSocket } from '@/hooks';

export function Dashboard() {
  const {
    isConnected,
    socketId,
    latency,
    latestPong,
    logs,
    sendSocketPing,
    clearLogs,
  } = useSocket();

  // Trigger test ping
  const onPing = () => {
    sendSocketPing('Hello from mobile!');
  };
}
```
