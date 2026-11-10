const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

function load(file, dependencies = {}) {
  const filename = path.join(__dirname, "..", file);
  const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(
    code,
    {
      module,
      exports: module.exports,
      require: (name) => dependencies[name] ?? require(name),
    },
    { filename },
  );
  return module.exports;
}

const record = {
  id: "neo2",
  barangayId: "brgy_176",
  macAddress: "test-mac",
  name: "Neo2",
  status: "active",
  wifiSsid: null,
  lastSeen: null,
  createdAt: "2026-10-14T00:00:00.000Z",
  removedAt: null,
};

test("API validates list/detail fields, preserves nulls, and rejects invalid records", async () => {
  let response = [record];
  const paths = [];
  const { machineApi } = load("src/api/machine.api.ts", {
    "./client": {
      api: {
        get: async (path) => {
          paths.push(path);
          return path.includes("/readings?") ? { readings: [] } : response;
        },
      },
    },
    "@/types/machine": load("src/types/machine.ts"),
    "@/types/history": load("src/types/history.ts"),
  });
  const [machine] = await machineApi.getMachines();
  expect(machine.id).toBe(record.id);
  expect(machine.barangayId).toBe(record.barangayId);
  expect(machine.macAddress).toBe(record.macAddress);
  expect(machine.name).toBe(record.name);
  expect(machine.status).toBe(record.status);
  expect(machine.createdAt).toBe(record.createdAt);
  expect(machine.latestReadings).toBe(undefined);
  for (const key of ["wifiSsid", "lastSeen", "removedAt"])
    expect(machine[key]).toBe(null);
  response = record;
  expect(await machineApi.getMachine("neo2")).toEqual(machine);
  expect(paths).toEqual(["/machines", "/machines/neo2"]);
  response = { ...record, status: "invalid_status" };
  await expect((() => machineApi.getMachine("neo2"))()).rejects.toThrow();
});

test("machine details propagate machine request errors", async () => {
  const { machineApi } = load("src/api/machine.api.ts", {
    "./client": {
      api: {
        get: async () => {
          throw new Error("Machine unavailable");
        },
      },
    },
    "@/types/machine": load("src/types/machine.ts"),
    "@/types/history": load("src/types/history.ts"),
  });
  await expect(machineApi.getMachine("neo2")).rejects.toThrow(
    "Machine unavailable",
  );
});

test("machine hooks isolate account/barangay caches and hide denied cached data", async () => {
  let user = { id: "account-a" };
  let signedIn = true;
  let profile = {
    data: { barangayId: "brgy_176" },
    isSuccess: true,
    isError: false,
  };
  let result = { data: record, isError: false, isPending: false };
  const calls = [];
  const { useMachines, useMachine } = load("src/hooks/use-machines.ts", {
    "@/api/device.api": {},
    "@/api/machine.api": {
      machineApi: {
        getMachines: async () => {
          calls.push("list");
          return [record];
        },
        getMachine: async (id) => {
          calls.push(id);
          return record;
        },
      },
    },
    "@/context/auth-context": {
      useAuthContext: () => ({ user, isLoaded: true, isSignedIn: signedIn }),
    },
    "./use-profile": { useProfile: () => profile },
    "@/lib/machine-overview": {},
    "@tanstack/react-query": {
      useQuery: (options) => ({ ...options, ...result }),
      useQueryClient: () => ({ getQueryData: () => undefined }),
    },
  });
  const first = useMachines();
  expect(first.enabled).toBe(true);
  await first.queryFn();
  await useMachine("neo2").queryFn();
  expect(calls).toEqual(["list", "neo2"]);
  user = { id: "account-b" };
  expect(JSON.stringify(useMachines().queryKey)).not.toBe(
    JSON.stringify(first.queryKey),
  );
  profile = { ...profile, data: { barangayId: "brgy_177" } };
  expect(useMachine("neo2").queryKey.join("/")).toBe(
    "machines/account-b/brgy_177/detail/neo2",
  );
  result = { ...result, isError: true, error: new Error("404") };
  expect(useMachine("neo2").data).toBe(undefined);
  signedIn = false;
  expect(useMachines().enabled).toBe(false);
  expect(useMachines().data).toBe(undefined);
  signedIn = true;
  profile = {
    isSuccess: false,
    isError: true,
    error: new Error("Profile failed"),
    refetch: () => {},
  };
  expect(useMachines().isError).toBe(true);
  expect(useMachines().isPending).toBe(false);
  expect(useMachines().refetch).toBe(profile.refetch);
  expect(useMachines(false).enabled).toBe(false);
});

test("profile cache is account-scoped and updates evict old machine results", async () => {
  const events = [];
  const hooks = load("src/hooks/use-profile.ts", {
    "@/api/user.api": { userApi: {} },
    "@/lib/logger": { createLogger: () => ({ info() {} }) },
    "@/context/auth-context": {
      useAuthContext: () => ({
        user: { id: "account-a" },
        isLoaded: true,
        isSignedIn: true,
      }),
    },
    "@tanstack/react-query": {
      useQuery: (options) => options,
      useMutation: (options) => options,
      useQueryClient: () => ({
        cancelQueries: async ({ queryKey }) =>
          events.push(`cancel:${queryKey[0]}`),
        removeQueries: ({ queryKey }) => events.push(`remove:${queryKey[0]}`),
        setQueryData: (key) => events.push(key.join("/")),
        invalidateQueries: () => events.push("invalidate"),
      }),
    },
  });
  expect(hooks.useProfile().queryKey.join("/")).toBe("user/account-a/profile");
  await hooks
    .useUpdateProfile()
    .onSuccess({ id: "account-a", barangayId: "brgy_177" });
  expect(events).toEqual([
    "cancel:machines",
    "remove:machines",
    "remove:batches",
    "remove:history",
    "user/account-a/profile",
    "invalidate",
  ]);
});

test("TanStack cache cannot reuse another account or barangay's machine", async () => {
  const { QueryClient, QueryObserver } = require("@tanstack/react-query");
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  let userId = "account-a";
  let barangayId = "brgy_176";
  const { useMachine, machineKeys } = load("src/hooks/use-machines.ts", {
    "@/api/device.api": {},
    "@/api/machine.api": { machineApi: {} },
    "@/context/auth-context": {
      useAuthContext: () => ({
        user: { id: userId },
        isLoaded: true,
        isSignedIn: true,
      }),
    },
    "./use-profile": {
      useProfile: () => ({
        data: { barangayId },
        isSuccess: true,
        isError: false,
      }),
    },
    "@/lib/machine-overview": {},
    "@tanstack/react-query": {
      useQuery: (options) =>
        new QueryObserver(client, options).getOptimisticResult(options),
      useQueryClient: () => client,
    },
  });
  const key = machineKeys.detail(userId, barangayId, "neo2");
  client.setQueryData(key, record);
  expect(useMachine("neo2").data.name).toBe("Neo2");
  userId = "account-b";
  expect(useMachine("neo2").data).toBe(undefined);
  userId = "account-a";
  barangayId = "brgy_177";
  expect(useMachine("neo2").data).toBe(undefined);
  barangayId = "brgy_176";
  await expect(
    (() =>
      client.fetchQuery({
        queryKey: key,
        queryFn: async () => {
          throw new Error("Machine not found");
        },
      }))(),
  ).rejects.toThrow();
  expect(client.getQueryData(key).name).toBe("Neo2");
  expect(useMachine("neo2").data).toBe(undefined);
  client.clear();
});

test("preserves newer cached latestReadings when fetching machines or machine detail", async () => {
  const cachedReadings = {
    temperature: 45.2,
    moisture: 55,
    oxygen: 19.1,
    co2: 800,
    updatedAt: "2026-11-10T12:00:00.000Z",
  };
  const olderRemoteRecord = {
    ...record,
    latestReadings: {
      temperature: 30,
      moisture: 40,
      oxygen: 15,
      co2: 600,
      updatedAt: "2026-11-10T10:00:00.000Z",
    },
  };
  const listKey = ["machines", "u1", "b1", "list"];
  const detailKey = ["machines", "u1", "b1", "detail", "neo2"];
  const mockCache = new Map();
  mockCache.set(JSON.stringify(listKey), [
    { ...record, latestReadings: cachedReadings },
  ]);
  mockCache.set(JSON.stringify(detailKey), {
    ...record,
    latestReadings: cachedReadings,
  });

  const { useMachines, useMachine } = load("src/hooks/use-machines.ts", {
    "@/api/device.api": {},
    "@/api/machine.api": {
      machineApi: {
        getMachines: async () => [olderRemoteRecord],
        getMachine: async () => olderRemoteRecord,
      },
    },
    "@/context/auth-context": {
      useAuthContext: () => ({
        user: { id: "u1" },
        isLoaded: true,
        isSignedIn: true,
      }),
    },
    "./use-profile": {
      useProfile: () => ({
        data: { barangayId: "b1" },
        isSuccess: true,
        isError: false,
      }),
    },
    "@/lib/machine-overview": {},
    "@tanstack/react-query": {
      useQuery: (options) => options,
      useQueryClient: () => ({
        getQueryData: (k) => mockCache.get(JSON.stringify(k)),
      }),
    },
  });

  const listResult = await useMachines().queryFn();
  expect(listResult[0].latestReadings).toEqual(cachedReadings);

  const detailResult = await useMachine("neo2").queryFn();
  expect(detailResult.latestReadings).toEqual(cachedReadings);
});
