const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

function load(file, dependencies = {}) {
  const filename = path.join(__dirname, "..", file);
  const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(
    code,
    {
      module,
      exports: module.exports,
      require: (name) => dependencies[name] ?? require(name),
      setTimeout,
      clearTimeout,
      Date,
    },
    { filename },
  );
  return module.exports;
}

describe("Aeration Settings & Storage", () => {
  test("aeration-storage saves and restores custom mode configurations", async () => {
    const store = new Map();
    const mockSecureStore = {
      getItemAsync: async (key) => store.get(key) ?? null,
      setItemAsync: async (key, val) => {
        store.set(key, val);
      },
    };

    const { getCachedAerationConfig, getAerationConfig, setAerationConfig } =
      load("src/lib/aeration-storage.ts", {
        "expo-secure-store": mockSecureStore,
      });

    // Default configuration when empty
    const initial = getCachedAerationConfig("machine-abc");
    expect(initial.mode).toBe("default");
    expect(initial.onMinutes).toBe(10);
    expect(initial.offMinutes).toBe(5);

    // Save custom settings
    await setAerationConfig("machine-abc", {
      mode: "custom",
      onMinutes: 15,
      offMinutes: 10,
    });

    expect(getCachedAerationConfig("machine-abc")).toEqual({
      mode: "custom",
      onMinutes: 15,
      offMinutes: 10,
    });

    const restored = await getAerationConfig("machine-abc");
    expect(restored).toEqual({
      mode: "custom",
      onMinutes: 15,
      offMinutes: 10,
    });

    // Switch back to default
    await setAerationConfig("machine-abc", {
      mode: "default",
      onMinutes: 10,
      offMinutes: 5,
    });

    expect(getCachedAerationConfig("machine-abc").mode).toBe("default");
  });

  test("preserves newer cached configuration when a stale read completes", async () => {
    let resolveRead;
    const pendingRead = new Promise((resolve) => {
      resolveRead = resolve;
    });

    const mockSecureStore = {
      getItemAsync: async () => pendingRead,
      setItemAsync: async () => {},
    };

    const { getAerationConfig, setAerationConfig, getCachedAerationConfig } =
      load("src/lib/aeration-storage.ts", {
        "expo-secure-store": mockSecureStore,
      });

    // Start read which hangs
    const readPromise = getAerationConfig("machine-stale");

    // Immediately set a newer config in memory
    await setAerationConfig("machine-stale", {
      mode: "custom",
      onMinutes: 30,
      offMinutes: 15,
    });

    // Now resolve the older read with older values
    resolveRead(
      JSON.stringify({ mode: "default", onMinutes: 10, offMinutes: 5 }),
    );
    const result = await readPromise;

    // Must return the newer custom configuration, not the stale read
    expect(result.mode).toBe("custom");
    expect(result.onMinutes).toBe(30);
    expect(getCachedAerationConfig("machine-stale").mode).toBe("custom");
  });

  test("formats aeration mode display strings correctly", () => {
    function formatAerationSubtitle(config) {
      if (config.mode === "custom") {
        return `${config.onMinutes} min ON / ${config.offMinutes} min OFF`;
      }
      return "Default Mode";
    }

    expect(
      formatAerationSubtitle({ mode: "default", onMinutes: 10, offMinutes: 5 }),
    ).toBe("Default Mode");
    expect(
      formatAerationSubtitle({ mode: "custom", onMinutes: 10, offMinutes: 5 }),
    ).toBe("10 min ON / 5 min OFF");
    expect(
      formatAerationSubtitle({ mode: "custom", onMinutes: 20, offMinutes: 15 }),
    ).toBe("20 min ON / 15 min OFF");
  });
});
