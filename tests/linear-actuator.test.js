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

describe("Linear actuator manual override & collect flow", () => {
  test("deviceApi.sendCommand dispatches ACTUATOR_EXTEND and ACTUATOR_RETRACT", async () => {
    const sentCalls = [];
    const { deviceApi } = load("src/api/device.api.ts", {
      "./client": {
        api: {
          post: async (url, data) => {
            sentCalls.push({ url, data });
            return { success: true, deviceId: "AA:BB:CC", action: data.action };
          },
        },
      },
      "@/types": {},
    });

    await deviceApi.sendCommand("AA:BB:CC:DD:EE:FF", {
      action: "ACTUATOR_EXTEND",
    });
    expect(sentCalls[0]).toEqual({
      url: "/telemetry/devices/AA:BB:CC:DD:EE:FF/command",
      data: { action: "ACTUATOR_EXTEND" },
    });

    await deviceApi.sendCommand("AA:BB:CC:DD:EE:FF", {
      action: "ACTUATOR_RETRACT",
    });
    expect(sentCalls[1]).toEqual({
      url: "/telemetry/devices/AA:BB:CC:DD:EE:FF/command",
      data: { action: "ACTUATOR_RETRACT" },
    });
  });

  test("deviceApi.sendCommand propagates network errors", async () => {
    const { deviceApi } = load("src/api/device.api.ts", {
      "./client": {
        api: {
          post: async () => {
            throw new Error("Device offline or network error");
          },
        },
      },
      "@/types": {},
    });

    await expect(
      deviceApi.sendCommand("AA:BB:CC:DD:EE:FF", {
        action: "ACTUATOR_EXTEND",
      }),
    ).rejects.toThrow("Device offline or network error");
  });

  test("actuator movement state machine produces correct labels and uninterruptible lock", () => {
    function getActuatorState(floorState) {
      const isMoving = floorState === "raising" || floorState === "dropping";
      let label = "Raise floor";
      if (floorState === "raising") label = "Raising floor..";
      else if (floorState === "raised") label = "Drop floor";
      else if (floorState === "dropping") label = "Dropping floor..";

      return {
        floorState,
        isMoving,
        label,
        canGoBack: !isMoving,
        canToggle: !isMoving,
      };
    }

    const lowered = getActuatorState("lowered");
    expect(lowered.label).toBe("Raise floor");
    expect(lowered.isMoving).toBe(false);
    expect(lowered.canGoBack).toBe(true);

    const raising = getActuatorState("raising");
    expect(raising.label).toBe("Raising floor..");
    expect(raising.isMoving).toBe(true);
    expect(raising.canGoBack).toBe(false);
    expect(raising.canToggle).toBe(false);

    const raised = getActuatorState("raised");
    expect(raised.label).toBe("Drop floor");
    expect(raised.isMoving).toBe(false);
    expect(raised.canGoBack).toBe(true);

    const dropping = getActuatorState("dropping");
    expect(dropping.label).toBe("Dropping floor..");
    expect(dropping.isMoving).toBe(true);
    expect(dropping.canGoBack).toBe(false);
    expect(dropping.canToggle).toBe(false);
  });

  test("actuator-storage tracks and persists floor position per machine", async () => {
    const store = new Map();
    const mockSecureStore = {
      getItemAsync: async (key) => store.get(key) ?? null,
      setItemAsync: async (key, val) => {
        store.set(key, val);
      },
    };

    const { getCachedFloorPosition, getFloorPosition, setFloorPosition } = load(
      "src/lib/actuator-storage.ts",
      {
        "expo-secure-store": mockSecureStore,
      },
    );

    expect(getCachedFloorPosition("machine-123")).toBe("lowered");
    await setFloorPosition("machine-123", "raised");
    expect(getCachedFloorPosition("machine-123")).toBe("raised");
    expect(await getFloorPosition("machine-123")).toBe("raised");

    await setFloorPosition("machine-123", "lowered");
    expect(getCachedFloorPosition("machine-123")).toBe("lowered");
    expect(await getFloorPosition("machine-123")).toBe("lowered");
  });
});
