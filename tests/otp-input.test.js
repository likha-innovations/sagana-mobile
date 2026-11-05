const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

const moduleRef = { exports: {} };
vm.runInNewContext(
  ts.transpileModule(
    fs.readFileSync(path.join(__dirname, "../src/lib/otp-input.ts"), "utf8"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } },
  ).outputText,
  { module: moduleRef, exports: moduleRef.exports },
);
const { changeOtpCode } = moduleRef.exports;

test("pastes numeric codes across fields and filters non-digits", () => {
  expect(changeOtpCode("", "012345", 0)).toBe("012345");
  expect(changeOtpCode("12", "34", 2)).toBe("1234");
  expect(changeOtpCode("123456", "1987654", 0)).toBe("987654");
  expect(changeOtpCode("", "01a2 345", 0)).toBe("012345");
  expect(changeOtpCode("123456", "89", 1)).toBe("189456");
});
