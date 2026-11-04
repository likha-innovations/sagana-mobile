const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const { jest: jestMock, test, expect } = require("@jest/globals");

function load(file, dependencies) {
  const filename = path.join(__dirname, "..", file);
  const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
    },
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

function nodes(node) {
  if (!node || typeof node !== "object") return [];
  if (Array.isArray(node)) return node.flatMap(nodes);
  return [node, ...nodes(node.props?.children)];
}

const machine = {
  id: "m1",
  name: "Sagana",
  status: "active",
  latestReadings: { temperature: 37 },
};
const icons = new Proxy({}, { get: (_, name) => String(name) });
const colors = {
  semantic: { foreground: "#414141", primaryForeground: "#fff" },
  brand: { 500: "#718619", 700: "#566811" },
  gray: { textIcon: "#888" },
  red: { 500: "red" },
  gradient: { statCard: { colors: ["green", "green"], start: {}, end: {} } },
  sensors: {
    temperature: "red",
    moisture: "blue",
    oxygen: "yellow",
    carbonDioxide: "green",
  },
};

function renderDetail(completed, activeBatch = null, offline = false) {
  const pushes = [];
  const query = {
    data: { ...machine, status: offline ? "offline" : machine.status },
    isPending: false,
    isError: false,
    refetch: jestMock.fn(),
  };
  const { default: Screen } = load("app/(app)/(tabs)/machines/[id]/index.tsx", {
    react: {
      useCallback: (fn) => fn,
      useState: (value) => [value, jestMock.fn()],
    },
    "react-native": {
      View: "View",
      Text: "Text",
      ScrollView: "ScrollView",
      Pressable: "Pressable",
      Alert: {},
      useWindowDimensions: () => ({ width: 390, fontScale: 1 }),
    },
    "react/jsx-runtime": require("react/jsx-runtime"),
    "expo-router": {
      useFocusEffect: () => {},
      useLocalSearchParams: () => ({ id: "m1" }),
      useRouter: () => ({
        push: (route) => pushes.push(route),
        back: jestMock.fn(),
      }),
    },
    "lucide-react-native": icons,
    "expo-linear-gradient": { LinearGradient: "LinearGradient" },
    "@/hooks/use-machines": {
      useMachine: () => query,
      useMachineOverview: () => ({ ...query, data: null }),
    },
    "@/hooks/use-batches": {
      useActiveBatch: () => ({ ...query, data: activeBatch }),
      useCompletedBatches: () => completed,
      useFinishCompostBatch: () => ({}),
    },
    "@/hooks": {
      useDynamicLayout: () => ({
        headerPaddingTop: 48,
        scrollPaddingBottom: 80,
      }),
    },
    "@/constants": { colors },
    "@/lib/utils": { formatTimeAgo: () => "recently" },
    "@/lib/machine-overview": {
      getMachineState: () => ({ vacant: !activeBatch, disconnected: offline }),
    },
    "@/lib/logger": { createLogger: () => ({ screen: jestMock.fn() }) },
    "@/lib/dashboard": {
      getRecentCompletedBatches: (items) =>
        [...items].sort(
          (a, b) => Date.parse(b.completionDate) - Date.parse(a.completionDate),
        ),
    },
    "@/components/icons": { CompostIcon: "CompostIcon" },
    "@/components/history/feedstock-grid": { FeedstockGrid: "FeedstockGrid" },
    "@/components/history/history-state": { HistoryState: "HistoryState" },
    "@/components/dashboard": { QuickActionButton: "QuickActionButton" },
    "@/components/devices/sensor-stat-card": {
      SensorStatCard: "SensorStatCard",
    },
    "@/components/ui/skeleton": { Skeleton: "Skeleton" },
    "@/components/ui/confirm-modal": { ConfirmModal: "ConfirmModal" },
    "@/components/dashboard/completed-batch-card": {
      CompletedBatchCard: "CompletedBatchCard",
    },
  });
  return { tree: nodes(Screen()), pushes };
}

test("a vacant machine shows its latest completed batch without sensor readings", () => {
  const { tree, pushes } = renderDetail({
    data: [
      { id: "other", machineId: "m2", completionDate: "2026-10-30T00:00:00Z" },
      { id: "old", machineId: "m1", completionDate: "2026-10-01T00:00:00Z" },
      {
        id: "recent",
        machineId: "m1",
        batchCode: "BATCH-RECENT",
        finalWeight: 14.2,
        completionDate: "2026-10-10T00:00:00Z",
      },
    ],
    isPending: false,
    isError: false,
  });
  const card = tree.find((node) => node.type === "CompletedBatchCard");
  expect(card).toBeDefined();
  expect(card.props.batch.id).toBe("recent");
  expect(card.props.batch.finalWeight).toBe(14.2);
  expect(tree.some((node) => node.type === "SensorStatCard")).toBe(false);
  card.props.onPress();
  expect(pushes[0].params.batchId).toBe("recent");
});

test("a vacant machine without a completed batch shows no batch card, and fetch errors offer retry", () => {
  const empty = renderDetail({
    data: [],
    isPending: false,
    isError: false,
  }).tree;
  expect(empty.some((node) => node.type === "CompletedBatchCard")).toBe(false);
  expect(empty.some((node) => node.type === "SensorStatCard")).toBe(false);
  const refetch = jestMock.fn();
  const tree = renderDetail({ isPending: false, isError: true, refetch }).tree;
  const error = tree.find((node) => node.type === "HistoryState");
  expect(error.props.message).toBe("Could not load the previous batch.");
  error.props.onRetry();
  expect(refetch).toHaveBeenCalled();
});

test("an active machine detail shows sensor readings and history navigation", () => {
  const { tree, pushes } = renderDetail(
    { data: [], isPending: false, isError: false },
    {
      id: "batch",
      machineId: "m1",
      status: "active",
      batchCode: "B1",
      startDate: "2026-01-01T00:00:00Z",
      totalWeight: 10,
      feedstocks: [],
    },
  );
  const cards = tree.filter((node) => node.type === "SensorStatCard");
  expect(cards).toHaveLength(4);
  expect(
    cards.find((card) => card.props.label === "Temperature").props.value,
  ).toBe("37°C");
  const historyLink = tree.find(
    (node) =>
      node.type === "Pressable" &&
      nodes(node).some((child) => child.props?.children === "View history"),
  );
  historyLink.props.onPress();
  expect(pushes[0].pathname).toBe(
    "/(app)/(tabs)/machines/[id]/sensors-history",
  );
});

test("an offline active machine keeps readings and automation cards without inventing their status", () => {
  const { tree } = renderDetail(
    { data: [], isPending: false, isError: false },
    {
      id: "batch",
      machineId: "m1",
      status: "active",
      batchCode: "B1",
      startDate: "2026-01-01T00:00:00Z",
      totalWeight: 10,
      feedstocks: [],
    },
    true,
  );
  expect(tree.filter((node) => node.type === "SensorStatCard")).toHaveLength(4);
  expect(tree.some((node) => node.props?.children === "Aeration")).toBe(true);
  expect(tree.some((node) => node.props?.children === "Sprinkler")).toBe(true);
  expect(
    tree.some(
      (node) => node.props?.children === "Automation status unavailable.",
    ),
  ).toBe(false);
  expect(
    tree.some(
      (node) => node.props?.children === "On" || node.props?.children === "Off",
    ),
  ).toBe(false);
});

test("machine cards show sensor readings and a fallback for an empty phase", () => {
  const { MachineCard } = load("src/components/devices/machine-card.tsx", {
    "react-native": {
      View: "View",
      Text: "Text",
      Pressable: "Pressable",
      useWindowDimensions: () => ({ width: 390, fontScale: 1 }),
    },
    "react/jsx-runtime": require("react/jsx-runtime"),
    "lucide-react-native": icons,
    "@/components/icons": { CompostIcon: "CompostIcon" },
    "@/constants": { colors },
    "@/lib/machine-overview": {
      getMachineState: (_, batch) => ({ vacant: !batch, disconnected: false }),
    },
    "@/lib/utils": { formatTimeAgo: () => "recently" },
  });
  const tree = nodes(
    MachineCard({ machine, activeBatch: null, onPress: jestMock.fn() }),
  );
  expect(tree.some((node) => node.props?.children === "37°C")).toBe(true);
  expect(tree.some((node) => node.props?.children === "Vacant")).toBe(true);
  const active = nodes(
    MachineCard({
      machine,
      activeBatch: { compostingPhases: [{ status: "active", phaseName: "" }] },
      onPress: jestMock.fn(),
    }),
  );
  expect(active.some((node) => node.props?.children === "Composting")).toBe(
    true,
  );
});

test("data errors show a retry action and disable it while retrying", () => {
  const { HistoryState } = load("src/components/history/history-state.tsx", {
    "react-native": { View: "View", Text: "Text", Pressable: "Pressable" },
    "react/jsx-runtime": require("react/jsx-runtime"),
    "lucide-react-native": icons,
    "@/constants": { colors },
  });
  const retry = jestMock.fn();
  const tree = nodes(
    HistoryState({ message: "Could not load machines.", onRetry: retry }),
  );
  const button = tree.find((node) => node.type === "Pressable");
  expect(button.props.disabled).toBe(false);
  button.props.onPress();
  expect(retry).toHaveBeenCalled();
  const retrying = nodes(
    HistoryState({
      message: "Could not load machines.",
      onRetry: retry,
      retrying: true,
    }),
  );
  expect(
    retrying.find((node) => node.type === "Pressable").props.disabled,
  ).toBe(true);
  expect(retrying.some((node) => node.props?.children === "Retrying…")).toBe(
    true,
  );
});
