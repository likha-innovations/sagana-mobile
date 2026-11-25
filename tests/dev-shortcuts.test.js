const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const { jest: mock, test, expect, describe } = require("@jest/globals");

function loadDevShortcuts({
  devFlag,
  envFlag,
  platformOS = "android",
  onDevClientRequire,
} = {}) {
  const filename = path.join(__dirname, "../src/dev/dev-shortcuts.ts");
  const prevEnv = process.env.EXPO_PUBLIC_IS_DEV;
  if (envFlag === undefined) {
    delete process.env.EXPO_PUBLIC_IS_DEV;
  } else {
    process.env.EXPO_PUBLIC_IS_DEV = envFlag;
  }

  const pushMock = mock.fn();
  const registerDevMenuItemsMock = mock.fn(() => Promise.resolve());
  const requireMock = mock.fn((name) => {
    if (name === "react") {
      return { useEffect: (fn) => fn() };
    }
    if (name === "react-native") {
      return { Platform: { OS: platformOS } };
    }
    if (name === "expo-router") {
      return { useRouter: () => ({ push: pushMock }) };
    }
    if (name === "expo-dev-client") {
      onDevClientRequire?.();
      return { registerDevMenuItems: registerDevMenuItemsMock };
    }
    return {};
  });

  const codeText = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;

  const moduleRef = { exports: {} };
  try {
    vm.runInNewContext(
      codeText,
      {
        __DEV__: devFlag,
        process,
        module: moduleRef,
        exports: moduleRef.exports,
        require: requireMock,
      },
      { filename },
    );
  } finally {
    if (prevEnv === undefined) {
      delete process.env.EXPO_PUBLIC_IS_DEV;
    } else {
      process.env.EXPO_PUBLIC_IS_DEV = prevEnv;
    }
  }

  return {
    ...moduleRef.exports,
    pushMock,
    registerDevMenuItemsMock,
    requireMock,
  };
}

describe("Dev Shortcuts", () => {
  test("never loads expo-dev-client when __DEV__ is false even if EXPO_PUBLIC_IS_DEV is true", () => {
    const devClientRequired = mock.fn();
    const { IS_DEV_MODE, useDevShortcuts, registerDevMenuItemsMock } =
      loadDevShortcuts({
        devFlag: false,
        envFlag: "true",
        onDevClientRequire: devClientRequired,
      });

    expect(IS_DEV_MODE).toBe(false);
    useDevShortcuts();
    expect(devClientRequired).not.toHaveBeenCalled();
    expect(registerDevMenuItemsMock).not.toHaveBeenCalled();
  });

  test("does not register shortcuts when EXPO_PUBLIC_IS_DEV is false in dev mode", () => {
    const devClientRequired = mock.fn();
    const { IS_DEV_MODE, useDevShortcuts, registerDevMenuItemsMock } =
      loadDevShortcuts({
        devFlag: true,
        envFlag: "false",
        onDevClientRequire: devClientRequired,
      });

    expect(IS_DEV_MODE).toBe(false);
    useDevShortcuts();
    expect(devClientRequired).not.toHaveBeenCalled();
    expect(registerDevMenuItemsMock).not.toHaveBeenCalled();
  });

  test("registers DEV_SHORTCUTS with shouldCollapse=true and navigates via router.push when enabled", () => {
    const {
      IS_DEV_MODE,
      DEV_SHORTCUTS,
      useDevShortcuts,
      registerDevMenuItemsMock,
      pushMock,
    } = loadDevShortcuts({
      devFlag: true,
      envFlag: "true",
      platformOS: "android",
    });

    expect(IS_DEV_MODE).toBe(true);
    useDevShortcuts();

    expect(registerDevMenuItemsMock).toHaveBeenCalledTimes(1);
    const items = registerDevMenuItemsMock.mock.calls[0][0];
    expect(items).toHaveLength(DEV_SHORTCUTS.length);
    expect(items.every((item) => item.shouldCollapse === true)).toBe(true);

    const sitemapItem = items.find((item) => item.name === "Dev: Open Sitemap");
    expect(sitemapItem).toBeDefined();
    sitemapItem.callback();
    expect(pushMock).toHaveBeenCalledWith("/_sitemap");

    const aerationItem = items.find(
      (item) => item.name === "Dev: Machine Aeration Settings",
    );
    expect(aerationItem).toBeDefined();
    aerationItem.callback();
    expect(pushMock).toHaveBeenCalledWith({
      pathname: "/(app)/machines/[id]/aeration-settings",
      params: { id: "1" },
    });
  });
});
