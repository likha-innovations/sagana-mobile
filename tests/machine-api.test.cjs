const assert = require("node:assert/strict");
const { test } = require("node:test");
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

test("API maps list/detail fields, preserves nulls, and rejects invalid records", async () => {
  let response = [record];
  const paths = [];
  const { machineApi } = load("src/api/machine.api.ts", {
    "./client": {
      api: {
        get: async (path) => {
          paths.push(path);
          return response;
        },
      },
    },
    "@/types/machine": load("src/types/machine.ts"),
  });
  const [machine] = await machineApi.getMachines();
  assert.equal(machine.id, record.id);
  assert.equal(machine.barangay_id, record.barangayId);
  assert.equal(machine.mac_address, record.macAddress);
  assert.equal(machine.name, record.name);
  assert.equal(machine.status, record.status);
  assert.equal(machine.created_at, record.createdAt);
  assert.equal(machine.latest_readings, undefined);
  for (const key of ["wifi_ssid", "last_seen", "removed_at"])
    assert.equal(machine[key], null);
  response = record;
  assert.deepEqual(await machineApi.getMachine("neo2"), machine);
  assert.deepEqual(paths, ["/machines", "/machines/neo2"]);
  response = { ...record, createdAt: "invalid" };
  await assert.rejects(() => machineApi.getMachine("neo2"));
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
    },
  });
  const first = useMachines();
  assert.equal(first.enabled, true);
  await first.queryFn();
  await useMachine("neo2").queryFn();
  assert.deepEqual(calls, ["list", "neo2"]);
  user = { id: "account-b" };
  assert.notEqual(
    JSON.stringify(useMachines().queryKey),
    JSON.stringify(first.queryKey),
  );
  profile = { ...profile, data: { barangayId: "brgy_177" } };
  assert.equal(
    useMachine("neo2").queryKey.join("/"),
    "machines/account-b/brgy_177/detail/neo2",
  );
  result = { ...result, isError: true, error: new Error("404") };
  assert.equal(useMachine("neo2").data, undefined);
  signedIn = false;
  assert.equal(useMachines().enabled, false);
  assert.equal(useMachines().data, undefined);
  signedIn = true;
  profile = {
    isSuccess: false,
    isError: true,
    error: new Error("Profile failed"),
    refetch: () => {},
  };
  assert.equal(useMachines().isError, true);
  assert.equal(useMachines().isPending, false);
  assert.equal(useMachines().refetch, profile.refetch);
  assert.equal(useMachines(false).enabled, false);
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
  assert.equal(hooks.useProfile().queryKey.join("/"), "user/account-a/profile");
  await hooks
    .useUpdateProfile()
    .onSuccess({ id: "account-a", barangayId: "brgy_177" });
  assert.deepEqual(events, [
    "cancel:machines",
    "remove:machines",
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
    },
  });
  const key = machineKeys.detail(userId, barangayId, "neo2");
  client.setQueryData(key, record);
  assert.equal(useMachine("neo2").data.name, "Neo2");
  userId = "account-b";
  assert.equal(useMachine("neo2").data, undefined);
  userId = "account-a";
  barangayId = "brgy_177";
  assert.equal(useMachine("neo2").data, undefined);
  barangayId = "brgy_176";
  await assert.rejects(() =>
    client.fetchQuery({
      queryKey: key,
      queryFn: async () => {
        throw new Error("Machine not found");
      },
    }),
  );
  assert.equal(client.getQueryData(key).name, "Neo2");
  assert.equal(useMachine("neo2").data, undefined);
  client.clear();
});
