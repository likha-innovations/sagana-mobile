const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

function load(file, dependencies = {}) {
  const filename = path.join(__dirname, "..", file);
  const module = { exports: {} };
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
      },
    }).outputText,
    {
      module,
      exports: module.exports,
      Date,
      require: (name) => dependencies[name] ?? require(name),
    },
    { filename },
  );
  return module.exports;
}
const h = load("src/lib/history.ts");
const fixtures = require("../src/data/data.json");
const schemas = load("src/types/history.ts");
const stamp = (day, hour = 0, minute = 0) =>
  new Date(2026, 0, day, hour, minute).toISOString();

test("search combines trimmed case-insensitive codes with inclusive local dates", () => {
  const batches = [
    { batch_id: "a", batch_code: "SG-Alpha", completion_date: stamp(2) },
    {
      batch_id: "b",
      batch_code: "sg-alpha-2",
      completion_date: stamp(2, 23, 59),
    },
    { batch_id: "c", batch_code: "SG-Alpha", completion_date: stamp(3) },
    { batch_id: "d", batch_code: "SG-Beta", completion_date: stamp(2) },
  ];
  const range = { startDate: "2026-01-02", endDate: "2026-01-02" };
  assert.equal(
    h
      .filterCompletedBatches(batches, "  ALPHA ", range)
      .map((b) => b.batch_id)
      .join(),
    "b,a",
  );
  assert.equal(batches[0].batch_id, "a");
  assert.equal(h.isInRange(stamp(1, 23, 59), range), false);
  assert.equal(h.filterCompletedBatches(batches, "missing", range).length, 0);
});

test("month presets cross years and include the current month", () => {
  const now = new Date(2026, 0, 31);
  assert.equal(
    h.historyRange("This month", undefined, now).startDate,
    "2026-01-01",
  );
  assert.equal(
    h.historyRange("Last 6 months", undefined, now).startDate,
    "2025-08-01",
  );
  assert.equal(
    h.historyRange("Last 12 months", undefined, now).startDate,
    "2025-02-01",
  );
  assert.equal(
    h.historyRange("Last 6 months", undefined, now).endDate,
    "2026-01-31",
  );
  assert.equal(h.historyRange("All time"), undefined);
  const week = h.sensorRange("Per week", new Date(2026, 0, 1));
  assert.equal(week.startDate, "2025-12-29");
  assert.equal(week.endDate, "2026-01-04");
});

test("range selection supports same-day, reversed and incomplete ranges", () => {
  const first = h.nextRangeSelection(
    { startDate: null, endDate: null },
    "2026-01-03",
  );
  assert.equal(first.endDate, null);
  assert.equal(h.nextRangeSelection(first, "2026-01-03").endDate, "2026-01-03");
  const reversed = h.nextRangeSelection(first, "2026-01-01");
  assert.equal(reversed.startDate, "2026-01-01");
  assert.equal(reversed.endDate, "2026-01-03");
  assert.equal(h.nextRangeSelection(reversed, "2026-01-04").endDate, null);
});

test("hourly and daily means isolate batches and preserve missing sensor intervals", () => {
  const reading = (batch_id, recorded_at, temperature, moisture = null) => ({
    batch_id,
    machine_id: batch_id,
    recorded_at,
    temperature,
    moisture,
    oxygen: null,
    co2: null,
  });
  const readings = [
    reading("a", stamp(2, 1, 10), 10, 0),
    reading("a", stamp(2, 1, 40), 30),
    reading("a", stamp(2, 3), 50),
    reading("b", stamp(2, 1), 1000),
    reading("a", stamp(4), 1000),
  ];
  const range = { startDate: "2026-01-02", endDate: "2026-01-02" };
  const scoped = h.selectHistory(readings, [], {
    kind: "machine",
    machineId: "a",
  }).readings;
  const hourly = h.aggregateReadings(scoped, range, true);
  assert.equal(hourly.temperature.length, 24);
  assert.equal(hourly.temperature[1].value, 20);
  assert.equal(hourly.temperature[2].value, null);
  assert.equal(hourly.moisture[1].value, 0);
  assert.equal(hourly.moisture[3].value, null);
  assert.equal(hourly.temperature[3].x, 3 / 24);
  const daily = h.aggregateReadings(
    scoped,
    { ...range, endDate: "2026-01-03" },
    false,
  );
  assert.equal(daily.temperature[0].value, 30);
  assert.equal(daily.temperature[1].value, null);
  const svg = h.buildChartPath(hourly.temperature, 100);
  assert.equal((svg.match(/M /g) ?? []).length, 2);
  assert.equal(svg.includes("L "), false);
  assert.equal(h.buildChartPath(hourly.co2, 100), "");
});

test("fixtures validate, stay inside their batches and preserve initial feedstock weights", () => {
  const readings = schemas.historyReadingSchema
    .array()
    .parse(fixtures.history_readings);
  const logs = schemas.historyEventSchema
    .array()
    .parse(fixtures.history_events);
  for (const batch of fixtures.completed_batches) {
    assert.equal(
      Number(
        batch.feedstocks.reduce((sum, f) => sum + f.weight_kg, 0).toFixed(2),
      ),
      batch.total_weight,
    );
    assert.notEqual(batch.total_weight, batch.final_weight);
    assert.ok(readings.some((r) => r.batch_id === batch.batch_id));
    assert.ok(logs.some((r) => r.batch_id === batch.batch_id));
  }
  for (const event of [...readings, ...logs]) {
    const machine = fixtures.machines.find(
      (m) => m.machine_id === event.machine_id,
    );
    assert.ok(machine);
    assert.ok(
      Date.parse(event.recorded_at ?? event.created_at) >=
        Date.parse(machine.created_at),
    );
    if (event.batch_id === null) continue;
    const batch = fixtures.completed_batches.find(
      (b) => b.batch_id === event.batch_id,
    );
    assert.ok(batch);
    const time = Date.parse(event.recorded_at ?? event.created_at);
    assert.ok(
      time >= Date.parse(batch.start_date) &&
        time <= Date.parse(batch.completion_date),
    );
  }
  assert.equal(
    schemas.historyReadingSchema.safeParse({ ...readings[0], moisture: 101 })
      .success,
    false,
  );
});

function sheetHarness(file, exportName) {
  let slots = [],
    cursor = 0;
  const react = {
    forwardRef: (render) => render,
    useState: (initial) => {
      const index = cursor++;
      if (!(index in slots)) slots[index] = initial;
      return [
        slots[index],
        (next) => {
          slots[index] = typeof next === "function" ? next(slots[index]) : next;
        },
      ];
    },
    useRef: (initial) => {
      const index = cursor++;
      return slots[index] ?? (slots[index] = { current: initial });
    },
    useEffect: () => {},
    useCallback: (callback) => callback,
    useMemo: (callback) => callback(),
  };
  const native = {
    View: "View",
    Text: "Text",
    Pressable: "Pressable",
    useWindowDimensions: () => ({ height: 800 }),
    BackHandler: { addEventListener: () => ({ remove() {} }) },
  };
  const jsx = (type, props) => ({ type, props });
  const colors = { semantic: {}, gray: {}, brand: {} };
  const component = load(file, {
    react,
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "react-native": native,
    "@gorhom/bottom-sheet": {
      BottomSheetModal: "Modal",
      BottomSheetBackdrop: "Backdrop",
      BottomSheetScrollView: "Scroll",
    },
    "lucide-react-native": { ChevronRight: "Chevron" },
    "react-native-calendars": { Calendar: "Calendar" },
    "@/hooks/use-layout": {
      useDynamicLayout: () => ({
        headerPaddingTop: 48,
        stackScrollPadding: 40,
      }),
    },
    "@/constants": { colors },
    "@/lib/history": h,
    "./button": { Button: "Button" },
  })[exportName];
  return (props) => {
    cursor = 0;
    return component(props, { current: null });
  };
}
function nodes(tree, type) {
  if (!tree || typeof tree !== "object") return [];
  if (Array.isArray(tree)) return tree.flatMap((node) => nodes(node, type));
  return [
    ...(tree.type === type ? [tree] : []),
    ...nodes(tree.props?.children, type),
  ];
}

test("filter sheet drafts cancel, reopen and apply; legacy callers still select immediately", () => {
  const render = sheetHarness(
    "src/components/ui/filter-bottom-sheet.tsx",
    "FilterBottomSheet",
  );
  const applied = [],
    selected = [];
  const props = {
    selectedFilter: "All time",
    options: ["All time", "This month"],
    onSelectFilter: (value) => selected.push(value),
    onApply: (value) => applied.push(value),
  };
  let tree = render(props);
  tree.props.onChange(0);
  tree = render(props);
  nodes(tree, "Pressable")[1].props.onPress();
  assert.equal(applied.length, 0);
  tree.props.onDismiss();
  tree.props.onChange(0);
  tree = render(props);
  nodes(tree, "Button")[0].props.onPress();
  assert.equal(applied.join(), "All time");
  nodes(tree, "Pressable")[1].props.onPress();
  tree = render(props);
  nodes(tree, "Button")[0].props.onPress();
  assert.equal(applied.join(), "All time,This month");
  tree = render({ ...props, onApply: undefined });
  nodes(tree, "Pressable")[1].props.onPress();
  assert.equal(selected.join(), "This month");
});

test("date sheet cancels drafts, restores applied dates and refuses incomplete selection", () => {
  const render = sheetHarness(
    "src/components/ui/date-range-picker.tsx",
    "DateRangePicker",
  );
  const applied = [];
  const props = {
    initialStartDate: "2026-01-02",
    initialEndDate: "2026-01-03",
    minDate: "2026-01-01",
    maxDate: "2026-01-31",
    onApply: (range) => applied.push(range),
  };
  let tree = render(props);
  tree.props.onChange(0);
  tree = render(props);
  nodes(tree, "Calendar")[0].props.onDayPress({ dateString: "2026-01-05" });
  tree = render(props);
  assert.equal(nodes(tree, "Button")[0].props.disabled, true);
  nodes(tree, "Button")[0].props.onPress();
  assert.equal(applied.length, 0);
  tree.props.onDismiss();
  tree.props.onChange(0);
  tree = render(props);
  assert.equal(nodes(tree, "Button")[0].props.disabled, false);
  nodes(tree, "Button")[0].props.onPress();
  assert.equal(applied[0].startDate, "2026-01-02");
  assert.equal(applied[0].endDate, "2026-01-03");
});

test("machine scope includes multiple batches and unassigned records without crossing machines", () => {
  const result = h.selectHistory(
    fixtures.history_readings,
    fixtures.history_events,
    { kind: "machine", machineId: "1" },
  );
  assert.ok(result.readings.every((r) => r.machine_id === "1"));
  assert.ok(result.logs.every((r) => r.machine_id === "1"));
  assert.ok(result.readings.some((r) => r.batch_id === "completed-1"));
  assert.ok(result.readings.some((r) => r.batch_id === "completed-3"));
  assert.ok(result.readings.some((r) => r.batch_id === null));
  assert.ok(result.logs.some((r) => r.batch_id === null));
});

test("batch scope requires membership, matching machine and inclusive lifetime boundaries", () => {
  const batch = fixtures.completed_batches[0];
  const original = fixtures.history_readings.find(
    (r) => r.batch_id === batch.batch_id,
  );
  const samples = [
    { ...original, recorded_at: batch.start_date },
    { ...original, recorded_at: batch.completion_date },
    {
      ...original,
      recorded_at: new Date(Date.parse(batch.start_date) - 1).toISOString(),
    },
    {
      ...original,
      recorded_at: new Date(
        Date.parse(batch.completion_date) + 1,
      ).toISOString(),
    },
    { ...original, batch_id: null },
    { ...original, batch_id: "another-batch" },
    { ...original, machine_id: "another-machine" },
  ];
  const events = samples.map((r, i) => ({
    ...r,
    id: String(i),
    created_at: r.recorded_at,
    type: "blower_on",
    message: "Recorded",
  }));
  const scope = { kind: "batch", batchId: batch.batch_id };
  const selected = h.selectHistory(samples, events, scope, batch);
  assert.equal(selected.readings.length, 2);
  assert.equal(selected.logs.length, 2);
  assert.equal(selected.readings[0].recorded_at, batch.start_date);
  assert.equal(selected.logs[0].created_at, batch.completion_date);
  assert.equal(h.selectHistory(samples, events, scope).readings.length, 0);
});

test("automation grouping sorts actual local dates and preserves input order and timestamps", () => {
  const logs = [stamp(2), stamp(1, 23, 59), stamp(2, 23, 59)].map(
    (created_at, id) => ({ id: String(id), created_at }),
  );
  const before = JSON.stringify(logs);
  const groups = h.groupHistoryEvents(logs);
  assert.equal(groups.length, 2);
  assert.equal(groups[0].data.map((l) => l.id).join(), "2,0");
  assert.equal(groups[1].data[0].id, "1");
  assert.equal(JSON.stringify(logs), before);
  const filtered = h.groupHistoryEvents(logs, {
    startDate: "2026-01-02",
    endDate: "2026-01-02",
  });
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].data.length, 2);
});

test("machine presets use inclusive local calendar days across year boundaries", () => {
  const now = new Date(2026, 0, 3, 12);
  assert.equal(h.historyRange("Today", undefined, now).startDate, "2026-01-03");
  assert.equal(
    h.historyRange("Last 7 days", undefined, now).startDate,
    "2025-12-28",
  );
  assert.equal(
    h.historyRange("Last 31 days", undefined, now).startDate,
    "2025-12-04",
  );
  assert.equal(
    h.historyRange("Last 7 days", undefined, now).endDate,
    "2026-01-03",
  );
});

test("migrated machine samples retain values with explicit daily positions and no inferred batch", () => {
  const samples = fixtures.history_readings.filter(
    (r) => r.machine_id === "1" && r.batch_id === null,
  );
  assert.equal(
    samples.map((r) => r.temperature).join(),
    "20,30,45,55,60,45,40",
  );
  assert.equal(samples[0].recorded_at, "2026-09-29T16:00:00.000Z");
  assert.equal(
    Date.parse(samples.at(-1).recorded_at) - Date.parse(samples[0].recorded_at),
    86400000,
  );
  assert.equal(
    new Set(fixtures.history_events.map((e) => e.id)).size,
    fixtures.history_events.length,
  );
  for (const type of [
    "blower_on",
    "blower_off",
    "sprinkler_on",
    "sprinkler_off",
    "emergency_stop",
    "ventilation_adjust",
  ]) {
    assert.equal(
      schemas.historyEventSchema.safeParse({
        ...fixtures.history_events[0],
        type,
      }).success,
      true,
    );
  }
});

test("history queries separate scope caches, load only relevant metadata and handle missing entities", async () => {
  const cache = new Map();
  const requests = [];
  const enabled = [];
  const { useHistory } = load("src/hooks/use-history.ts", {
    "@/data/data.json": fixtures,
    "@/types/history": schemas,
    "@/lib/history": h,
    "./use-batches": {
      useCompletedBatches: (active) => {
        enabled.push(["batch", active]);
        return {
          data: fixtures.completed_batches,
          isPending: false,
          refetch() {},
        };
      },
    },
    "./use-machines": {
      useMachines: (active) => {
        enabled.push(["machine", active]);
        return { data: fixtures.machines, isPending: false, refetch() {} };
      },
    },
    "@tanstack/react-query": {
      useQuery: (options) => {
        const key = options.queryKey.join("/");
        if (options.enabled && !cache.has(key))
          requests.push(options.queryFn().then((data) => cache.set(key, data)));
        return {
          data: cache.get(key),
          isPending: !cache.has(key),
          refetch() {},
        };
      },
    },
  });
  const batchScope = { kind: "batch", batchId: "completed-1" };
  const machineScope = { kind: "machine", machineId: "1" };
  useHistory(batchScope);
  useHistory(machineScope);
  await Promise.all(requests);
  const batch = useHistory(batchScope),
    machine = useHistory(machineScope);
  assert.ok(batch.readings.every((r) => r.batch_id === "completed-1"));
  assert.ok(machine.readings.length > batch.readings.length);
  assert.ok(cache.has("history/batch/completed-1"));
  assert.ok(cache.has("history/machine/1"));
  assert.equal(
    enabled
      .slice(0, 4)
      .map(([kind, active]) => kind + ":" + active)
      .join(),
    "batch:true,machine:false,batch:false,machine:true",
  );
  assert.equal(
    batch.readings[0].recorded_at,
    fixtures.history_readings.find((r) => r.batch_id === "completed-1")
      .recorded_at,
  );
  const missing = useHistory({ kind: "machine", machineId: "missing" });
  assert.equal(missing.exists, false);
  assert.equal(missing.isPending, false);
  assert.equal(missing.readings.length, 0);
});

test("route wrappers preserve scope and log every focus visit", () => {
  for (const kind of ["machine", "batch"]) {
    for (const sensor of [true, false]) {
      const component = sensor
        ? "SensorHistoryScreen"
        : "AutomationHistoryScreen";
      const folder = kind === "batch" ? "history/[batchId]" : "machines/[id]";
      const route = sensor ? "sensors-history" : "automation-logs";
      const callbacks = [],
        logs = [];
      const screen = load(`app/(app)/(tabs)/${folder}/${route}.tsx`, {
        react: { useCallback: (callback) => callback },
        "react/jsx-runtime": { jsx: (type, props) => ({ type, props }) },
        "expo-router": {
          useLocalSearchParams: () => ({ id: "1", batchId: "completed-1" }),
          useFocusEffect: (callback) => callbacks.push(callback),
        },
        "@/lib/logger": {
          createLogger: (context) => ({
            screen: (name, params) => logs.push({ context, name, params }),
          }),
        },
        [`@/components/history/${sensor ? "sensor" : "automation"}-history-screen`]:
          { [component]: component },
      }).default();
      assert.equal(screen.type, component);
      assert.equal(screen.props.scope.kind, kind);
      assert.equal(
        screen.props.scope[kind === "batch" ? "batchId" : "machineId"],
        kind === "batch" ? "completed-1" : "1",
      );
      callbacks[0]();
      callbacks[0]();
      assert.equal(logs.length, 2);
      assert.equal(
        logs[0].params[kind === "batch" ? "batchId" : "id"],
        kind === "batch" ? "completed-1" : "1",
      );
    }
  }
});
