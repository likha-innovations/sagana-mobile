# Collaborator Overview

**Snapshot: 13 October 2026 · app 1.3.0 · mobile commit `38b132d`.** This is a source audit, not a device-test or deployed-release report.

## Read this first

1. The app has Home, Machines and Account tabs, plus account, batch and BLE registration flows. See the [screen map](/guide/ui-status).
2. Clerk authentication and profile/barangay API calls are wired. Machine lists, batches, metrics, logs and history still use local mock data.
3. BLE registration can discover/connect and write Wi-Fi credentials. The final backend registration call is a TODO. A success screen does not prove the machine was saved or joined Wi-Fi.
4. Styling now uses **Uniwind + Tailwind v4**, with local **Spotify Mix** fonts. Use the [current design system](/core/design-system), not old NativeWind setup.
5. Use pnpm and the saved lockfile. CI selects Node `24.13.0` / pnpm `12.11.2`; local/EAS version pins remain incomplete.

## Where to go next

| Need | Read |
| --- | --- |
| Start the app or prepare a PR | [Team setup](/guide/team-setup) |
| Find the right source file | [Folder structure](/guide/architecture) |
| Understand every screen and unfinished action | [UI & feature status](/guide/ui-status) |
| Check versions, recent changes or build profiles | [Versions & changes](/reference/versions-and-changes) |
| Work on auth, API or cached data | [Authentication](/core/authentication), [API](/core/api-client), [state](/core/state-management) |

## Before handing off a change

1. State which screens changed and whether they use mock data, backend data or hardware.
2. Run `pnpm run typecheck`. For a read-only lint check, use `pnpm exec eslint .`; `pnpm run lint` applies fixes.
3. For docs, run `pnpm run docs:build`. For native dependencies/plugins, follow the development-client rebuild checks in team setup.
4. Record the commit and checks. For APK handoffs, also record the app version, native build number, EAS profile/build link, and device results.

## Audit scope

Reviewed route/layout files, relevant UI handlers, shared components, hooks, API wrappers, domain types, styling/build configuration, PR workflow, commit history and existing docs. No live environment files, credentials, generated native output or full dependency tree were inspected. No hardware, Clerk account, backend session or remote EAS build was exercised.
