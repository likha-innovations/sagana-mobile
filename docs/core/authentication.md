# Authentication & Clerk

Sagana Mobile uses **Clerk Core 3** (`@clerk/expo`) with hardware-level SecureStore token caching, Google SSO, and an application-level state machine (`AuthContext`).

---

## 🔒 Security & Token Storage

Tokens are never stored in unencrypted storage (`AsyncStorage`). Instead, session tokens are securely saved in device keychains using `expo-secure-store`.

### Hardware Cache Implementation (`src/lib/token-cache.ts`)

```typescript
import * as SecureStore from 'expo-secure-store';

export const tokenCache = {
  async getToken(key: string) {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error('Failed to save token to SecureStore', error);
    }
  },
};
```

---

## ⚙️ Auth Machine (`AuthContext`)

All authentication interactions are encapsulated inside `src/context/auth-context.tsx` and consumed via the `useAuthContext()` hook.

### Exposed State & Methods

| Property / Method | Type | Description |
| :--- | :--- | :--- |
| `user` | `User \| null` | Normalized user profile mirroring backend Prisma User schema |
| `isAuthenticated` | `boolean` | True if an active session exists |
| `isLoading` | `boolean` | True during initial session bootstrap or async transitions |
| `signIn(email, password)` | `Promise<void>` | Email & password sign-in |
| `signUp(data)` | `Promise<void>` | Initial sign-up registration |
| `verifyEmail(code)` | `Promise<void>` | 6-digit OTP verification code submission |
| `resendVerificationCode()` | `Promise<void>` | Resend OTP code to user's pending email |
| `signInWithGoogle()` | `Promise<void>` | Native browser OAuth session for Google |
| `requestPasswordReset(email)` | `Promise<void>` | Trigger password reset verification email |
| `confirmPasswordReset(code, password)` | `Promise<void>` | Submit reset code and new password |
| `signOut()` | `Promise<void>` | Terminate session and clear cache |

---

## 🌐 Google Single Sign-On (SSO)

Google OAuth uses `expo-web-browser` warm-up patterns and `expo-auth-session` deep link callbacks with the `sagana://` scheme.

```typescript
WebBrowser.maybeCompleteAuthSession();

export const useWarmUpBrowser = () => {
  useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
};
```

---

## 🔑 Automatic JWT Bearer Token Injection

To avoid passing authentication tokens manually to every API call, `src/lib/auth-token.ts` maintains a static token getter callback configured during Clerk provider initialization.

`src/api/client.ts` automatically calls `getAuthToken()` and injects:

```http
Authorization: Bearer <clerk_jwt_token>
```
