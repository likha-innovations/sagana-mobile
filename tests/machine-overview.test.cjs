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
      setTimeout: (callback) => callback(),
      Date,
    },
    { filename },
  );
  return module.exports;
}
const fixtures = require("../src/data/data.json");
const logic = load("src/lib/machine-overview.ts");

test("occupancy follows active batch membership, independently of connectivity and readings", () => {
  const base = fixtures.machines[0];
  const batch = fixtures.active_batches[0];
  for (const status of ["active", "available", "maintenance", "offline"]) {
    const machine = { ...base, status, latest_readings: undefined };
    assert.equal(logic.getMachineState(machine, batch).vacant, false);
    assert.equal(
      logic.getMachineState(machine, batch).disconnected,
      status === "offline",
    );
    assert.equal(logic.getMachineState(machine, null).vacant, true);
  }
  assert.equal(
    logic.getMachineState(base, { ...batch, machine_id: "another" }).vacant,
    true,
  );
  assert.equal(
    logic.getMachineState(base, { ...batch, status: "completed" }).vacant,
    true,
  );
  assert.equal(logic.getMachinePhase(undefined, 30), null);
  assert.equal(logic.getMachinePhase(0, 30), 2);
  assert.equal(logic.getMachinePhase(57, 2), 1);
});

test("overview fixtures are valid, keyed to active batches, and separate current from initial weight", () => {
  const records = logic.machineOverviewSchema
    .array()
    .parse(fixtures.machine_overviews);
  for (const record of records) {
    const batch = fixtures.active_batches.find(
      (item) => item.batch_id === record.batch_id,
    );
    assert.equal(record.machine_id, batch.machine_id);
    assert.ok(
      record.current_weight >= 0 && record.current_weight < batch.total_weight,
    );
    assert.ok(Date.parse(record.recorded_at) >= Date.parse(batch.start_date));
    assert.equal(record.automations.length, 2);
  }
  assert.equal(
    logic.machineOverviewSchema.safeParse({ ...records[0], current_weight: -1 })
      .success,
    false,
  );
  assert.equal(
    logic.machineOverviewSchema.safeParse({ ...records[0], recorded_at: "bad" })
      .success,
    false,
  );
  assert.equal(
    logic.machineOverviewSchema.safeParse({
      ...records[0],
      current_weight: null,
    }).success,
    true,
  );
});

test("settings validate required values and preserve data when a machine is missing", async () => {
  assert.equal(logic.machineNameSchema.parse("  SAGANA  "), "SAGANA");
  assert.equal(logic.machineSsidSchema.safeParse("   ").success, false);
  assert.equal(logic.machineNameSchema.safeParse("   ").success, false);
  const invalidations = [];
  const hooks = load("src/hooks/use-machines.ts", {
    "@/lib/machine-overview": logic,
    "@/data/data.json": fixtures,
    "@tanstack/react-query": {
      useQuery: (options) => options,
      useMutation: (options) => options,
      useQueryClient: () => ({
        invalidateQueries: ({ queryKey }) =>
          invalidations.push(queryKey.join("/")),
      }),
    },
  });
  const rename = hooks.useUpdateMachineName();
  await assert.rejects(() => rename.mutationFn({ id: "missing", name: "New" }));
  await assert.rejects(() => rename.mutationFn({ id: "1", name: "  " }));
  const original = await hooks.useMachine("1").queryFn();
  assert.equal(original.name, fixtures.machines[0].name);
  await rename.mutationFn({ id: "1", name: " Renamed " });
  rename.onSuccess(undefined, { id: "1" });
  assert.equal((await hooks.useMachine("1").queryFn()).name, "Renamed");
  assert.ok(invalidations.includes("machines"));
  assert.ok(invalidations.includes("machines/1"));
  const wifi = hooks.useUpdateMachineWifi();
  await assert.rejects(() =>
    wifi.mutationFn({ id: "missing", wifi_ssid: "Mock" }),
  );
  await assert.rejects(() => wifi.mutationFn({ id: "1", wifi_ssid: " " }));
  assert.equal(
    (await hooks.useMachine("1").queryFn()).wifi_ssid,
    original.wifi_ssid,
  );
});
