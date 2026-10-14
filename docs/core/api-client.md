# API Client & Contracts

`src/api/client.ts` wraps native `fetch` with typed helpers: `api.get`, `post`, `patch`, `put` and `delete`.

## Current endpoints

Paths are relative to the configured API base URL.

| Wrapper | Endpoint | Screen integration |
| --- | --- | --- |
| `userApi.getProfile` | `GET /me` | Home, Account and Edit Profile |
| `userApi.updateProfile` | `PATCH /me` | Edit Profile |
| `barangayApi.getBarangays` | `GET /barangays` with `withAuth: false` | Location labels/selectors and signup |
| `deviceApi.sendCommand` | `POST /telemetry/devices/:deviceId/command` | Helper exists; no current screen calls it |

Machine and batch screens use mock hooks. The registration route's proposed `/api/machines/register` is a TODO, not an implemented client endpoint.

## Request behavior

1. Authenticated requests obtain a Clerk token through `src/lib/auth-token.ts`.
2. An authenticated 401 triggers one retry with a refreshed token. A second failure still reaches the caller.
3. Successful JSON containing `data` is unwrapped; other successful JSON is returned directly.
4. HTTP failures throw `ApiError` with `statusCode` and a message. Timeouts default to 10 seconds and use status `408`; network errors use `0`.

Generic TypeScript return types do not validate payloads at runtime. Keep Zod form/domain schemas in `src/types/`, and check actual backend contracts when replacing the mock hooks.

For public variable names and local setup, see [Environment Variables](/reference/env-vars). Use `/me`, not the old `/users/profile` example.
