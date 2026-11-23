const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const { jest: mock, test, expect, describe } = require("@jest/globals");

function loadSuccessScreen() {
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
  test("renders LottieView by default with 264x264 dimensions", () => {
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
    const container = element.props;
    expect(container.testID).toBe("success-screen");

    // Check inner children
    const inner = container.children;
    expect(inner.type).toBe("View");
    const [graphicSection, bottomContainer] = inner.props.children;

    // Graphic section has 264x264 container
    const graphicBox = graphicSection.props.children;
    expect(graphicBox.props.className).toContain("w-[264px]");
    expect(graphicBox.props.className).toContain("h-[264px]");

    // Verify typography and CTA button
    const [textBlock, button] = bottomContainer.props.children;
    const [titleEl, descEl] = textBlock.props.children;

    expect(titleEl.props.children).toBe("Welcome, Operator Neo!");
    expect(descEl.props.children).toBe(
      "You will now be able to use this app to manage your SAGANA AIVSP Machines!",
    );
    expect(button.props.accessibilityRole).toBe("button");
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
    const [, bottomContainer] = inner.props.children;
    const [, button] = bottomContainer.props.children;

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
    const [, bottomContainer] = inner.props.children;
    const [, button] = bottomContainer.props.children;

    button.props.onPress();
    expect(onPress).not.toHaveBeenCalled();
  });
});
