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

test("sensor chart preserves the latest actual reading and its timestamp within each interval", () => {
  const base = {
    machineId: "m",
    batchId: null,
    moisture: null,
    oxygen: null,
    co2: null,
  };
  const readings = [
    { ...base, recordedAt: stamp(2, 10, 5), temperature: 20 },
    { ...base, recordedAt: stamp(2, 10, 45), temperature: 30 },
  ];
  const point = h.aggregateReadings(
    readings,
    { startDate: "2026-01-02", endDate: "2026-01-02" },
    true,
  ).temperature[10];
  expect(point.value).toBe(30);
  expect(point.recordedAt).toBe(readings[1].recordedAt);
});

test("search combines trimmed case-insensitive codes with inclusive local dates", () => {
  const batches = [
    { id: "a", batchCode: "SG-Alpha", completionDate: stamp(2) },
    {
      id: "b",
      batchCode: "sg-alpha-2",
      completionDate: stamp(2, 23, 59),
    },
    { id: "c", batchCode: "SG-Alpha", completionDate: stamp(3) },
    { id: "d", batchCode: "SG-Beta", completionDate: stamp(2) },
  ];
  const range = { startDate: "2026-01-02", endDate: "2026-01-02" };
  expect(
    h
      .filterCompletedBatches(batches, "  ALPHA ", range)
      .map((b) => b.id)
      .join(),
  ).toBe("b,a");
  expect(batches[0].id).toBe("a");
  expect(h.isInRange(stamp(1, 23, 59), range)).toBe(false);
  expect(h.filterCompletedBatches(batches, "missing", range).length).toBe(0);
});

test("month presets cross years and include the current month", () => {
  const now = new Date(2026, 0, 31);
  expect(h.historyRange("This month", undefined, now).startDate).toBe(
    "2026-01-01",
  );
  expect(h.historyRange("Last 6 months", undefined, now).startDate).toBe(
    "2025-08-01",
  );
  expect(h.historyRange("Last 12 months", undefined, now).startDate).toBe(
    "2025-02-01",
  );
  expect(h.historyRange("Last 6 months", undefined, now).endDate).toBe(
    "2026-01-31",
  );
  expect(h.historyRange("All time")).toBe(undefined);
  const week = h.sensorRange("Per week", new Date(2026, 0, 1));
  expect(week.startDate).toBe("2025-12-29");
  expect(week.endDate).toBe("2026-01-04");
});

test("range selection supports same-day, reversed and incomplete ranges", () => {
  const first = h.nextRangeSelection(
    { startDate: null, endDate: null },
    "2026-01-03",
  );
  expect(first.endDate).toBe(null);
  expect(h.nextRangeSelection(first, "2026-01-03").endDate).toBe("2026-01-03");
  const reversed = h.nextRangeSelection(first, "2026-01-01");
  expect(reversed.startDate).toBe("2026-01-01");
  expect(reversed.endDate).toBe("2026-01-03");
  expect(h.nextRangeSelection(reversed, "2026-01-04").endDate).toBe(null);
});

test("latest hourly and daily readings isolate batches and preserve missing sensor intervals", () => {
  const reading = (batchId, recordedAt, temperature, moisture = null) => ({
    batchId,
    machineId: batchId,
    recordedAt,
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
  expect(hourly.temperature.length).toBe(24);
  expect(hourly.temperature[1].value).toBe(30);
  expect(hourly.temperature[2].value).toBe(null);
  expect(hourly.moisture[1].value).toBe(0);
  expect(hourly.moisture[3].value).toBe(null);
  expect(hourly.temperature[3].x).toBe(3 / 24);
  const daily = h.aggregateReadings(
    scoped,
    { ...range, endDate: "2026-01-03" },
    false,
  );
  expect(daily.temperature[0].value).toBe(50);
  expect(daily.temperature[1].value).toBe(null);
  expect(hourly.temperature[3].label).toBe("03:00");
  expect(daily.temperature[1].label).toBe("Jan 3");
  expect(hourly.co2.every((point) => point.value === null)).toBeTruthy();
});

test("fixtures validate, stay inside their batches and preserve initial feedstock weights", () => {
  const readings = schemas.historyReadingSchema
    .array()
    .parse(fixtures.history_readings);
  const logs = schemas.historyEventSchema
    .array()
    .parse(fixtures.history_events);
  for (const batch of fixtures.completed_batches) {
    expect(
      Number(
        batch.feedstocks.reduce((sum, f) => sum + f.weightKg, 0).toFixed(2),
      ),
    ).toBe(batch.totalWeight);
    expect(batch.totalWeight).not.toBe(batch.finalWeight);
    expect(readings.some((r) => r.batchId === batch.id)).toBeTruthy();
    expect(logs.some((r) => r.batchId === batch.id)).toBeTruthy();
  }
  for (const event of [...readings, ...logs]) {
    const machine = fixtures.machines.find((m) => m.id === event.machineId);
    expect(machine).toBeTruthy();
    expect(
      Date.parse(event.recordedAt ?? event.createdAt) >=
        Date.parse(machine.createdAt),
    ).toBeTruthy();
    if (event.batchId === null) continue;
    const batch = fixtures.completed_batches.find(
      (b) => b.id === event.batchId,
    );
    expect(batch).toBeTruthy();
    const time = Date.parse(event.recordedAt ?? event.createdAt);
    expect(
      time >= Date.parse(batch.startDate) &&
        time <= Date.parse(batch.completionDate),
    ).toBeTruthy();
  }
  expect(
    schemas.historyReadingSchema.safeParse({
      ...readings[0],
      moisture: Infinity,
    }).success,
  ).toBe(false);
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
  expect(applied.length).toBe(0);
  tree.props.onDismiss();
  tree.props.onChange(0);
  tree = render(props);
  nodes(tree, "Button")[0].props.onPress();
  expect(applied.join()).toBe("All time");
  nodes(tree, "Pressable")[1].props.onPress();
  tree = render(props);
  nodes(tree, "Button")[0].props.onPress();
  expect(applied.join()).toBe("All time,This month");
  tree = render({ ...props, onApply: undefined });
  nodes(tree, "Pressable")[1].props.onPress();
  expect(selected.join()).toBe("This month");
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
  expect(nodes(tree, "Button")[0].props.disabled).toBe(true);
  nodes(tree, "Button")[0].props.onPress();
  expect(applied.length).toBe(0);
  tree.props.onDismiss();
  tree.props.onChange(0);
  tree = render(props);
  expect(nodes(tree, "Button")[0].props.disabled).toBe(false);
  nodes(tree, "Button")[0].props.onPress();
  expect(applied[0].startDate).toBe("2026-01-02");
  expect(applied[0].endDate).toBe("2026-01-03");
});

test("machine scope includes multiple batches and unassigned records without crossing machines", () => {
  const result = h.selectHistory(
    fixtures.history_readings,
    fixtures.history_events,
    { kind: "machine", machineId: "1" },
  );
  expect(result.readings.every((r) => r.machineId === "1")).toBeTruthy();
  expect(result.logs.every((r) => r.machineId === "1")).toBeTruthy();
  expect(result.readings.some((r) => r.batchId === "completed-1")).toBeTruthy();
  expect(result.readings.some((r) => r.batchId === "completed-3")).toBeTruthy();
  expect(result.readings.some((r) => r.batchId === null)).toBeTruthy();
  expect(result.logs.some((r) => r.batchId === null)).toBeTruthy();
});

test("batch scope requires membership, matching machine and inclusive lifetime boundaries", () => {
  const batch = fixtures.completed_batches[0];
  const original = fixtures.history_readings.find(
    (r) => r.batchId === batch.id,
  );
  const samples = [
    { ...original, recordedAt: batch.startDate },
    { ...original, recordedAt: batch.completionDate },
    {
      ...original,
      recordedAt: new Date(Date.parse(batch.startDate) - 1).toISOString(),
    },
    {
      ...original,
      recordedAt: new Date(Date.parse(batch.completionDate) + 1).toISOString(),
    },
    { ...original, batchId: null },
    { ...original, batchId: "another-batch" },
    { ...original, machineId: "another-machine" },
  ];
  const events = samples.map((r, i) => ({
    ...r,
    id: String(i),
    createdAt: r.recordedAt,
    type: "blower_on",
    message: "Recorded",
  }));
  const scope = { kind: "batch", batchId: batch.id };
  const selected = h.selectHistory(samples, events, scope, batch);
  expect(selected.readings.length).toBe(2);
  expect(selected.logs.length).toBe(2);
  expect(selected.readings[0].recordedAt).toBe(batch.startDate);
  expect(selected.logs[0].createdAt).toBe(batch.completionDate);
  expect(h.selectHistory(samples, events, scope).readings.length).toBe(0);
});

test("automation grouping sorts actual local dates and preserves input order and timestamps", () => {
  const logs = [stamp(2), stamp(1, 23, 59), stamp(2, 23, 59)].map(
    (createdAt, id) => ({ id: String(id), createdAt }),
  );
  const before = JSON.stringify(logs);
  const groups = h.groupHistoryEvents(logs);
  expect(groups.length).toBe(2);
  expect(groups[0].data.map((l) => l.id).join()).toBe("2,0");
  expect(groups[1].data[0].id).toBe("1");
  expect(JSON.stringify(logs)).toBe(before);
  const filtered = h.groupHistoryEvents(logs, {
    startDate: "2026-01-02",
    endDate: "2026-01-02",
  });
  expect(filtered.length).toBe(1);
  expect(filtered[0].data.length).toBe(2);
});

test("machine presets use inclusive local calendar days across year boundaries", () => {
  const now = new Date(2026, 0, 3, 12);
  expect(h.historyRange("Today", undefined, now).startDate).toBe("2026-01-03");
  expect(h.historyRange("Last 7 days", undefined, now).startDate).toBe(
    "2025-12-28",
  );
  expect(h.historyRange("Last 31 days", undefined, now).startDate).toBe(
    "2025-12-04",
  );
  expect(h.historyRange("Last 7 days", undefined, now).endDate).toBe(
    "2026-01-03",
  );
});

test("migrated machine samples retain values with explicit daily positions and no inferred batch", () => {
  const samples = fixtures.history_readings.filter(
    (r) => r.machineId === "1" && r.batchId === null,
  );
  expect(samples.map((r) => r.temperature).join()).toBe("20,30,45,55,60,45,40");
  expect(samples[0].recordedAt).toBe("2026-09-29T16:00:00.000Z");
  expect(
    Date.parse(samples.at(-1).recordedAt) - Date.parse(samples[0].recordedAt),
  ).toBe(86400000);
  expect(new Set(fixtures.history_events.map((e) => e.id)).size).toBe(
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
    expect(
      schemas.historyEventSchema.safeParse({
        ...fixtures.history_events[0],
        type,
      }).success,
    ).toBe(true);
  }
});

test("history queries separate scope caches, load only relevant metadata and handle missing entities", async () => {
  const cache = new Map();
  const requests = [];
  const enabled = [];
  const { useHistory } = load("src/hooks/use-history.ts", {
    "@/data/data.json": fixtures,
    "@/context/auth-context": {
      useAuthContext: () => ({ user: { id: "user" } }),
    },
    "./use-profile": {
      useProfile: () => ({ data: { barangayId: "barangay" } }),
    },
    "@/api/batch.api": { batchApi: { readings: async () => [] } },
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
          requests.push(
            options
              .queryFn({ signal: new AbortController().signal })
              .then((data) => cache.set(key, data)),
          );
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
  useHistory(batchScope, { period: "Per day" });
  useHistory(machineScope, { period: "Per day" });
  await Promise.all(requests);
  const batch = useHistory(batchScope),
    machine = useHistory(machineScope, { period: "Per day" });
  expect(batch.readings.length).toBe(0);
  expect(machine.readings.length).toBe(0);
  expect(
    [...cache.keys()].some((key) =>
      key.startsWith("history/user/barangay/batch/completed-1/"),
    ),
  ).toBeTruthy();
  expect(
    [...cache.keys()].some((key) =>
      key.startsWith("history/user/barangay/machine/1/"),
    ),
  ).toBeTruthy();
  expect(
    enabled
      .slice(0, 4)
      .map(([kind, active]) => kind + ":" + active)
      .join(),
  ).toBe("batch:true,machine:false,batch:false,machine:true");
  const missing = useHistory({ kind: "machine", machineId: "missing" });
  expect(missing.exists).toBe(false);
  expect(missing.isPending).toBe(false);
  expect(missing.readings.length).toBe(0);
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
      expect(screen.type).toBe(component);
      expect(screen.props.scope.kind).toBe(kind);
      expect(
        screen.props.scope[kind === "batch" ? "batchId" : "machineId"],
      ).toBe(kind === "batch" ? "completed-1" : "1");
      callbacks[0]();
      callbacks[0]();
      expect(logs.length).toBe(2);
      expect(logs[0].params[kind === "batch" ? "batchId" : "id"]).toBe(
        kind === "batch" ? "completed-1" : "1",
      );
    }
  }
});
