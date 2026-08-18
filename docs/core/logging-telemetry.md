# Logging & Telemetry

Sagana Mobile includes a centralized, lightweight logging utility (`MobileLogger`) in `src/lib/logger.ts` for tracking app events, navigation, and API diagnostics.

---

## 🕒 Asia/Manila Timezone Formatting

To match operational team operations in the Philippines, all timestamps are localized to `Asia/Manila` time (`Intl.DateTimeFormat`):

```text
[8/18/2026, 9:50:12 PM] [Auth] [INFO] User session restored successfully
```

---

## 📋 Log Levels & Methods

| Level | Method | Purpose | Console Prefix |
| :--- | :--- | :--- | :--- |
| `bootstrap` | `logger.bootstrap(msg, ctx)` | App initialization and early startup | 🚀 `BOOTSTRAP` |
| `screen` | `logger.screen(name, params)` | Expo Router screen navigation events | 📱 `SCREEN` |
| `info` | `logger.info(msg, ctx, data)` | General informational events | ℹ️ `INFO` |
| `log` | `logger.log(msg, ctx, data)` | Standard application logs | 📝 `LOG` |
| `warn` | `logger.warn(msg, ctx, data)` | Non-fatal warnings | ⚠️ `WARN` |
| `error` | `logger.error(msg, err, ctx)` | Caught errors and failure traces | ❌ `ERROR` |
| `debug` | `logger.debug(msg, ctx, data)` | Development-only debug traces | 🔍 `DEBUG` |

---

## 💾 In-Memory Circular Buffer

`MobileLogger` stores the most recent **200 log entries** in an in-memory buffer.

```typescript
// Retrieve log history for diagnostics or support export
const logs = logger.getLogs();

// Clear buffer
logger.clearLogs();
```

---

## 🛠️ Usage Example

```typescript
import { logger } from '@/lib/logger';

// Logging a screen transition
logger.screen('SignInScreen');

// Logging an authentication event
logger.info('User successfully authenticated via Google SSO', 'AuthContext');

// Logging a caught error
try {
  await apiFetch('/devices');
} catch (error) {
  logger.error('Failed to fetch telemetry data', error, 'TelemetryHook');
}
```
