const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

function setup(reduceMotion) {
  const effects = [];
  const sharedValue = { value: 1 };
  const cancelAnimation = jest.fn();
  const withRepeat = jest.fn(() => 1.08);
  const deps = {
    react: { useEffect: (effect) => effects.push(effect) },
    "react/jsx-runtime": { jsx: (type, props) => ({ type, props }) },
    "react-native": { View: "View" },
    "react-native-reanimated": {
      __esModule: true,
      default: { Image: "Image" },
      cancelAnimation,
      Easing: { ease: "ease", inOut: () => "easing" },
      useAnimatedStyle: (callback) => callback(),
      useReducedMotion: () => reduceMotion,
      useSharedValue: () => sharedValue,
      withRepeat,
      withTiming: () => "animation",
    },
    "../../../assets/sagana_logo.png": "logo",
  };
  const filename = path.join(
    __dirname,
    "../src/components/ui/loading-screen.tsx",
  );
  const moduleRef = { exports: {} };
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
      },
    }).outputText,
    {
      module: moduleRef,
      exports: moduleRef.exports,
      require: (name) => deps[name],
    },
  );
  const screen = moduleRef.exports.LoadingScreen();
  const cleanup = effects[0]();
  return { screen, cleanup, withRepeat, cancelAnimation, sharedValue };
}

test("pulses the logo while exposing a loading state to assistive technology", () => {
  const { screen, cleanup, withRepeat, cancelAnimation, sharedValue } =
    setup(false);
  expect(screen.props.accessibilityLabel).toBe("Loading Sagana");
  expect(screen.props.accessibilityState.busy).toBe(true);
  expect(withRepeat).toHaveBeenCalledWith("animation", -1, true);
  cleanup();
  expect(cancelAnimation).toHaveBeenCalledWith(sharedValue);
});

test("keeps the logo still when reduced motion is enabled", () => {
  const { withRepeat, sharedValue } = setup(true);
  expect(withRepeat).not.toHaveBeenCalled();
  expect(sharedValue.value).toBe(1);
});
