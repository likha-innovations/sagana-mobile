# UI & Feature Status

Source snapshot: `38b132d`, 13 October 2026. **Wired** means the code calls a service or native module; it does not mean this audit tested that service on a device.

## Screen map

Paths below omit `.tsx` and are relative to `app/`.

| Screen / source | UI and behavior | Data / completion |
| --- | --- | --- |
| Sign-in · `(auth)/sign-in` | Email/password, Google sign-in, password visibility, errors, reset/account links | Clerk wired |
| Sign-up · `(auth)/sign-up` | Email → OTP → password → name → birthday/barangay; Google users complete missing profile details; policy and birthday sheets | Clerk and barangay lookup wired |
| Reset password · `(auth)/forgot-password` | Email, OTP/resend, new password, no-email-access and completion states | Clerk wired |
| Auth fallback · `(auth)/uh-oh` | Recovery message and return to sign-in | Navigation only |
| Home · `(app)/(tabs)/index` | Greeting/location, five derived metrics, three recent completed batches, new batch and add-machine actions; non-removed machines sorted oldest first | Profile/location wired; metrics and machines mocked |
| Machines · `(app)/(tabs)/machines/index` | Machine cards, loading, pull-to-refresh; add-machine action when empty | Mock list; refresh rereads local data |
| Machine detail · `machines/[id]/index` under tabs | Vacant/composting state, phase indicator, batch feedstocks, sensor cards, automation display, links to history/settings, Finish Batch confirmation | Mock readings/batch; Finish Batch only closes the modal and navigates away |
| Machine settings · `machines/[id]/settings` under tabs | Rename, Wi-Fi form, remove confirmation; Android back returns to the settings menu | In-memory mutations only; Wi-Fi save updates SSID, not the password or hardware |
| Automation logs · `machines/[id]/automation-logs` under tabs | Today, last 7/31 days, all dates and custom range; loading/empty results | Client-side mock filtering; log timestamps shift relative to today |
| Sensor history · `machines/[id]/sensors-history` under tabs | Temperature, moisture, oxygen and CO2 graphs; day navigation and range controls | Mock history; initial date is 30 September 2026; range aggregation is not implemented |
| New batch · `(app)/batch/new` | Select machine → confirm power → feedstock weights → transfer instructions → success; optional preselected machine | Validates input, creates a local batch and marks the mock machine active; no backend write |
| Add machine · `(app)/machine-registration/new` | Power instructions → BLE selection/connection → Wi-Fi → name → success | Native BLE wired; backend registration pending |
| Account · `(app)/(tabs)/profile` | Profile/location, edit link, password change or Google account label, logout confirmation | Backend profile with Clerk fallback; Clerk sign-out |
| Edit profile · `(app)/edit-profile` | Read/edit modes, name, birthday sheet, barangay sheet, save and discard confirmation | `GET/PATCH /me`; birthday display uses `MMMM d, yyyy` |
| Change password · `(app)/change-password/` | `current-password` → `new-password` → `success`; forgot-password branch | Clerk wired; temporary current password stays in the in-memory flow store |
| Not found · `+not-found` | Unknown-route fallback | Navigation only |

## Shared UI

| Folder | Reuse |
| --- | --- |
| `components/auth/` | Floating inputs, OTP group, resend timer, password requirements, progress bar, birthday and policy sheets |
| `components/dashboard/` | Gradient metric cards and quick-action buttons |
| `components/devices/` | Machine cards, sensor cards/graphs, automation log cards, registration steps |
| `components/ui/` | Button, Input, Card, ConfirmModal, ErrorModal, filters, date-range picker and toast |
| `components/navigation/` | `BottomTabBar` |

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
2. Finish Batch has no mutation. Sensor range controls do not compute range results; unmatched daily dates return zero arrays.
3. Socket.IO and REST command helpers exist, but no current screen calls `useSocket()` or `deviceApi.sendCommand()`.
4. Notifications have a dependency/plugin and Android permission, but no runtime notification flow was found in `app/` or `src/`. Camera configuration likewise does not establish a QR-scanning flow.
5. Power/transfer instructions still include gray illustration placeholders. Loading and error coverage varies; missing machine detail currently renders nothing.

For a device handoff, check sign-in/onboarding, all tabs and back navigation, profile saving, keyboard/sheet behavior, mock batch creation, history filters, and BLE permission denial/disconnection. Record outcomes separately from this source audit.

## Dashboard update · 14 October 2026

Home follows the Figma Dashboard hierarchy with responsive metric columns and sensor tiles. Completed rows are informational; History and its View All action remain deferred. Background tokens now use the Figma off-white. TypeScript and the focused dashboard data checks pass; native visual comparison remains pending. The isolated web preview could not start because react-native-web is not installed. Existing ESLint configuration skips TypeScript/TSX files.
