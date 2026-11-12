const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

const filename = path.join(__dirname, "../src/lib/barangay-code.ts");
const moduleRef = { exports: {} };
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText,
  { module: moduleRef, exports: moduleRef.exports },
);
const { changeBarangayCode, isCompleteBarangayCode, signupDestination } =
  moduleRef.exports;

test("accepts mixed alphanumeric input and preserves leading zeroes", () => {
  expect(changeBarangayCode("", "a", 0)).toBe("A");
  expect(changeBarangayCode("", "0aB123", 0)).toBe("0AB123");
  expect(isCompleteBarangayCode("0AB123")).toBe(true);
  expect(isCompleteBarangayCode("0AB 23")).toBe(false);
  expect(changeBarangayCode("ABC123", "AD", 0)).toBe("DBC123");
  expect(changeBarangayCode("ABC", "", 2)).toBe("AB");
  expect(changeBarangayCode("ABC123", "Axyz789", 0)).toBe("XYZ789");
  expect(changeBarangayCode("ABC123", "Q7", 1)).toBe("AQ7123");
});

test("routes existing, new, and interrupted signup accounts correctly", () => {
  expect(signupDestination(true, true, false)).toBe("app");
  expect(signupDestination(true, false, false)).toBe("signup");
  expect(signupDestination(false, false, false)).toBe("code");
  expect(signupDestination(false, false, true)).toBe("signup");
  expect(signupDestination(false, true, false)).toBe("code");
  expect(signupDestination(true, true, false, true)).toBe("suspended");
  expect(signupDestination(false, false, false, true)).toBe("suspended");
});

test("preserves repeated characters pasted over a selected character", () => {
  expect(changeBarangayCode("A", "AA", 0, { start: 0, end: 1 })).toBe("AA");
  expect(changeBarangayCode("A", "AA", 0, { start: 1, end: 1 })).toBe("A");
});
