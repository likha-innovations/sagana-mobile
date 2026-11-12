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
const { signupDestination } = moduleRef.exports;

test("always routes suspended users to the suspended screen", () => {
  expect(signupDestination(true, true, false, true)).toBe("suspended");
  expect(signupDestination(true, false, false, true)).toBe("suspended");
  expect(signupDestination(false, false, false, true)).toBe("suspended");
  expect(signupDestination(false, true, true, true)).toBe("suspended");
});

test("routes active users according to their onboarding profile state", () => {
  expect(signupDestination(true, true, false, false)).toBe("app");
  expect(signupDestination(true, false, false, false)).toBe("signup");
  expect(signupDestination(false, false, false, false)).toBe("code");
});
