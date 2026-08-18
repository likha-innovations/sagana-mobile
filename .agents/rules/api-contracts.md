---
trigger: always_on
description: API Contract rules connecting sagana-mobile with sagana-backend
---

# API Contract & Cross-Stack Rules

1. **Single Source of Truth**:
   - Backend Zod schemas (in `sagana-backend/src/modules/*/dto/`) define all payload shapes.
   - Mobile TypeScript interfaces in `sagana-mobile/src/types/api.ts` must mirror backend schemas 1:1.

2. **Automatic Envelope Unwrapping**:
   - Backend returns `{ success: true, data: T, timestamp: string }`.
   - Mobile `apiFetch<T>()` must unwrap `json.data` and return `T` directly to hooks and components.

3. **Structured Error Handling**:
   - If backend returns `{ success: false, statusCode: number, message: string }`, `apiFetch` must throw an `ApiError(statusCode, message)`.
   - Never show generic error popups when the backend provides a descriptive error message.
