const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const { test, expect } = require("@jest/globals");

function load(file, dependencies) {
  const filename = path.join(__dirname, "..", file);
  const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
    },
    fileName: filename,
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(
    code,
    {
      module,
      exports: module.exports,
      require: (name) => dependencies[name] ?? require(name),
      process,
      AbortController,
      setTimeout,
      clearTimeout,
      fetch: dependencies.fetch,
    },
    { filename },
  );
  return module.exports;
}

function nodes(node) {
  if (!node || typeof node !== "object") return [];
  if (Array.isArray(node)) return node.flatMap(nodes);
  return [node, ...nodes(node.props?.children)];
}

function render(query) {
  const { SensorHistoryScreen } = load(
    "src/components/history/sensor-history-screen.tsx",
    {
      react: {
        useState: (value) => [value, () => {}],
        useMemo: (fn) => fn(),
        useEffect: (fn) => {
          const cleanup = fn();
          if (typeof cleanup === "function") cleanup();
        },
      },
      "react/jsx-runtime": require("react/jsx-runtime"),
      "react-native": {
        View: "View",
        Text: "Text",
        ScrollView: "ScrollView",
        Modal: "Modal",
        Pressable: "Pressable",
        Platform: { OS: "android" },
        useWindowDimensions: () => ({ width: 390, fontScale: 1 }),
      },
      "@react-native-community/datetimepicker": "DateTimePicker",
      "lucide-react-native": {},
      "@/hooks/use-history": {
        useHistory: () => ({
          exists: true,
          startDate: "2026-01-01T00:00:00Z",
          endDate: "2026-01-03T00:00:00Z",
          readings: [],
          refetch: () => {},
          ...query,
        }),
      },
      "@/hooks/use-layout": { useDynamicLayout: () => ({ tabBarHeight: 60 }) },
      "@/lib/history": {
        sensorRange: () => ({ startDate: "2026-01-02", endDate: "2026-01-02" }),
        dateBounds: () => ({
          start: new Date("2026-01-02"),
          end: new Date("2026-01-02"),
        }),
        aggregateReadings: () => ({
          temperature: query?.readings?.length ? [{ value: 45 }] : [],
          moisture: query?.readings?.length ? [{ value: 60 }] : [],
          oxygen: query?.readings?.length ? [{ value: 20 }] : [],
          co2: query?.readings?.length ? [{ value: 800 }] : [],
        }),
      },
      "@/components/history/history-header": { HistoryHeader: "HistoryHeader" },
      "@/components/history/history-date-filter": {
        HistoryDateFilter: "HistoryDateFilter",
      },
      "@/components/history/history-state": { HistoryState: "HistoryState" },
      "@/components/devices/sensor-trend-graph": {
        SensorTrendGraph: "SensorTrendGraph",
      },
      "@/components/ui/date-filter-toggle": {
        DateFilterToggle: "DateFilterToggle",
      },
      "@/constants": {
        colors: {
          red: { 500: "red" },
          teal: { 700: "teal" },
          yellow: { 700: "yellow" },
          brand: { 500: "green" },
        },
      },
    },
  );
  return nodes(
    SensorHistoryScreen({ scope: { kind: "machine", machineId: "m1" } }),
  );
}

test("date navigation remains available and cards remain mounted while loading", () => {
  const tree = render({ isPending: true, isError: false });
  expect(tree.some((node) => node.type === "DateFilterToggle")).toBe(true);
  expect(tree.some((node) => node.type === "SensorTrendGraph")).toBe(true);
  expect(tree.some((node) => node.type === "HistoryState")).toBe(false);
});

test("date navigation and error state remain available on failure", () => {
  const tree = render({ isPending: false, isError: true });
  expect(tree.some((node) => node.type === "DateFilterToggle")).toBe(true);
  expect(tree.some((node) => node.type === "HistoryState")).toBe(true);
});

test("feedstock images cover database names and trim whitespace", () => {
  const module = load(
    "src/constants/feedstocks.ts",
    new Proxy({}, { get: (_, name) => String(name) }),
  );
  expect(module.getFeedstockImage(" Coffee Grounds ")).toBe(
    "@/assets/feedstocks/coffee-grounds.png",
  );
  expect(module.getFeedstockImage("dry leaves")).toBe(
    "@/assets/feedstocks/dried-leaves.png",
  );
  expect(module.getFeedstockImage("Grass Clippings")).toBe(
    "@/assets/feedstocks/grass-clippings.png",
  );
  expect(module.getFeedstockImage("Cardboard")).toBe(
    "@/assets/feedstocks/cardboards.png",
  );
  expect(module.getFeedstockImage("unknown")).toBeNull();
});

test("cancelling a history request aborts fetch without reporting a timeout", async () => {
  class ApiError extends Error {
    constructor(status, message) {
      super(message);
      this.status = status;
    }
  }
  const fetch = (_url, options) =>
    new Promise((_resolve, reject) => {
      const abort = () => {
        const error = new Error("Cancelled");
        error.name = "AbortError";
        reject(error);
      };
      if (options.signal.aborted) abort();
      else options.signal.addEventListener("abort", abort, { once: true });
    });
  const client = load("src/api/client.ts", {
    "expo-constants": { default: {} },
    "@/types": { ApiError },
    "@/lib/auth-token": { getAuthToken: async () => "test" },
    "@/lib/logger": {
      createLogger: () => ({ debug() {}, error() {}, warn() {} }),
    },
    fetch,
  });
  const controller = new AbortController();
  const pending = client.apiFetch("/history", {
    signal: controller.signal,
    withAuth: false,
  });
  controller.abort();
  await expect(pending).rejects.toMatchObject({ name: "AbortError" });
});

test("history requests pass their cancellation signal through pagination", async () => {
  const controller = new AbortController();
  const calls = [];
  const { batchApi } = load("src/api/batch.api.ts", {
    "./client": {
      api: {
        get: async (url, options) => {
          calls.push({ url, signal: options.signal });
          return { readings: [], hasMore: false };
        },
      },
    },
    "@/types/batch": {},
    "@/types/history": load("src/types/history.ts", {}),
  });
  await batchApi.readings(
    { kind: "machine", machineId: "m1" },
    "2026-01-01T00:00:00.000Z",
    "2026-01-02T00:00:00.000Z",
    controller.signal,
  );
  expect(calls).toHaveLength(1);
  expect(calls[0].signal).toBe(controller.signal);
});

test("sensor history dynamically maps database units to trend graphs and defaults CO2 to ppm", () => {
  const tree = render({
    isPending: false,
    isError: false,
    sensors: [
      { sensorType: "temperature", unit: "°C" },
      { sensorType: "moisture", unit: "%" },
      { sensorType: "o2", unit: "%" },
      { sensorType: "co2", unit: "ppm" },
    ],
    readings: [
      {
        machineId: "m1",
        batchId: null,
        recordedAt: "2026-01-02T10:00:00Z",
        temperature: 45,
        moisture: 60,
        oxygen: 20,
        co2: 800,
      },
    ],
  });
  const graphs = tree.filter((node) => node.type === "SensorTrendGraph");
  expect(graphs.map((g) => [g.props.title, g.props.unit])).toEqual([
    ["Temperature Trend", "°C"],
    ["Moisture Trend", "%"],
    ["Oxygen Trend", "%"],
    ["Carbon Dioxide Trend", "ppm"],
  ]);
});

test("sensor cards remain mounted and consistent even when readings are empty", () => {
  const tree = render({
    isPending: false,
    isError: false,
    readings: [],
  });
  const graphs = tree.filter((node) => node.type === "SensorTrendGraph");
  expect(graphs).toHaveLength(4);
});

test("DateFilterToggle supports label press to open datepicker", () => {
  const { DateFilterToggle } = load(
    "src/components/ui/date-filter-toggle.tsx",
    {
      "react-native": {
        View: "View",
        Text: "Text",
        Pressable: "Pressable",
      },
      "lucide-react-native": {},
      "@/constants": {
        colors: {
          semantic: {
            foreground: "black",
            primaryForeground: "white",
          },
        },
      },
    },
  );
  let opened = false;
  const toggleTree = nodes(
    DateFilterToggle({
      label: "Nov 10, 2026",
      onPressLabel: () => {
        opened = true;
      },
    }),
  );
  const labelPressable = toggleTree.find(
    (n) =>
      n.type === "Pressable" &&
      n.props.accessibilityLabel?.includes("Selected date"),
  );
  expect(labelPressable).toBeDefined();
  labelPressable.props.onPress();
  expect(opened).toBe(true);
});
