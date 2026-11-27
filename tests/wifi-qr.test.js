const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

function loadWifiQr() {
  const filename = path.join(__dirname, "..", "src/lib/wifi-qr.ts");
  const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(code, { module, exports: module.exports }, { filename });
  return module.exports;
}

describe("parseWifiQr", () => {
  const { parseWifiQr } = loadWifiQr();

  it("parses standard WPA Wi-Fi QR payloads", () => {
    expect(
      parseWifiQr("WIFI:T:WPA;S:GFiber_0A407;P:secret123;H:false;;"),
    ).toEqual({
      ssid: "GFiber_0A407",
      password: "secret123",
    });
  });

  it("unescapes semicolons, colons, commas, and backslashes", () => {
    expect(parseWifiQr("WIFI:T:WPA;S:My\\;Net\\:1;P:p\\,a\\;s\\\\w;;")).toEqual(
      {
        ssid: "My;Net:1",
        password: "p,a;s\\w",
      },
    );
  });

  it("parses open networks with empty password", () => {
    expect(parseWifiQr("WIFI:T:nopass;S:GuestWifi;P:;;")).toEqual({
      ssid: "GuestWifi",
      password: "",
    });
  });

  it("parses router sticker \"<SSID> <PASSWORD>\" QR payloads", () => {
    expect(parseWifiQr("GFiber_0A407 EXAMPLEPASS")).toEqual({
      ssid: "GFiber_0A407",
      password: "EXAMPLEPASS",
    });
  });

  it("returns null for non-Wi-Fi QR strings or missing SSID", () => {
    expect(parseWifiQr("https://example.com")).toBeNull();
    expect(parseWifiQr("WIFI:T:WPA;P:secret123;;")).toBeNull();
  });
});
