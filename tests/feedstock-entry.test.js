const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const { jest: mock, test, expect } = require("@jest/globals");

function render(step, weights) {
  const mutateAsync = mock.fn().mockResolvedValue({});
  const setWeights = mock.fn();
  const setters = [mock.fn(), mock.fn(), mock.fn(), setWeights];
  const values = [step, "machine-1", null, weights];
  let stateIndex = 0;
  const dependencies = {
    react: {
      useState: () => {
        const index = stateIndex++;
        return [values[index], setters[index]];
      },
      useEffect: () => {},
      useMemo: (fn) => fn(),
      useRef: () => ({ current: null }),
      useCallback: (fn) => fn,
    },
    "react-native": new Proxy(
      {
        Platform: { OS: "android" },
        useWindowDimensions: () => ({ width: 390, fontScale: 1 }),
      },
      { get: (target, key) => target[key] ?? key },
    ),
    "@gorhom/bottom-sheet": new Proxy({}, { get: (_, key) => key }),
    "expo-router": { useRouter: () => ({}), useLocalSearchParams: () => ({}) },
    "lucide-react-native": new Proxy({}, { get: (_, key) => key }),
    "expo-image": { Image: "Image" },
    "expo-haptics": {
      impactAsync: mock.fn(),
      notificationAsync: mock.fn(),
      ImpactFeedbackStyle: {},
      NotificationFeedbackType: {},
    },
    burnt: { toast: mock.fn() },
    "@/hooks/use-layout": {
      useDynamicLayout: () => ({
        insets: { bottom: 0 },
        headerPaddingTop: 16,
        stackScrollPadding: 40,
      }),
    },
    "@/hooks/use-machines": { useMachines: () => ({ data: [] }) },
    "@/hooks/use-batches": {
      useFeedstocks: () => ({
        data: [
          { id: "coffee", name: "Coffee Grounds" },
          { id: "leaves", name: "Dry Leaves" },
        ],
      }),
      useCreateCompostBatch: () => ({ mutateAsync }),
      useCompostBatches: () => ({}),
    },
    "@/constants/feedstocks": { getFeedstockImage: () => 1 },
  };
  const filename = path.join(__dirname, "..", "app/(app)/batch/new.tsx");
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
  function nodes(node) {
    if (!node || typeof node !== "object") return [];
    if (Array.isArray(node)) return node.flatMap(nodes);
    return [node, ...nodes(node.props?.children)];
  }
  return { tree: nodes(module.exports.default()), setWeights, mutateAsync };
}

test("feedstock grid allows decimal weights and keeps Next disabled until a valid positive weight", () => {
  const empty = render(3, {});
  const inputs = empty.tree.filter((node) => node.type === "TextInput");
  expect(inputs.map((node) => node.props.accessibilityLabel)).toEqual([
    "Coffee Grounds weight in kilograms",
    "Dry Leaves weight in kilograms",
  ]);
  const next = empty.tree.find(
    (node) =>
      node.type === "TouchableOpacity" &&
      node.props.children?.props?.children === "Next",
  );
  expect(next.props.disabled).toBe(true);
  inputs[0].props.onChangeText("1.5");
  expect(empty.setWeights.mock.calls[0][0]({})).toEqual({ coffee: "1.5" });
  inputs[0].props.onChangeText("1.5.2");
  expect(empty.setWeights).toHaveBeenCalledTimes(1);
  const valid = render(3, { coffee: "1.5", leaves: "0" });
  expect(
    valid.tree.find(
      (node) =>
        node.type === "TouchableOpacity" &&
        node.props.children?.props?.children === "Next",
    ).props.disabled,
  ).toBe(false);
  const incomplete = render(3, { coffee: "1", leaves: "." });
  expect(
    incomplete.tree.find(
      (node) =>
        node.type === "TouchableOpacity" &&
        node.props.children?.props?.children === "Next",
    ).props.disabled,
  ).toBe(true);
});

test("batch creation submits only feedstocks with positive weights", async () => {
  const screen = render(4, { coffee: "1.5", leaves: "0" });
  const submit = screen.tree.find(
    (node) =>
      node.type === "TouchableOpacity" &&
      node.props.children?.props?.children ===
        "I have transferred the feedstocks",
  );
  await submit.props.onPress();
  expect(
    JSON.parse(JSON.stringify(screen.mutateAsync.mock.calls[0][0])),
  ).toEqual({
    machineId: "machine-1",
    feedstocks: [{ id: "coffee", weight: 1.5 }],
  });
});
