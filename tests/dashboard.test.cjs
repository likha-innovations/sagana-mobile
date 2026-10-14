const assert = require("node:assert/strict");
const { test } = require("node:test");
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
  assert.equal(metrics.totalCompost.value, 106.2);
  assert.equal(metrics.totalFeedstock.value, 125.2);
  assert.equal(metrics.completedBatches, 3);
  assert.equal(metrics.ongoingBatches, 2);
  assert.equal(metrics.ownedMachines, 4);
  const empty = helpers.getDashboardMetrics(
    [],
    [],
    [{ removed_at: "2026-01-01" }],
  );
  assert.equal(empty.totalCompost.value, 0);
  assert.equal(empty.completedBatches, 0);
  assert.equal(empty.ongoingBatches, 0);
  assert.equal(empty.ownedMachines, 0);
});

test("recent batches sort newest first, cap at three, and preserve input order", () => {
  const input = [...completed].reverse();
  const originalIds = input.map((batch) => batch.batch_id).join();
  const recent = helpers.getRecentCompletedBatches([
    ...input,
    {
      ...completed[0],
      batch_id: "old",
      completion_date: "2020-01-01T00:00:00Z",
    },
  ]);
  assert.equal(recent.length, 3);
  assert.equal(recent[0].batch_id, "completed-1");
  assert.equal(input.map((batch) => batch.batch_id).join(), originalIds);
});

test("local mock creation updates ongoing counts and invalidates dashboard dependencies", async () => {
  const invalidations = [];
  const statusChanges = [];
  const hooks = loadSource("src/hooks/use-batches.ts", {
    "@tanstack/react-query": {
      useQuery: (options) => options,
      useMutation: (options) => options,
      useQueryClient: () => ({
        invalidateQueries: ({ queryKey }) =>
          invalidations.push(queryKey.join("/")),
      }),
    },
    "@/types/batch": types,
    "@/lib/dashboard": helpers,
    "@/data/data.json": fixtures,
    "@/hooks/use-machines": {
      machineKeys: {
        all: ["machines"],
        detail: (id) => ["machines", id],
        feedstocks: (id) => ["machines", id, "feedstocks"],
      },
      setMockMachineStatus: (id, status) =>
        statusChanges.push(`${id}/${status}`),
    },
  });
  const mutation = hooks.useCreateCompostBatch();
  const input = {
    machine_id: "2",
    feedstocks: [{ feedstock_id: "fs-1", weight: 10 }],
  };
  const created = await mutation.mutationFn(input);
  mutation.onSuccess(created, input);
  const batches = await hooks.useCompostBatches().queryFn();
  assert.equal(
    helpers.getDashboardMetrics(completed, batches, fixtures.machines)
      .ongoingBatches,
    1,
  );
  assert.equal(
    helpers.getDashboardMetrics(completed, batches, fixtures.machines)
      .totalCompost.value,
    106.2,
  );
  assert.equal(statusChanges.join(), "2/active");
  assert.ok(invalidations.includes("batches"));
  assert.ok(invalidations.includes("machines"));
  await assert.rejects(() => mutation.mutationFn({ ...input, feedstocks: [] }));
});
