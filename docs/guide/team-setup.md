# Team Setup: pnpm, CI, and EAS

Use this guide to set up an Android development client and keep local development, GitHub Actions, and EAS on the same tool versions.

## 1. Target versions and migration status

| Tool | Team target |
| --- | --- |
| Node.js | `24.13.0` |
| pnpm | `12.11.2` |
| Expo SDK | Keep the existing SDK 57 dependencies |

::: warning Configuration migration is pending
Verified at mobile commit `38b132d` on 13 October 2026: package.json has no packageManager pin, EAS profiles have no Node/pnpm overrides, and CI selects Node 24.13.0 and pnpm 12.11.2. Remote EAS tool versions were not checked in this audit. Follow section 6 to complete the migration before assuming all environments match. See [Versions & Changes](/reference/versions-and-changes) for app versions and build profiles.
:::

## 2. Install the local tools

Install [Node.js 24.13.0](https://nodejs.org/download/release/v24.13.0/) for your operating system, or select that version with your existing Node version manager. Reopen your terminal, then run:

```sh
node --version
npm install --global pnpm@12.11.2
pnpm --version
```

Expected versions are `v24.13.0` and `12.11.2`. npm is used here only to install the pnpm tool. Use pnpm to install this project's dependencies.

If Windows still reports another pnpm version, check which executable is being selected:

```powershell
Get-Command pnpm -All
where.exe pnpm
```

An older standalone installation, Corepack shim, or another Node installation may come first on PATH. Reopen the terminal after installation. If the version is still wrong, identify which installation owns that executable and correct its PATH entry or installation; do not delete unrelated Node folders or use force flags blindly. On macOS/Linux, use `type -a pnpm` to locate competing installations.

For a one-off check while resolving PATH, this explicitly selects the team version without changing the project manifest:

```sh
npm exec --yes --package=pnpm@12.11.2 -- pnpm --version
```

See the [pnpm installation documentation](https://pnpm.io/installation/) for platform-specific installation details.

## 3. Clone and start development

```sh
git clone https://github.com/likha-innovations/sagana-mobile.git
cd sagana-mobile
git switch development
pnpm install --frozen-lockfile
pnpm typecheck
```

The `development` branch must exist on the remote first. If it does not, ask the maintainer which branch contains the current setup.

A frozen install uses the exact saved dependency graph in `pnpm-lock.yaml` and refuses to rewrite it to resolve a mismatch. It still creates your local node_modules directory.

Create your local environment file from `.env.example`:

::: code-group
```powershell [PowerShell]
Copy-Item .env.example .env
```
```sh [macOS / Linux / Git Bash]
cp .env.example .env
```
:::

Configure the values described in [Environment Variables](/reference/env-vars). Obtain the development values through the team's private sharing method. Do not commit `.env` files or put private server credentials in `EXPO_PUBLIC_*` variables; those values are exposed to the client.

Start Metro:

```sh
pnpm run start:app --dev-client
```

Ask the maintainer for the current Android development APK or its EAS build link. Install it on your Android device and open its development launcher to connect to Metro. Keep the device and computer on the same reachable network and configure the development API address as described in the environment guide.

Expo Go does not contain the custom Bluetooth module. Use a physical Android device and a Sagana device for Bluetooth testing. You do not need to reproduce EAS's Ubuntu image, Java, or NDK setup just to run Metro and an existing development APK. Compiling Android locally requires a separate Android SDK/JDK setup.

## 4. Add packages and prepare a pull request

1. Create a feature branch from `development`.
2. For Expo/native packages, use the installed Expo CLI: `pnpm exec expo install <package>`.
3. For a JavaScript-only dependency, use `pnpm add -w <package>`. The `-w` explicitly targets this single-app workspace root. Add `-D` for development tools.
4. Review changes to package.json, pnpm-lock.yaml, and pnpm-workspace.yaml together. Do not create an npm/yarn lockfile or delete the pnpm lockfile to work around an error.
5. Run the checks below and open a PR into `development`.

```sh
node --version
pnpm --version
pnpm install --frozen-lockfile
pnpm typecheck
pnpm exec expo install --check
pnpm exec expo-doctor
```

Keep one `allowBuilds` map and one `overrides` map in pnpm-workspace.yaml. Do not put pnpm settings back under package.json's obsolete `pnpm` configuration field. The `packageManager` version declaration is a separate field.

Frozen install should not change dependency files. If it fails, inspect the specific mismatch locally and fix the manifest/configuration and lockfile together in a reviewed change. Do not disable frozen installation on EAS.

## 5. Development and main checks

| PR target | Required validation |
| --- | --- |
| `development` | Frozen install and TypeScript; dependency-file integrity when relevant files change |
| `main` | Development checks plus Expo dependency compatibility and Expo Doctor |

CI runs one pnpm 12.11.2 installation per PR on Node 24.13.0, including code-only PRs. There is no pnpm 11 or second-version compatibility job.

Dependency-file snapshots and integrity checks run only when the PR changes `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `.npmrc`, or `.github/workflows/mobile-quality.yml`. Frozen installation and typecheck run on every PR.

PR updates rerun checks and cancel the older run. Dependency caching reduces downloads but does not eliminate installation. Require **Mobile merge ready** in GitHub branch protection for both branches. This setting must be applied in GitHub; the workflow file alone does not block merges.

Before merging native/dependency changes into main, confirm a development APK builds and test startup, Home/Machines/Account navigation, and Bluetooth pairing. For ordinary screen or styling edits, reuse the existing development client. Rebuild when native dependencies or configuration change.

## 6. Maintainer: complete the toolchain migration

These are proposed edits; the examples are not replacements for the complete configuration files.

1. Add the following top-level declaration to package.json:

   ```json
   "packageManager": "pnpm@12.11.2"
   ```

2. Set these common fields in each EAS build profile (`development`, `preview`, and `production`), preserving the existing profile options:

   ```json
   "node": "24.13.0",
   "pnpm": "12.11.2"
   ```

   Changing local pnpm does not change EAS. These fields select the tools used during the build; the image's initial installed-software listing may still show its bundled defaults. Verify the selected versions in subsequent build setup/install logs. See [EAS configuration](https://docs.expo.dev/eas/json/).

3. CI is already set to Node 24.13.0 and pnpm 12.11.2, with one installation job. It preserves caching, cancellation, frozen installation, file-integrity verification, the main-only Expo checks, and the final **Mobile merge ready** status.
4. After applying the remaining pins, update the migration status in this guide, README, and getting-started guide. Preserve the lockfile unless a verified configuration change requires updating it.
5. Verify a clean frozen install, typecheck, and Expo checks using the selected versions. Commit the related changes together and obtain passing PR checks.

When the team explicitly chooses to spend build credits, submit the existing development profile:

```sh
eas build --platform android --profile development
```

The build maintainer needs EAS CLI and authorized Expo project access. Sharing a development APK does not require sharing the maintainer's Expo token with collaborators. CI does not automatically submit this build.

Record the commit, build URL, selected Node/pnpm versions, EAS image, and device smoke-test results. The last working commit is the rollback reference. Future tool upgrades should update local guidance, CI, and EAS together through a PR.
