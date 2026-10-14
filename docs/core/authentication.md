# Authentication & Clerk

`src/context/auth-context.tsx` wraps `@clerk/expo` and exposes `useAuthContext()`. The root supplies `tokenCache` from `src/lib/token-cache.ts`, backed by `expo-secure-store`.

## Current interface

| State / method | Purpose |
| --- | --- |
| `isSignedIn`, `isLoaded` | Session presence and auth initialization |
| `user`, `clerkUser` | Normalized client profile and Clerk user |
| `getToken()` | Retrieve a session token |
| `signIn(email, password)` | Email/password authentication |
| `signInWithGoogle()` | Google SSO flow |
| `signUp(email)`, `verifyEmail(code)` | Start email signup and verify the code |
| `completeSignUp(...)` | Save names, birthday and barangay metadata, plus password where needed |
| `requestPasswordReset(email)` | Request the reset code |
| `verifyPasswordResetCode(code)`, `resetPassword(...)` | Verify the code and set the new password |
| `updatePassword(currentPassword, newPassword)` | Change password for a signed-in user |
| `signOut()` | Disconnect the socket, sign out of Clerk and return to sign-in |

Use `isSignedIn` and `isLoaded`; old examples naming `isAuthenticated` and `isLoading` do not match the current context.

## Onboarding and account flows

Email signup advances through email, OTP, password, name and birthday/barangay screens. Google users missing a birthday return to signup to complete their profile. The route guard currently uses birthday presence as the completion check; see [routing](/guide/routing-navigation#startup-and-guards).

Account displays backend profile data with a Clerk fallback. Edit profile saves through `useUpdateProfile()` to `PATCH /me`; signup completion writes Clerk metadata. Keep those paths distinct when debugging profile synchronization.

The Account screen shows a Google sign-in label instead of Change Password for Google accounts. The password-change screens pass the current password through `lib/password-flow-store.ts`, not route parameters. Preserve that boundary.

## API authentication

`src/lib/auth-token.ts` supplies the token getter used by the API client. Authenticated requests attach a bearer token; the client retries once after an authenticated 401 with a refreshed token. Sign-out disconnects Socket.IO, and the root's signed-out redirect clears cached queries.

Never include session tokens, passwords or pairing credentials in logs, screenshots or handoff notes. This documentation audit did not exercise live Clerk or backend sessions.
