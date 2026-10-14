# UI & Feature Status

Source snapshot: `38b132d`, 13 October 2026. **Wired** means the code calls a service or native module; it does not mean this audit tested that service on a device.

## Screen map

Paths below omit `.tsx` and are relative to `app/`.

| Screen / source                                                | UI and behavior                                                                                                                                      | Data / completion                                                                          |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Sign-in · `(auth)/sign-in`                                     | Email/password, Google sign-in, password visibility, errors, reset/account links                                                                     | Clerk wired                                                                                |
| Sign-up · `(auth)/sign-up`                                     | Email → OTP → password → name → birthday/barangay; Google users complete missing profile details; policy and birthday sheets                         | Clerk and barangay lookup wired                                                            |
| Reset password · `(auth)/forgot-password`                      | Email, OTP/resend, new password, no-email-access and completion states                                                                               | Clerk wired                                                                                |
| Auth fallback · `(auth)/uh-oh`                                 | Recovery message and return to sign-in                                                                                                               | Navigation only                                                                            |
| Home · `(app)/(tabs)/index`                                    | Greeting/location, five derived metrics, three recent completed batches, new batch and add-machine actions; non-removed machines sorted oldest first | Profile/location wired; metrics and machines mocked                                        |
| Machines · `(app)/(tabs)/machines/index`                       | Machine cards, loading, pull-to-refresh; add-machine action when empty                                                                               | Mock list; refresh rereads local data                                                      |
| Machine detail · `machines/[id]/index` under tabs              | Vacant/composting state, phase indicator, batch feedstocks, sensor cards, automation display, links to history/settings, Finish Batch confirmation   | Mock readings/batch; Finish Batch only closes the modal and navigates away                 |
| Machine settings · `machines/[id]/settings` under tabs         | Rename, Wi-Fi form, remove confirmation; Android back returns to the settings menu                                                                   | In-memory mutations only; Wi-Fi save updates SSID, not the password or hardware            |
| Automation logs · `machines/[id]/automation-logs` under tabs   | All time by default; Today, last 7/31 days and custom ranges; retry/empty states                                                                     | Shared screen and fixed-timestamp events across all batches for the machine                |
| Sensor history · `machines/[id]/sensors-history` under tabs    | Latest recorded day; day/week/month/custom ranges and bounded navigation                                                                             | Shared screen; hourly/daily means with missing intervals preserved                         |
| History · `(app)/(tabs)/history/index`                         | Batch-code search, committed date filters, newest-first completed rows, retry and empty states                                                       | Shared completed-batch fixtures; local calendar boundaries                                 |
| Completed batch · `history/[batchId]/index` under tabs         | Completion banner, duration/output, metadata, Figma feedstock artwork, sensor/log links                                                              | Initial feedstock weights sum to input; final compost weight stays separate                |
| Batch sensors · `history/[batchId]/sensors-history` under tabs | Latest recorded day, day/week/month/custom ranges, bounded date navigation                                                                           | Batch-specific fixed timestamps; hourly/day means; missing intervals remain gaps           |
| Batch logs · `history/[batchId]/automation-logs` under tabs    | All time/custom ranges; newest-first groups by actual local date                                                                                     | Validated batch-specific mock events                                                       |
| New batch · `(app)/batch/new`                                  | Select machine → confirm power → feedstock weights → transfer instructions → success; optional preselected machine                                   | Validates input, creates a local batch and marks the mock machine active; no backend write |
| Add machine · `(app)/machine-registration/new`                 | Power instructions → BLE selection/connection → Wi-Fi → name → success                                                                               | Native BLE wired; backend registration pending                                             |
| Account · `(app)/(tabs)/profile`                               | Profile/location, edit link, password change or Google account label, logout confirmation                                                            | Backend profile with Clerk fallback; Clerk sign-out                                        |
| Edit profile · `(app)/edit-profile`                            | Read/edit modes, name, birthday sheet, barangay sheet, save and discard confirmation                                                                 | `GET/PATCH /me`; birthday display uses `MMMM d, yyyy`                                      |
| Change password · `(app)/change-password/`                     | `current-password` → `new-password` → `success`; forgot-password branch                                                                              | Clerk wired; temporary current password stays in the in-memory flow store                  |
| Not found · `+not-found`                                       | Unknown-route fallback                                                                                                                               | Navigation only                                                                            |

## Shared UI

| Folder                   | Reuse                                                                                                     |
| ------------------------ | --------------------------------------------------------------------------------------------------------- |
| `components/auth/`       | Floating inputs, OTP group, resend timer, password requirements, progress bar, birthday and policy sheets |
| `components/dashboard/`  | Gradient metric cards and quick-action buttons                                                            |
| `components/devices/`    | Machine cards, sensor cards/graphs, automation log cards, registration steps                              |
| `components/ui/`         | Button, Input, Card, ConfirmModal, ErrorModal, filters, date-range picker, static Skeleton and toast      |
| `components/navigation/` | `BottomTabBar`                                                                                            |

See [styling and spacing rules](/core/design-system) before adding another shared component.

## BLE handoff

1. Use an installed development client and physical compatible hardware. Expo Go does not include `react-native-ble-plx`.
2. Grant Bluetooth/location permissions and turn Bluetooth on. The hook scans for the firmware service UUID in `src/lib/bluetooth.ts` and exposes scanning, connecting, connected and error states.
3. Select the machine, enter Wi-Fi credentials or retrieve the current SSID. Android SSID lookup also needs Location Services enabled.
4. The hook writes a Base64-encoded `ssid,password` payload to the firmware characteristic. A successful write is not a Wi-Fi connectivity acknowledgment. Do not log the payload.
5. Naming currently validates the form and advances to success. `POST /api/machines/register` appears only as a TODO; the flow does not save a machine or update the list.

The route has six internal step values; steps 2 and 3 currently render the same connection component.

## Known limits for demos and QA

1. Machine and batch edits disappear after a JS runtime reload. Dashboard weight totals and completed counts derive from completed-batch fixtures; ongoing and owned-machine counts reflect the in-memory batch/machine state.
2. Finish Batch has no mutation. Machine and batch history share aggregation and preserve missing readings as gaps. Machine history spans batches; batch history requires explicit membership and lifetime bounds.
3. Socket.IO and REST command helpers exist, but no current screen calls `useSocket()` or `deviceApi.sendCommand()`.
4. Notifications have a dependency/plugin and Android permission, but no runtime notification flow was found in `app/` or `src/`. Camera configuration likewise does not establish a QR-scanning flow.
5. Power/transfer instructions still include gray illustration placeholders. Loading and error coverage varies; missing machine detail currently renders nothing.

For a device handoff, check sign-in/onboarding, all tabs and back navigation, profile saving, keyboard/sheet behavior, mock batch creation, history filters, and BLE permission denial/disconnection. Record outcomes separately from this source audit.

## Dashboard update · 14 October 2026

Home follows the Figma Dashboard hierarchy with responsive metric columns and sensor tiles. Completed rows open batch details, and View All opens the unfiltered History tab. Background tokens now use the Figma off-white. TypeScript and the focused dashboard data checks pass; native visual comparison remains pending. The isolated web preview could not start because react-native-web is not installed. Existing ESLint configuration skips TypeScript/TSX files.

## History update · 14 October 2026

History includes completed batches, details, sensor history and automation logs. Date sheets retain draft selections until Apply; cancel preserves the committed filter. Same-day and reversed custom ranges are supported. Presets include the current month and the preceding five or eleven months. Sensor weeks start Monday; daily charts use hourly means, longer ranges use daily means.

Feedstock illustrations and solid tab icon paths were exported from Figma. No dependencies or backend contracts changed. Finish Batch remains deferred.

TypeScript, 11 focused tests, applicable test-file lint, the documentation build and an Android JavaScript export pass. Tests cover filtering, aggregation, fixture consistency, sheet handlers, batch isolation and unchanged Dashboard totals. The Android export resolves all six Figma feedstock images. Native visual comparison at 412px/narrow widths and enlarged text, gesture dismissal, Android back, keyboard clearance and nested navigation still require a development client. Web preview remains unavailable without react-native-web; the current ESLint configuration does not parse TypeScript/TSX.

Dashboard loading uses the shared `Skeleton` component with the existing `bg-skeleton` token. Metrics, completed batches and machines have responsive placeholders; each section exposes one accessible loading label. The placeholders use no animation or additional dependency.

## Shared history implementation

The four sensor/log routes are thin wrappers around two shared screens. Each wrapper keeps its tab, Back navigation and focus logger. Queries cache by machine or batch scope and use the validated `history_readings` and `history_events` collections in `data.json`. Records have a machine ID and nullable batch ID; unassigned records are visible only in machine scope. Completed-batch details query batch metadata independently of telemetry.

Legacy machine sensor values now have explicit timestamps at evenly spaced positions from 00:00 through the following midnight on their fixture date (Asia/Manila). Historical timestamps are never shifted to today. Mock machine registration dates for machines 1 and 3 were moved before their earliest completed batches; this also changes their oldest-first Dashboard order. Batch timestamps, feedstocks and Dashboard totals are preserved.

The shared implementation passes 17 focused tests for scope isolation, aggregation, local-date filtering, fixture integrity and sheet state. Native tab/back navigation and visual comparison still require a development client.
