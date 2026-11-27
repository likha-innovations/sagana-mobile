const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const { test, expect, describe } = require("@jest/globals");

function loadProgressBar() {
  const filename = path.join(
    __dirname,
    "../src/components/ui/progress-bar.tsx",
  );
  const moduleRef = { exports: {} };

  const deps = {
    react: {
      useEffect: (fn) => fn(),
    },
    "react-native": {
      View: "View",
    },
    "react/jsx-runtime": {
      jsx: (type, props) => ({ type, props }),
      jsxs: (type, props) => ({ type, props }),
    },
    "react-native-reanimated": {
      __esModule: true,
      default: { View: "AnimatedView" },
      Easing: { out: (fn) => fn, cubic: "cubic" },
      interpolateColor: (_val, _range, output) => output[1],
      useAnimatedStyle: (fn) => fn(),
      useReducedMotion: () => false,
      useSharedValue: (v) => ({ value: v }),
      withTiming: (v) => v,
    },
    "@/constants": {
      colors: {
        brand: { 500: "#718619" },
        gray: { border: "#DCDBD5" },
      },
    },
  };

  const codeText = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;

  vm.runInNewContext(
    codeText,
    {
      module: moduleRef,
      exports: moduleRef.exports,
      require: (name) => deps[name] ?? {},
    },
    { filename },
  );

  return moduleRef.exports;
}

describe("ProgressBar", () => {
  test("computes Figma 144px segment widths for 2, 3, 4, 5, and 6+ steps", () => {
    const { computeProgressSegmentWidths } = loadProgressBar();

    expect(computeProgressSegmentWidths(2, 1)).toEqual({
      inactiveWidth: 18,
      activeWidth: 116,
      clampedActiveStep: 1,
    });
    expect(computeProgressSegmentWidths(3, 2)).toEqual({
      inactiveWidth: 18,
      activeWidth: 88,
      clampedActiveStep: 2,
    });
    expect(computeProgressSegmentWidths(4, 3)).toEqual({
      inactiveWidth: 18,
      activeWidth: 60,
      clampedActiveStep: 3,
    });
    expect(computeProgressSegmentWidths(5, 5)).toEqual({
      inactiveWidth: 18,
      activeWidth: 32,
      clampedActiveStep: 5,
    });

    const sixSteps = computeProgressSegmentWidths(6, 2);
    const totalSixWidth =
      sixSteps.activeWidth + 5 * sixSteps.inactiveWidth + 5 * 10;
    expect(totalSixWidth).toBe(144);
    expect(sixSteps.activeWidth).toBeGreaterThanOrEqual(sixSteps.inactiveWidth);
  });

  test("renders progressbar accessibility metadata and exact step count", () => {
    const { ProgressBar } = loadProgressBar();
    const element = ProgressBar({ activeStep: 2, totalSteps: 3 });

    expect(element.props.accessibilityRole).toBe("progressbar");
    expect(element.props.accessibilityValue).toEqual({
      min: 1,
      max: 3,
      now: 2,
    });
    expect(element.props.children).toHaveLength(3);
    expect(element.props.style).toEqual({ width: 144, height: 6, gap: 10 });
  });
});
