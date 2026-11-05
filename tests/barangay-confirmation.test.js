const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

function setup(signedIn = false) {
  const states = ["ABC123"];
  let stateIndex = 0;
  const effects = [];
  const router = { replace: jest.fn() };
  const setSignupBarangay = jest.fn();
  const assignBarangay = jest.fn().mockResolvedValue({});
  const validateCode = jest
    .fn()
    .mockResolvedValue({ id: "b1", name: "Barangay One" });
  const confirmModal = () => null;
  const element = (type, props) => ({ type, props });
  const react = {
    useState: (initial) => {
      const index = stateIndex++;
      if (!(index in states)) states[index] = initial;
      return [
        states[index],
        (value) => {
          states[index] =
            typeof value === "function" ? value(states[index]) : value;
        },
      ];
    },
    useEffect: (callback) => effects.push(callback),
    useCallback: (callback) => callback,
    useRef: (value) => ({ current: value }),
  };
  const deps = {
    react,
    "react/jsx-runtime": { jsx: element, jsxs: element },
    "react-native": {
      Keyboard: { dismiss: jest.fn() },
      Platform: {},
      useWindowDimensions: () => ({ height: 800 }),
    },
    "expo-router": {
      useFocusEffect: () => {},
      useLocalSearchParams: () => ({}),
      useRouter: () => router,
    },
    "react-native-safe-area-context": {
      useSafeAreaInsets: () => ({ top: 0, bottom: 0 }),
    },
    "@tanstack/react-query": {
      useQueryClient: () => ({
        invalidateQueries: jest.fn().mockResolvedValue(undefined),
      }),
    },
    "lucide-react-native": {},
    "@gorhom/bottom-sheet": {},
    "@/api/barangays.api": { barangayApi: { validateCode } },
    "@/api/user.api": { userApi: { assignBarangay } },
    "@/components/ui/confirm-modal": { ConfirmModal: confirmModal },
    "@/context/auth-context": {
      useAuthContext: () => ({
        isSignedIn: signedIn,
        user: signedIn ? { id: "u1", birthday: "2000-01-01" } : null,
        setSignupBarangay,
      }),
    },
    "@/types": { ApiError: class ApiError extends Error {} },
    "@/lib/barangay-code": {
      isCompleteBarangayCode: (code) => /^[A-Z0-9]{6}$/.test(code),
    },
  };
  const file = path.join(__dirname, "../app/(auth)/barangay-code.tsx");
  const moduleRef = { exports: {} };
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
      },
    }).outputText,
    {
      module: moduleRef,
      exports: moduleRef.exports,
      require: (name) => deps[name],
    },
  );
  function render() {
    stateIndex = 0;
    const root = moduleRef.exports.default();
    return root.props.children.find(
      (child) =>
        child?.type === confirmModal &&
        child.props.title === "Barangay confirmed",
    ).props;
  }
  return {
    render,
    effects,
    router,
    setSignupBarangay,
    assignBarangay,
    validateCode,
  };
}

test.each([false, true])(
  "valid code requires confirmation before continuing (signed in: %s)",
  async (signedIn) => {
    const flow = setup(signedIn);
    flow.render();
    flow.effects[0]();
    await new Promise(setImmediate);
    expect(flow.validateCode).toHaveBeenCalledWith("ABC123");
    expect(flow.router.replace).not.toHaveBeenCalled();
    expect(flow.assignBarangay).not.toHaveBeenCalled();
    const modal = flow.render();
    expect(modal.visible).toBe(true);
    expect(modal.description).toContain("Barangay One");
    modal.onConfirm();
    await new Promise(setImmediate);
    if (signedIn) expect(flow.assignBarangay).toHaveBeenCalledWith("ABC123");
    else
      expect(flow.setSignupBarangay).toHaveBeenCalledWith({
        id: "b1",
        name: "Barangay One",
        code: "ABC123",
      });
    expect(flow.router.replace).toHaveBeenCalledWith(
      signedIn ? "/(app)/(tabs)" : "/(auth)/sign-up",
    );
  },
);

test("changing the code dismisses the confirmation without proceeding", async () => {
  const flow = setup();
  flow.render();
  flow.effects[0]();
  await new Promise(setImmediate);
  flow.render().onCancel();
  expect(flow.render().visible).toBe(false);
  expect(flow.router.replace).not.toHaveBeenCalled();
  expect(flow.setSignupBarangay).not.toHaveBeenCalled();
});
