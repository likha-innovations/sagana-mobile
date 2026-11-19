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
});
