const assert = require("node:assert/strict");
const { test } = require("node:test");
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
  assert.equal(chart.data.length, 4);
  assert.equal(chart.data[0].value, 0);
  assert.equal(chart.data[1].value, undefined);
  assert.equal(chart.interpolateMissingValues, false);
  assert.equal(chart.extrapolateMissingValues, false);
  assert.equal(chart.pointerConfig.hidePointerForMissingValues, true);
  const tooltip = chart.pointerConfig.pointerLabelComponent;
  assert.equal(tooltip([], null, 1), null);
  const labels = nodes(tooltip([], null, 0))
    .filter((node) => node.type === "Text")
    .map((node) => node.props.children);
  assert.deepEqual(labels, ["0°C", "00:00"]);
});

test("empty series shows a message instead of an invented zero line", () => {
  const tree = nodes(
    render(points.map((point) => ({ ...point, value: null }))),
  );
  assert.equal(
    tree.some((node) => node.type === "LineChart"),
    false,
  );
  assert.ok(
    tree.some(
      (node) =>
        node.props?.children === "No readings recorded for this sensor.",
    ),
  );
});

test("large text uses fewer labels and a narrower plot; single and negative readings remain visible", () => {
  const normal = nodes(render(points)).find(
    (node) => node.type === "LineChart",
  ).props;
  const large = nodes(render(points, 1.5)).find(
    (node) => node.type === "LineChart",
  ).props;
  assert.ok(large.width < normal.width);
  assert.equal(large.data.filter((point) => point.label).length, 2);
  const single = nodes(render([{ x: 0, value: -5, label: "Jan 2" }])).find(
    (node) => node.type === "LineChart",
  ).props;
  assert.equal(single.data[0].value, -5);
  assert.equal(single.noOfSectionsBelowXAxis, 1);
  assert.ok(single.dataPointsRadius > 0);
});
