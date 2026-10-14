# Versions & Repository Changes

Audited on **13 October 2026**, at mobile commit **`38b132d`**. Versions below come from checked-in configuration; no remote release or installed APK was verified.

## Current versions

| Item | Declared version / behavior |
| --- | --- |
| App | `package.json` and `app.json`: **1.3.0** |
| Expo / Router | `~57.0.26` / `~57.0.24` |
| React / React Native | `19.2.3` / `0.86.3` |
| TypeScript | `~6.0.3` |
| Uniwind / Tailwind | `^1.11.0` / `^4.3.3` |
| Clerk / TanStack Query | `^4.4.0` / `^5.101.4` |
| VitePress | `^1.6.3` |
| CI Node / pnpm | `24.13.0` / `12.11.2` |

These are manifest constraints, not a list of exact installed versions. `pnpm-lock.yaml` records resolved dependencies. `package.json` has no `packageManager` pin; EAS profiles have no Node/pnpm overrides. See [toolchain migration status](/guide/team-setup).

## Recent changes

Commit links identify the source changes, not release tags.

| Commit | Change collaborators need to know |
| --- | --- |
| [`38b132d`](https://github.com/likha-innovations/sagana-mobile/commit/38b132d) | Edit profile formats birthday values and uses `BirthdayBottomSheet`. |
| [`7afafdf`](https://github.com/likha-innovations/sagana-mobile/commit/7afafdf), [`2aa087c`](https://github.com/likha-innovations/sagana-mobile/commit/2aa087c) | NativeWind replaced by Uniwind; Metro/CSS integration and type declarations changed. |
| [`77d3240`](https://github.com/likha-innovations/sagana-mobile/commit/77d3240) | App 1.3.0; notification dependency, plugin and permission added. Runtime delivery remains unwired. |
| [`76f603c`](https://github.com/likha-innovations/sagana-mobile/commit/76f603c) | Package version became 1.2.0 while Expo app version was still 1.1.0. Current files now agree at 1.3.0. |
| [`a550d5f`](https://github.com/likha-innovations/sagana-mobile/commit/a550d5f), [`d971348`](https://github.com/likha-innovations/sagana-mobile/commit/d971348) | PR quality workflow and clean-checkout typechecking support. |
| [`a2e22cd`](https://github.com/likha-innovations/sagana-mobile/commit/a2e22cd) | Navigation component renamed to `BottomTabBar`. |
| [`b24840e`](https://github.com/likha-innovations/sagana-mobile/commit/b24840e), [`7280aef`](https://github.com/likha-innovations/sagana-mobile/commit/7280aef) | Machine registration UI, BLE discovery/connection and Wi-Fi SSID autofill. |
| [`f18ea96`](https://github.com/likha-innovations/sagana-mobile/commit/f18ea96), [`6c5421c`](https://github.com/likha-innovations/sagana-mobile/commit/6c5421c) | Registration route renamed to `machine-registration`; Home shows active machines and links to registration. |
| [`f4394c7`](https://github.com/likha-innovations/sagana-mobile/commit/f4394c7) | Finish Batch confirmation UI and gradient button styling; finishing still lacks a mutation. |
| [`fce6f51`](https://github.com/likha-innovations/sagana-mobile/commit/fce6f51), [`d67c239`](https://github.com/likha-innovations/sagana-mobile/commit/d67c239) | Date-range UI and mock history/log filtering. See the [remaining limits](/guide/ui-status#known-limits-for-demos-and-qa). |
| [`b974fc7`](https://github.com/likha-innovations/sagana-mobile/commit/b974fc7), [`27ce618`](https://github.com/likha-innovations/sagana-mobile/commit/27ce618), [`4501819`](https://github.com/likha-innovations/sagana-mobile/commit/4501819) | Machine/batch domains split from device types; hooks and UI updated to those models. |

No local Git tags were present during this audit. Commit messages containing version numbers are not evidence of a published release.

## EAS profiles and versioning

| Profile | Checked-in configuration |
| --- | --- |
| `development` | Development client, internal distribution, Android APK |
| `preview` | Internal distribution |
| `production` | `autoIncrement: true` |

`eas.json` requires EAS CLI `>= 22.0.0` and uses `appVersionSource: remote`. Neither `android.versionCode` nor `ios.buildNumber` is declared in `app.json`; confirm native build numbers from EAS/build records. Do not infer them from `1.3.0`.

For the next release:

1. Keep the intended user-facing version aligned in `package.json` and `app.json`.
2. Review native dependency/plugin/permission changes and rebuild the development client when needed.
3. Run the checks in [team setup](/guide/team-setup), then record the commit, app version, native build numbers, profile, build link and device checks.
4. Update this page with verified changes and remaining gaps. Treat release tagging as a team decision; this audit did not create a tag or submit a build.
