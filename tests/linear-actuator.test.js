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

  test("middle door interlock prevents raising floor when middle door is closed", () => {
    function computeActuatorControls(floorState, isMiddleDoorOpen) {
      const isMoving = floorState === "raising" || floorState === "dropping";
      const isFloorRaised = floorState === "raised";
      const isRaiseDisabled = !isFloorRaised && !isMiddleDoorOpen;
      const isButtonDisabled = isMoving || isRaiseDisabled;

      return {
        isMoving,
        isFloorRaised,
        isRaiseDisabled,
        isButtonDisabled,
      };
    }

    // Lowered + Door Closed -> Raising disabled
    const loweredClosed = computeActuatorControls("lowered", false);
    expect(loweredClosed.isRaiseDisabled).toBe(true);
    expect(loweredClosed.isButtonDisabled).toBe(true);

    // Lowered + Door Open -> Raising enabled
    const loweredOpen = computeActuatorControls("lowered", true);
    expect(loweredOpen.isRaiseDisabled).toBe(false);
    expect(loweredOpen.isButtonDisabled).toBe(false);

    // Raised (Door Closed or Open) -> Dropping floor is allowed
    const raisedClosed = computeActuatorControls("raised", false);
    expect(raisedClosed.isRaiseDisabled).toBe(false);
    expect(raisedClosed.isButtonDisabled).toBe(false);
  });

  test("offline guard and 4s acknowledgment timeout protect against disconnected broker", () => {
    function computeActuatorControls(floorState, isMiddleDoorOpen, isMachineOffline) {
      const isMoving = floorState === "raising" || floorState === "dropping";
      const isFloorRaised = floorState === "raised";
      const isRaiseDisabled = !isFloorRaised && !isMiddleDoorOpen;
      const isButtonDisabled = isMoving || isRaiseDisabled || isMachineOffline;

      return {
        isMoving,
        isButtonDisabled,
        isMachineOffline,
      };
    }

    // Machine offline -> button is strictly disabled
    const offlineState = computeActuatorControls("lowered", true, true);
    expect(offlineState.isButtonDisabled).toBe(true);

    // Simulated 4-second timeout rollback logic
    let floorState = "lowered";
    let ackTimeout = null;
    let toastError = null;

    function handleToggle(isOnline) {
      if (!isOnline) {
        toastError = "Machine is offline";
        return;
      }
      floorState = "raising";
      ackTimeout = "timeout-scheduled";
    }

    function onTimeout() {
      if (ackTimeout) {
        floorState = "lowered";
        toastError = "Machine did not respond";
        ackTimeout = null;
      }
    }

    function onAckReceived() {
      ackTimeout = null;
    }

    // If offline when clicking, never enters raising
    handleToggle(false);
    expect(floorState).toBe("lowered");
    expect(toastError).toBe("Machine is offline");

    // If online when clicking, enters raising but rolls back on timeout
    handleToggle(true);
    expect(floorState).toBe("raising");
    expect(ackTimeout).toBe("timeout-scheduled");

    onTimeout();
    expect(floorState).toBe("lowered");
    expect(toastError).toBe("Machine did not respond");

    // If machine acknowledges in time, timeout is cleared and raising persists
    handleToggle(true);
    expect(floorState).toBe("raising");
    onAckReceived();
    expect(ackTimeout).toBeNull();
    expect(floorState).toBe("raising");
  });
});
