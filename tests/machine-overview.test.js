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
    const machine = { ...base, status, latestReadings: undefined };
    expect(logic.getMachineState(machine, batch).vacant).toBe(false);
    expect(logic.getMachineState(machine, batch).disconnected).toBe(
      status === "offline",
    );
    expect(logic.getMachineState(machine, null).vacant).toBe(true);
  }
  expect(
    logic.getMachineState(base, { ...batch, machineId: "another" }).vacant,
  ).toBe(true);
  expect(
    logic.getMachineState(base, { ...batch, status: "completed" }).vacant,
  ).toBe(true);
  expect(logic.getMachinePhase(undefined, 30)).toBe(null);
  expect(logic.getMachinePhase(0, 30)).toBe(2);
  expect(logic.getMachinePhase(57, 2)).toBe(1);
});

test("overview fixtures are valid, keyed to active batches, and separate current from initial weight", () => {
  const records = logic.machineOverviewSchema
    .array()
    .parse(fixtures.machine_overviews);
  for (const record of records) {
    const batch = fixtures.active_batches.find(
      (item) => item.id === record.batchId,
    );
    expect(record.machineId).toBe(batch.machineId);
    expect(
      record.currentWeight >= 0 && record.currentWeight < batch.totalWeight,
    ).toBeTruthy();
    expect(
      Date.parse(record.recordedAt) >= Date.parse(batch.startDate),
    ).toBeTruthy();
    expect(record.automations.length).toBe(2);
  }
  expect(
    logic.machineOverviewSchema.safeParse({ ...records[0], currentWeight: -1 })
      .success,
  ).toBe(false);
  expect(
    logic.machineOverviewSchema.safeParse({ ...records[0], recordedAt: "bad" })
      .success,
  ).toBe(false);
  expect(
    logic.machineOverviewSchema.safeParse({
      ...records[0],
      currentWeight: null,
    }).success,
  ).toBe(true);
});

test("settings validate required values and preserve data when a machine is missing", async () => {
  expect(logic.machineNameSchema.parse("  SAGANA  ")).toBe("SAGANA");
  expect(logic.machineNameSchema.safeParse("a".repeat(31)).success).toBe(false);
  expect(logic.machineNameSchema.safeParse("a".repeat(30)).success).toBe(true);
  expect(logic.machineSsidSchema.safeParse("   ").success).toBe(false);
  expect(logic.machineNameSchema.safeParse("   ").success).toBe(false);
  const invalidations = [];
  const hooks = load("src/hooks/use-machines.ts", {
    "@/api/device.api": {},
    "@/api/machine.api": {},
    "@/context/auth-context": {},
    "./use-profile": {},
    "@/lib/machine-overview": logic,
    "@/data/data.json": fixtures,
    "@tanstack/react-query": {
      useQuery: (options) => options,
      useMutation: (options) => options,
      useQueryClient: () => ({
        invalidateQueries: ({ queryKey }) => {
          if (queryKey) invalidations.push(queryKey.join("/"));
        },
      }),
    },
  });
  const rename = hooks.useUpdateMachineName();
  await expect(
    (() => rename.mutationFn({ id: "missing", name: "New" }))(),
  ).rejects.toThrow();
  await expect(
    (() => rename.mutationFn({ id: "1", name: "  " }))(),
  ).rejects.toThrow();
  await expect(
    (() => rename.mutationFn({ id: "1", name: " Renamed " }))(),
  ).rejects.toThrow();
  rename.onSuccess(undefined, { id: "1" });
  expect(invalidations.includes("machines")).toBeTruthy();
  const wifi = hooks.useUpdateMachineWifi();
  await expect(
    (() => wifi.mutationFn({ id: "missing", wifiSsid: "Mock" }))(),
  ).rejects.toThrow();
  await expect(
    (() => wifi.mutationFn({ id: "1", wifiSsid: " " }))(),
  ).rejects.toThrow();
});
