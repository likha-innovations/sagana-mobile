# Troubleshooting & FAQ

Common development questions, issues, and resolution steps for Sagana Mobile.

---

## 🔌 Network & API Connection Issues

### Problem: API requests fail with `Network request failed` on physical device
- **Cause**: Physical mobile devices cannot connect to `localhost` on your computer.
- **Solution**:
  1. Determine your computer's local Wi-Fi IP address:
     - **Windows**: `ipconfig` (Look for `IPv4 Address`)
     - **macOS / Linux**: `ifconfig` or `ip a`
  2. Put that IP address in `.env`:
     ```ini
     EXPO_PUBLIC_IP_ADDRESS=192.168.1.100
     ```
  3. Restart the Metro server with cache clear: `npx expo start -c`.
  4. Ensure both your computer and mobile device are connected to the **same Wi-Fi network**.

---

## 🔑 Clerk & Authentication Issues

### Problem: `Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in environment variables`
- **Cause**: `.env` is missing or Metro has cached an old environment state.
- **Solution**:
  1. Verify `.env` exists in the project root with the correct key.
  2. Restart Metro bundler using `npx expo start -c`.

### Problem: Google Sign-In redirects but does not authenticate
- **Cause**: Deep link redirect URI mismatch in Clerk Dashboard.
- **Solution**: Ensure `sagana://` or `expo-development-client` redirect URIs are configured in the **Clerk Dashboard > SSO Connections > Google**.

---

## 📦 Metro Bundler & Cache Issues

### Problem: Stale module errors after installing new packages
- **Solution**: Clear Metro cache and restart:
  ```bash
  npx expo start -c
  ```

---

## 🎨 Theme & Tailwind CSS Issues

### Problem: Uniwind classes are not applying or fonts look default
- **Solution**:
  1. Ensure `global.css` is imported at the top of `app/_layout.tsx`.
  2. Ensure fonts have loaded before rendering UI (`useFonts({ 'Montserrat-Regular': ... })`).
