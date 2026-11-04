const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

function render(points, fontScale = 1, width = 280) {
  const filename = path.join(
    __dirname,
    "../src/components/devices/sensor-trend-graph.tsx",
  );
  const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;
  const module = { exports: {} };
  const dependencies = {
    react: { useState: () => [width, () => {}] },
    "react-native": {
      View: "View",
      Text: "Text",
      useWindowDimensions: () => ({ fontScale }),
    },
    "react-native-gifted-charts": { LineChart: "LineChart" },
    "@/constants/colors": {
      colors: {
        semantic: { foreground: "#414141", border: "#DCDBD5" },
        neutral: { 300: "#8E8E87" },
      },
    },
  };
  vm.runInNewContext(code, {
    module,
    exports: module.exports,
    require: (name) => dependencies[name] ?? require(name),
  });
  return module.exports.SensorTrendGraph({
    title: "Temperature",
    icon: "Icon",
    iconColor: "#B83030",
    points,
    unit: "°C",
    maxVal: 60,
  });
}
function nodes(node) {
  if (!node || typeof node !== "object") return [];
  if (Array.isArray(node)) return node.flatMap(nodes);
  return [node, ...nodes(node.props?.children)];
}
const points = [
  { x: 0, value: 0, label: "00:00" },
  { x: 0.25, value: null, label: "06:00" },
  { x: 0.5, value: 24, label: "12:00" },
  { x: 0.75, value: 30, label: "18:00" },
];

test("Gifted Charts preserves missing intervals, zero readings and exact tooltip labels", () => {
  const chart = nodes(render(points)).find(
    (node) => node.type === "LineChart",
  ).props;
  expect(chart.data.length).toBe(4);
  expect(chart.data[0].value).toBe(0);
  expect(chart.data[1].value).toBe(undefined);
  expect(chart.interpolateMissingValues).toBe(false);
  expect(chart.extrapolateMissingValues).toBe(false);
  expect(chart.pointerConfig.hidePointerForMissingValues).toBe(true);
  expect(chart.pointerConfig.activatePointersOnLongPress).toBe(false);
  expect(chart.pointerConfig.activatePointersInstantlyOnTouch).toBe(true);
  expect(chart.dataPointsRadius < 2.5).toBeTruthy();
  const tooltip = chart.pointerConfig.pointerLabelComponent;
  expect(tooltip([], null, 1)).toBe(null);
  const labels = nodes(tooltip([], null, 0))
    .filter((node) => node.type === "Text")
    .map((node) => node.props.children);
  expect(labels).toEqual(["0°C", "00:00"]);
});

test("the selected point displays its actual reading date and time", () => {
  const recordedAt = new Date(2026, 0, 2, 13, 45, 12).toISOString();
  const chart = nodes(
    render([{ x: 0, value: 29.5, label: "13:00", recordedAt }]),
  ).find((node) => node.type === "LineChart").props;
  const labels = nodes(chart.pointerConfig.pointerLabelComponent([], null, 0))
    .filter((node) => node.type === "Text")
    .map((node) => node.props.children);
  expect(labels).toEqual(["29.5°C", "Jan 2, 2026 · 1:45:12 PM"]);
});

test("empty series shows a message instead of an invented zero line", () => {
  const tree = nodes(
    render(points.map((point) => ({ ...point, value: null }))),
  );
  expect(tree.some((node) => node.type === "LineChart")).toBe(false);
  expect(
    tree.some(
      (node) =>
        node.props?.children === "No readings recorded for this sensor.",
    ),
  ).toBeTruthy();
});

test("large text uses fewer labels and a narrower plot; single and negative readings remain visible", () => {
  const normal = nodes(render(points)).find(
    (node) => node.type === "LineChart",
  ).props;
  const large = nodes(render(points, 1.5)).find(
    (node) => node.type === "LineChart",
  ).props;
  expect(large.width < normal.width).toBeTruthy();
  expect(large.data.filter((point) => point.label).length).toBe(2);
  const single = nodes(render([{ x: 0, value: -5, label: "Jan 2" }])).find(
    (node) => node.type === "LineChart",
  ).props;
  expect(single.data[0].value).toBe(-5);
  expect(single.noOfSectionsBelowXAxis).toBe(1);
  expect(single.dataPointsRadius > 0).toBeTruthy();
});
