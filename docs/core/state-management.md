# State Management

TanStack Query v5 caches profile, barangay, machine and batch queries. A query hook does not necessarily fetch from the backend: machine and batch hooks currently use local fixtures.

## State ownership

| State | Owner / source |
| --- | --- |
| Session and normalized user | `src/context/auth-context.tsx`, backed by Clerk |
| Profile | `useProfile()` / `useUpdateProfile()` → `GET/PATCH /me` |
| Barangays | `useBarangays()` → public barangay API |
| Machines, logs and sensor history | `use-machines.ts` → `src/data/data.json` and an in-memory machine array |
| Feedstocks, batches and dashboard totals | `use-batches.ts` → fixtures and in-memory arrays |
| Toast visibility/message | Zustand store in `components/ui/toast.tsx` |
| Form/wizard steps | Screen-local React state; some forms use React Hook Form/Zod |
| Password-change handoff | `lib/password-flow-store.ts`, temporary in-memory state |
| BLE connection / socket events | Dedicated hooks and native/socket instances |

## Cache behavior

The root creates one `QueryClient` with a five-minute default `staleTime` and two query retries. Query-key factories are `userKeys`, `machineKeys` and `batchKeys`.

1. Profile save updates the cached profile and invalidates its query.
2. Machine rename, SSID change and removal mutate the mock array, then invalidate relevant machine queries.
3. Batch creation validates with `createBatchInputSchema`, appends a mock batch, marks the mock machine active and invalidates related batch/machine queries. Totals still come from the dashboard fixture.
4. The signed-out route redirect clears the QueryClient. Module-level mock arrays have a separate lifetime and reset on JS runtime reload.

These mutations are not a persistent backend or offline store. When integrating real machine/batch APIs, preserve the query keys and replace mock operations with typed API calls. See [current UI limits](/guide/ui-status#known-limits-for-demos-and-qa).
