# Environment Variables

This document lists all environment variables used by **Sagana Mobile**, how they are resolved, and how to configure them for local and production workflows.

---

## 📋 Variable Reference

| Variable | Required | Type | Description |
| :--- | :--- | :--- | :--- |
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | **Yes** | `string` | Publishable key from the [Clerk Dashboard](https://dashboard.clerk.com/) (`pk_test_...` or `pk_live_...`). |
| `EXPO_PUBLIC_API_BASE_URL` | Optional | `string` | Full HTTP(S) URL for the backend API (e.g. `https://api.sagana.ph/api`). Overrides `EXPO_PUBLIC_IP_ADDRESS`. |
| `EXPO_PUBLIC_IP_ADDRESS` | Optional | `string` | Local network IPv4 address (e.g. `192.168.1.100`) used to route API traffic from physical test devices to your development machine. |

---

## 🔧 Environment Configuration Flow

Sagana Mobile resolves backend endpoints in the following priority order:

1. If `EXPO_PUBLIC_API_BASE_URL` is set ➔ uses this explicit URL.
2. Else if `EXPO_PUBLIC_IP_ADDRESS` is set ➔ uses `http://${EXPO_PUBLIC_IP_ADDRESS}:3000/api`.
3. Else ➔ falls back to `http://localhost:3000/api`.

---

## 💻 Sample `.env`

```env
# Clerk Authentication Key
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_ZGlzdGluY3Qtc25hcHBlci01Mi5jbGVyay5hY2NvdW50cy5kZXYk

# Production URL (Leave blank when developing locally)
EXPO_PUBLIC_API_BASE_URL=

# Local Development IP Address
EXPO_PUBLIC_IP_ADDRESS=192.168.100.25
```
