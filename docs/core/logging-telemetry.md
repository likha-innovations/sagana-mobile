# Logging & Telemetry

Sagana Mobile includes a centralized, scoped logging utility (`createLogger`, `Logger`) in `src/lib/logger.ts` for tracking app events, navigation, network diagnostics, and caught exceptions.

---

## 🎨 Terminal Log Output Format

Logs are formatted with ANSI colors, contextual tags, and Philippine Standard Time timestamps for clear readability in Metro / Expo CLI terminals:

```text
[RN] 13:43:40  LOG   [AuthService] User login successful
{
  "userId": "usr_123",
  "role": "farmer"
}
[RN] 13:43:40  INFO  [AuthService] Token refreshed successfully
[RN] 13:43:40  WARN  [AuthService] Slow network detected
{
  "latencyMs": 1420
}
[RN] 13:43:40  ERROR [AuthService] Failed to sync device
Error: BLE disconnect
   ↳ at BleManager.connect (bluetooth.ts:42)
```

### Log Structure Breakdown

| Segment | Example | Color / Style | Notes |
| :--- | :--- | :--- | :--- |
| **PID** | `[RN]` | Match Level | React Native runtime identifier |
| **Timestamp** | `13:43:40` | Match Level | Localized to `Asia/Manila` timezone (24-hour) |
| **Level** | `LOG  `, `INFO `, `WARN `, `ERROR`, `DEBUG`, `VERB ` | Level Color | Aligned to 5 characters |
| **Context** | `[AuthService]` | Yellow (`\x1b[33m`) | Pre-bound from `createLogger('<Context>')` |
| **Message** | `User login successful` | Level Color | Primary log text |
| **Data / Payload** | `{ "userId": "usr_123" }` | Gray (`\x1b[90m`) | Auto-stringified JSON payload |
| **Stack Trace** | `↳ at BleManager.connect` | Red (`\x1b[31m`) | Cleaned Hermes / Node stack filter |

---

## 🚀 Scoped Logger Pattern (`createLogger`)

Instead of repeating context names or manually tagging strings in every log call, instantiate a scoped logger at the top of the file or service module:

```typescript
import { createLogger } from '@/lib/logger';

const logger = createLogger('AuthService');

// Clean method invocations — context is automatically attached
logger.log('User signed in', { id: user.id });
logger.info('Profile retrieved successfully');
logger.warn('Token expires in 5 minutes');
logger.debug('Refreshed token', token);
logger.verbose('Mounted listener');
logger.error('Failed to authenticate', error);
```

You can also pass `LoggerOptions`:

```typescript
const logger = createLogger({
  context: 'TelemetrySync',
  enabled: __DEV__,
});
```

---

## 📋 Log Levels & Methods

| Level | Method | Purpose | Console Level & Color |
| :--- | :--- | :--- | :--- |
| `log` | `logger.log(msg, data?)` | Standard application lifecycle events | `LOG` (Green) |
| `info` | `logger.info(msg, data?)` | General informational events | `INFO` (Cyan) |
| `warn` | `logger.warn(msg, data?)` | Non-fatal warnings and unexpected states | `WARN` (Yellow) |
| `error` | `logger.error(msg, trace?)` | Caught exceptions, API errors, and native failures | `ERROR` (Red) |
| `debug` | `logger.debug(msg, data?)` | Development-only debug traces | `DEBUG` (Magenta) |
| `verbose` | `logger.verbose(msg, data?)` | Fine-grained verbose diagnostics | `VERB` (Cyan) |
| `bootstrap` | `logger.bootstrap(msg, data?)` | App startup and provider initialization | `BOOT` (Magenta) |
| `screen` | `logger.screen(name, params?)` | Expo Router navigation transitions | `NAV` (Cyan) |

---

## 🛡️ Hermes-Clean Error Traces

React Native Hermes stack traces often include 50+ lines of internal framework and bytecode noise. The logger extracts the relevant call frames and formats them with clean trace arrows:

```typescript
try {
  await apiFetch('/devices');
} catch (error) {
  logger.error('Failed to load device list', error);
}
```

---

## 💾 In-Memory Circular Buffer

All log entries are buffered into a global in-memory ring buffer (up to **200 entries**) for troubleshooting or crash export:

```typescript
import { logger } from '@/lib/logger';

// Retrieve recent log history
const entries = logger.getLogs();

// Clear the in-memory buffer
logger.clearLogs();
```
