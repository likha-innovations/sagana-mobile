# State Management

TanStack Query v5 caches profile, barangay, machine and batch queries. Machines and feedstocks use backend APIs; batches and history remain local or empty.

## State ownership

| State | Owner / source |
| --- | --- |
| Session and normalized user | `src/context/auth-context.tsx`, backed by Clerk |
| Profile | `useProfile()` / `useUpdateProfile()` → `GET/PATCH /me` |
| Barangays | `useBarangays()` → public barangay API |
| Machines | `use-machines.ts` → authenticated `/machines` API; socket events update the cache |
| Feedstocks | `use-batches.ts` → public feedstock API |
| Batches, logs and sensor history | Local mock batches and empty history queries |
| Toast visibility/message | Zustand store in `components/ui/toast.tsx` |
| Form/wizard steps | Screen-local React state; some forms use React Hook Form/Zod |
| Password-change handoff | `lib/password-flow-store.ts`, temporary in-memory state |
| BLE connection / socket events | Dedicated hooks and native/socket instances |

## Cache behavior

The root creates one `QueryClient` with a five-minute default `staleTime` and two query retries. Query-key factories are `userKeys`, `machineKeys` and `batchKeys`.

1. Profile save updates the cached profile and invalidates its query.
2. Machine rename, SSID change and removal call the backend, then invalidate relevant machine queries.
3. Batch creation validates with `createBatchInputSchema`, appends a mock batch and invalidates related batch/machine queries. Dashboard totals derive from query results.
4. The signed-out route redirect clears the QueryClient. Module-level mock arrays have a separate lifetime and reset on JS runtime reload.

Batch mutations are not a persistent backend or offline store. See [current UI limits](/guide/ui-status#known-limits-for-demos-and-qa).
