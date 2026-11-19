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
    },
    { filename },
  );
  return module.exports;
}

describe("onboarding-storage", () => {
  test("distinguishes confirmed missing key (null) from failed read", async () => {
    let mockStore = { sagana_has_seen_onboarding: null };
    const secureStoreMock = {
      getItemAsync: jest.fn(async (key) => mockStore[key] ?? null),
      setItemAsync: jest.fn(async (key, val) => {
        mockStore[key] = val;
      }),
      deleteItemAsync: jest.fn(async (key) => {
        delete mockStore[key];
      }),
    };

    const storage = load("src/lib/onboarding-storage.ts", {
      "expo-secure-store": secureStoreMock,
    });

    const seen = await storage.hasSeenOnboarding();
    expect(seen).toBe(false);
    expect(secureStoreMock.getItemAsync).toHaveBeenCalledTimes(1);
  });

  test("failed read throws and does not cache false as confirmed state", async () => {
    let shouldFail = true;
    let mockStore = { sagana_has_seen_onboarding: "true" };

    const secureStoreMock = {
      getItemAsync: jest.fn(async (key) => {
        if (shouldFail) {
          throw new Error("Keychain locked / disk read failure");
        }
        return mockStore[key] ?? null;
      }),
      setItemAsync: jest.fn(),
      deleteItemAsync: jest.fn(),
    };

    const storage = load("src/lib/onboarding-storage.ts", {
      "expo-secure-store": secureStoreMock,
    });

    // 1. Initial read fails - must throw to remain distinct from missing key
    await expect(storage.hasSeenOnboarding()).rejects.toThrow(
      "Keychain locked / disk read failure",
    );

    // 2. Subscribe listener (auth gate)
    const listener = jest.fn();
    storage.subscribeOnboarding(listener);
    expect(listener).not.toHaveBeenCalled();

    // 3. Retry succeeds: storage recovers
    shouldFail = false;
    const retrySeen = await storage.hasSeenOnboarding();
    expect(retrySeen).toBe(true);

    // 4. Result must propagate to the listener
    expect(listener).toHaveBeenCalledWith(true);

    // 5. Subsequent calls use cache
    const cachedSeen = await storage.hasSeenOnboarding();
    expect(cachedSeen).toBe(true);
    expect(secureStoreMock.getItemAsync).toHaveBeenCalledTimes(2); // 1 failed + 1 successful retry
  });

  test("subscribeOnboarding immediately receives cached value if already resolved", async () => {
    const mockStore = { sagana_has_seen_onboarding: "true" };
    const secureStoreMock = {
      getItemAsync: jest.fn(async (key) => mockStore[key] ?? null),
    };

    const storage = load("src/lib/onboarding-storage.ts", {
      "expo-secure-store": secureStoreMock,
    });

    await storage.hasSeenOnboarding();

    const lateListener = jest.fn();
    storage.subscribeOnboarding(lateListener);
    expect(lateListener).toHaveBeenCalledWith(true);
  });

  test("setOnboardingCompleted and resetOnboarding notify listeners and persist", async () => {
    const mockStore = {};
    const secureStoreMock = {
      getItemAsync: jest.fn(async (key) => mockStore[key] ?? null),
      setItemAsync: jest.fn(async (key, val) => {
        mockStore[key] = val;
      }),
      deleteItemAsync: jest.fn(async (key) => {
        delete mockStore[key];
      }),
    };

    const storage = load("src/lib/onboarding-storage.ts", {
      "expo-secure-store": secureStoreMock,
    });

    const listener = jest.fn();
    storage.subscribeOnboarding(listener);

    await storage.setOnboardingCompleted();
    expect(listener).toHaveBeenCalledWith(true);
    expect(secureStoreMock.setItemAsync).toHaveBeenCalledWith(
      "sagana_has_seen_onboarding",
      "true",
    );

    await storage.resetOnboarding();
    expect(listener).toHaveBeenCalledWith(false);
    expect(secureStoreMock.deleteItemAsync).toHaveBeenCalledWith(
      "sagana_has_seen_onboarding",
    );
  });
});
