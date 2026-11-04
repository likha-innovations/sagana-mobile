const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

// Load the real TypeScript logic without importing native React Native modules.
function loadSource(file, dependencies = {}) {
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
      setTimeout: (callback) => callback(),
      Date,
    },
    { filename },
  );
  return module.exports;
}

const fixtures = require("../src/data/data.json");
const helpers = loadSource("src/lib/dashboard.ts");
const types = loadSource("src/types/batch.ts");
const completed = types.completedBatchSchema
  .array()
  .parse(fixtures.completed_batches);

test("totals distinguish input and output weights and exclude removed machines", () => {
  const metrics = helpers.getDashboardMetrics(
    completed,
    fixtures.active_batches,
    fixtures.machines,
  );
  expect(metrics.totalCompost.value).toBe(106.2);
  expect(metrics.totalFeedstock.value).toBe(125.2);
  expect(metrics.completedBatches).toBe(3);
  expect(metrics.ongoingBatches).toBe(2);
  expect(metrics.ownedMachines).toBe(4);
  const empty = helpers.getDashboardMetrics(
    [],
    [],
    [{ removedAt: "2026-01-01" }],
  );
  expect(empty.totalCompost.value).toBe(0);
  expect(empty.completedBatches).toBe(0);
  expect(empty.ongoingBatches).toBe(0);
  expect(empty.ownedMachines).toBe(0);
});

test("recent batches sort newest first, cap at three, and preserve input order", () => {
  const input = [...completed].reverse();
  const originalIds = input.map((batch) => batch.id).join();
  const recent = helpers.getRecentCompletedBatches([
    ...input,
    {
      ...completed[0],
      id: "old",
      completionDate: "2020-01-01T00:00:00Z",
    },
  ]);
  expect(recent.length).toBe(3);
  expect(recent[0].id).toBe("completed-1");
  expect(input.map((batch) => batch.id).join()).toBe(originalIds);
});

test("batch creation calls the API and invalidates dashboard dependencies", async () => {
  const invalidations = [];
  const createdBatches = [];
  const hooks = loadSource("src/hooks/use-batches.ts", {
    "@tanstack/react-query": {
      useQuery: (options) => options,
      useMutation: (options) => options,
      useQueryClient: () => ({
        invalidateQueries: ({ queryKey }) =>
          invalidations.push(queryKey.join("/")),
        getQueryData: () => [],
      }),
    },
    "@/types/batch": types,
    "@/context/auth-context": {
      useAuthContext: () => ({
        user: { id: "user" },
        isLoaded: true,
        isSignedIn: true,
      }),
    },
    "./use-profile": {
      useProfile: () => ({ data: { barangayId: "barangay" }, isSuccess: true }),
    },
    "@/api/batch.api": {
      batchApi: {
        list: async () => createdBatches,
        create: async (input) => {
          const batch = { ...input, status: "active" };
          createdBatches.push(batch);
          return batch;
        },
      },
    },
    "@/api/feedstock.api": {
      feedstockApi: {
        getFeedstocks: async () => [],
      },
    },
    "@/lib/dashboard": helpers,
    "@/data/data.json": fixtures,
    "@/hooks/use-machines": {
      machineKeys: {
        all: ["machines"],
        detail: (id) => ["machines", id],
        feedstocks: (id) => ["machines", id, "feedstocks"],
      },
    },
  });
  const mutation = hooks.useCreateCompostBatch();
  const input = {
    machineId: "2",
    feedstocks: [{ id: "fs-1", weight: 10 }],
  };
  const created = await mutation.mutationFn(input);
  mutation.onSuccess(created, input);
  const batches = await hooks.useCompostBatches().queryFn();
  expect(
    helpers.getDashboardMetrics(completed, batches, fixtures.machines)
      .ongoingBatches,
  ).toBe(1);
  expect(
    helpers.getDashboardMetrics(completed, batches, fixtures.machines)
      .totalCompost.value,
  ).toBe(106.2);
  expect(invalidations.includes("batches")).toBeTruthy();
  expect(invalidations.includes("machines")).toBeTruthy();
  expect(() => mutation.mutationFn({ ...input, feedstocks: [] })).toThrow();
});
