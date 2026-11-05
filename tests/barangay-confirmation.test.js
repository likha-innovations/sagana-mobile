const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

function setup(signedIn = false, code = "ABC123") {
  const states = [code];
  let stateIndex = 0;
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
    "@/hooks/use-layout": {
      useDynamicLayout: () => ({
        insets: { top: 0, bottom: 0 },
        stackScrollPadding: 40,
      }),
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
  function renderRoot() {
    stateIndex = 0;
    return moduleRef.exports.default();
  }
  function render() {
    const root = renderRoot();
    return root.props.children.find(
      (child) =>
        child?.type === confirmModal &&
        child.props.title === "Barangay confirmed",
    ).props;
  }
  function action() {
    const children = renderRoot().props.children[0].props.children;
    return children.find((child) => child?.props?.className === "mt-auto pt-6")
      .props.children.props;
  }
  return {
    render,
    renderRoot,
    action,
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
    expect(flow.validateCode).not.toHaveBeenCalled();
    flow.action().onPress();
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
  flow.action().onPress();
  await new Promise(setImmediate);
  flow.render().onCancel();
  expect(flow.render().visible).toBe(false);
  expect(flow.router.replace).not.toHaveBeenCalled();
  expect(flow.setSignupBarangay).not.toHaveBeenCalled();
});

test("a failed code check can be retried without changing the code", async () => {
  const flow = setup();
  flow.validateCode.mockRejectedValueOnce(new Error("offline"));
  expect(flow.action().children.props.children).toBe("Next");
  flow.action().onPress();
  await new Promise(setImmediate);
  expect(flow.action().children.props.children).toBe("Try again");
  flow.action().onPress();
  await new Promise(setImmediate);
  expect(flow.validateCode).toHaveBeenCalledTimes(2);
  expect(flow.validateCode).toHaveBeenLastCalledWith("ABC123");
  expect(flow.render().visible).toBe(true);
});

test("incomplete codes cannot be submitted", () => {
  const flow = setup(false, "ABC");
  expect(flow.action().disabled).toBe(true);
  flow.action().onPress();
  expect(flow.validateCode).not.toHaveBeenCalled();
});

test("the action remains disabled while validation is pending", async () => {
  const flow = setup();
  let finish;
  flow.validateCode.mockReturnValueOnce(
    new Promise((resolve) => {
      finish = resolve;
    }),
  );
  flow.action().onPress();
  expect(flow.action().disabled).toBe(true);
  flow.action().onPress();
  expect(flow.validateCode).toHaveBeenCalledTimes(1);
  finish({ id: "b1", name: "Barangay One" });
  await new Promise(setImmediate);
  expect(flow.render().visible).toBe(true);
});
