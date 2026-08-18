# API Client & Contracts

Sagana Mobile uses a typed native `fetch` wrapper in `src/api/client.ts`. Axios and other heavy HTTP libraries are strictly avoided.

---

## 📦 Unified API Response Envelope

All backend endpoints wrap responses in a standard envelope contract:

```typescript
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  timestamp: string;
}
```

---

## ⚡ Automatic Envelope Unwrapping

When calling `apiFetch<T>(endpoint, options)`, the client automatically unwraps `response.data` so calling hooks receive `T` directly:

```typescript
// Inside src/api/user.api.ts
export const getProfile = async (): Promise<User> => {
  return apiFetch<User>('/users/profile');
};
```

---

## 🛑 Structured Error Handling (`ApiError`)

When the backend returns an error response (or HTTP status $\ge 400$), `apiFetch` parses the response and throws an `ApiError` containing the HTTP status code and server message:

```typescript
export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
```

---

## 🌐 Dynamic Base URL Resolution

`apiFetch` intelligently determines the active backend URL based on execution context:

1. **Production / Remote URL**: Uses `EXPO_PUBLIC_API_BASE_URL` if set.
2. **Local Development (Physical Device / Emulator)**: Uses `EXPO_PUBLIC_IP_ADDRESS` (e.g. `http://192.168.1.100:3000/api`).
3. **Local Fallback**: Defaults to `http://localhost:3000/api`.

```typescript
const resolveBaseUrl = (): string => {
  const prodUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (prodUrl) return prodUrl;

  const customIp = process.env.EXPO_PUBLIC_IP_ADDRESS?.trim();
  if (customIp) return `http://${customIp}:3000/api`;

  return 'http://localhost:3000/api';
};
```
