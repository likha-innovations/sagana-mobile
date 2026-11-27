const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const { jest: mock, test, expect, describe } = require("@jest/globals");

function loadSuccessScreen(windowWidth = 412) {
  const filename = path.join(
    __dirname,
    "../src/components/ui/success-screen.tsx",
  );
  const moduleRef = { exports: {} };
  const mockHaptics = {
    impactAsync: mock.fn(),
    ImpactFeedbackStyle: { Light: "Light" },
  };

  let hookState = false;
  const setHookState = (val) => {
    hookState = val;
  };

  const deps = {
    react: {
      useState: (initial) => [hookState ?? initial, setHookState],
    },
    "react-native": new Proxy(
      {
        Platform: { OS: "ios" },
        Pressable: "Pressable",
        View: "View",
        Text: "Text",
        Image: "Image",
        ActivityIndicator: "ActivityIndicator",
        useWindowDimensions: () => ({ width: windowWidth, height: 917 }),
      },
      { get: (target, key) => target[key] ?? key },
    ),
    "react/jsx-runtime": {
      jsx: (type, props) => ({ type, props }),
      jsxs: (type, props) => ({ type, props }),
    },
    "lottie-react-native": "LottieView",
    "expo-haptics": mockHaptics,
    "@/hooks": {
      useDynamicLayout: () => ({ insets: { top: 44, bottom: 34 } }),
    },
    "@/lib/utils": {
      cn: (...args) => args.filter(Boolean).join(" "),
    },
    "@/components/ui/text": { Text: "Text" },
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
      require: (name) => {
        if (
          name.includes("sagana_celebration.lottie") ||
          name.includes("sagana_welcome.png") ||
          name.includes("sagana_celebrate.png")
        ) {
          return `asset-${name}`;
        }
        return deps[name] ?? {};
      },
    },
    { filename },
  );

  return { SuccessScreen: moduleRef.exports.SuccessScreen, mockHaptics };
}

describe("SuccessScreen Component", () => {
  test("renders LottieView with default 264x264 dimensions and centered text", () => {
    const { SuccessScreen } = loadSuccessScreen();
    const onPress = mock.fn();

    const element = SuccessScreen({
      title: "Welcome, Operator Neo!",
      description:
        "You will now be able to use this app to manage your SAGANA AIVSP Machines!",
      buttonText: "Take me to the homepage",
      onButtonPress: onPress,
    });

    expect(element.type).toBe("View");
    expect(element.props.testID).toBe("success-screen");

    const inner = element.props.children;
    const [mascotSection, bottomSection] = inner.props.children;
    const graphicBox = mascotSection.props.children;
    expect(graphicBox.props.style).toEqual({ width: 264, height: 264 });

    const [textBlock, button] = bottomSection.props.children;
    const [titleEl, descEl] = textBlock.props.children;

    expect(titleEl.props.children).toBe("Welcome, Operator Neo!");
    expect(titleEl.props.className).toContain("text-center");
    expect(descEl.props.children).toBe(
      "You will now be able to use this app to manage your SAGANA AIVSP Machines!",
    );
    expect(button.props.accessibilityRole).toBe("button");
  });

  test("supports custom landscape mascot dimensions and left-aligned text", () => {
    const { SuccessScreen } = loadSuccessScreen(412);
    const element = SuccessScreen({
      title: "Batch has been started!",
      description: "You can now monitor the batch.",
      buttonText: "Go to Home",
      alignText: "left",
      mascotWidth: 332,
      mascotHeight: 259,
      onButtonPress: mock.fn(),
    });

    const inner = element.props.children;
    const [mascotSection, bottomSection] = inner.props.children;
    const graphicBox = mascotSection.props.children;
    expect(graphicBox.props.style).toEqual({ width: 332, height: 259 });

    const [textBlock] = bottomSection.props.children;
    const [titleEl, descEl] = textBlock.props.children;
    expect(titleEl.props.className).toContain("text-left");
    expect(descEl.props.className).toContain("text-left");
  });

  test("invokes onButtonPress and triggers haptics when pressed", () => {
    const { SuccessScreen, mockHaptics } = loadSuccessScreen();
    const onPress = mock.fn();

    const element = SuccessScreen({
      title: "You are all set!",
      description: "You can now login to your account using your new password.",
      buttonText: "Done",
      onButtonPress: onPress,
    });

    const inner = element.props.children;
    const [, bottomSection] = inner.props.children;
    const [, button] = bottomSection.props.children;

    button.props.onPress();
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(mockHaptics.impactAsync).toHaveBeenCalled();
  });

  test("does not trigger onButtonPress when loading is true", () => {
    const { SuccessScreen } = loadSuccessScreen();
    const onPress = mock.fn();

    const element = SuccessScreen({
      title: "Saving...",
      description: "Please wait",
      buttonText: "Done",
      onButtonPress: onPress,
      loading: true,
    });

    const inner = element.props.children;
    const [, bottomSection] = inner.props.children;
    const [, button] = bottomSection.props.children;

    button.props.onPress();
    expect(onPress).not.toHaveBeenCalled();
  });
});
