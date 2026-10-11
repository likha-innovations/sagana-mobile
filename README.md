# Sagana Mobile

Sagana Mobile is the mobile app for operators of Sagana automated composting machines (AIVSP units) by Likha Innovations.

Operators use the app to monitor composting cycles, check sensor readings, and manage their operator accounts.

## Getting started

### Prerequisites

- Node.js 24.13.0 (the CI version)
- pnpm 12.11.2 (the CI version; package.json and EAS pins are still pending)
- An Android development build on a device or emulator; Bluetooth requires a physical device

### Setup

1. Install dependencies:
   ```bash
   pnpm install --frozen-lockfile
   ```

2. Create your environment file:
   ```bash
   cp .env.example .env
   ```

3. Configure your `.env` variables:
   ```env
   # Clerk publishable key (required for login and signup)
   EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_key
   ```

4. Start the app:
   ```bash
   pnpm run start:app --dev-client
   ```

Open the development client and connect it to Metro. Expo Go does not include this app's custom Bluetooth native module.

## Commands

| Command | Purpose |
| :--- | :--- |
| `pnpm run start` | Starts Expo Metro bundler and documentation preview |
| `pnpm run start:app` | Starts Expo Metro bundler directly |
| `pnpm run android` | Builds and runs Android locally |
| `pnpm run ios` | Builds and runs iOS locally on macOS |
| `pnpm run web` | Launches web preview |
| `pnpm run typecheck` | Checks TypeScript types without building |
| `pnpm run lint` | Runs ESLint and fixes auto-fixable issues |
| `pnpm run format` | Formats code with Prettier |

## Before submitting an EAS development build

Run this from the project root in Bash (Git Bash on Windows), using Node 24.13.0 and pnpm 12.11.2:

```bash
(
  set -eu
  node --version
  pnpm --version
  snapshot=$(mktemp)
  trap 'rm -f "$snapshot"' EXIT
  sha256sum package.json pnpm-workspace.yaml pnpm-lock.yaml > "$snapshot"
  pnpm install --frozen-lockfile
  sha256sum --check "$snapshot"
  pnpm run typecheck
)
```

CI runs on pull requests into `development` and `main`, not standalone pushes. Pushing another commit to an open PR reruns the checks and cancels its older run. Dependency downloads are cached; each job still installs from the frozen lockfile.

| PR target | Checks |
| --- | --- |
| `development` | Frozen install and typecheck with pnpm 12.11.2; dependency-file integrity when relevant files change |
| `main` | All development checks plus `pnpm exec expo install --check` and `pnpm exec expo-doctor` |

Each PR runs one pnpm 12.11.2 installation for typechecking, including code-only changes. Main checks do not require production secrets and do not load `.env` files.

Dependency-file snapshots and integrity checks run only when the PR changes `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `.npmrc`, or `.github/workflows/mobile-quality.yml`. Code-only PRs skip these two steps; frozen installation and typecheck still run.

Configure **`Mobile merge ready`** as the required GitHub status on both branches. This final check passes only when the quality job succeeds; failures, cancellations, and skipped quality jobs block it. Branch protection is configured on GitHub, not by this YAML file. Wait for this status before merging; the workflow does not submit EAS builds.

Keep one `allowBuilds` map and one `overrides` map in `pnpm-workspace.yaml`. Do not move them into package.json. Include package.json, pnpm-workspace.yaml, pnpm-lock.yaml and the old package-lock.json deletion together when committing the pnpm migration. Do not delete the pnpm lockfile or disable EAS frozen installation to bypass a failure.

After changing dependencies, the lockfile, Expo plugins, or native configuration, explicitly submit the existing development APK profile when ready:

```bash
eas build --platform android --profile development
```

This cloud command can consume build credits; it is not part of the preflight. Record the build URL/commit, EAS image, Node version and pnpm version from the build log. Install the APK on an Android device, connect it to Metro, then check startup, Home/Machines/Account navigation, and pairing with a physical Sagana Bluetooth device. Record pass/fail for each. A successful dependency gate alone does not verify native compilation or Bluetooth.

For ordinary screen/style changes, reuse the development client. Rebuild when native dependencies or configuration change. iOS native verification is outside this Android development gate.

If EAS uses a new pnpm major, reproduce its failure with that logged version before changing the lockfile. Validate a toolchain upgrade in CI before claiming support, and align local and EAS versions with it. Keep the previous working dependency state in Git; revert a failed dependency-change commit instead of regenerating dependencies blindly.

---

License: MIT. Likha Innovations.
