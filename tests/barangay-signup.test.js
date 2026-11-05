const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

function setup({
  google = false,
  sessionId = "session-1",
  code = "A1B2C3",
} = {}) {
  const updateClerkUser = jest.fn().mockResolvedValue(undefined);
  const updateSignUp = jest
    .fn()
    .mockResolvedValue({ createdSessionId: sessionId });
  const setActive = jest.fn().mockResolvedValue(undefined);
  const setBarangay = jest.fn();
  const router = { replace: jest.fn() };
  const userApi = {
    assignBarangay: jest
      .fn()
      .mockResolvedValue({ id: "b1", name: "Barangay 1" }),
    updateProfile: jest.fn().mockResolvedValue({}),
  };
  const clerkUser = google
    ? { id: "user-1", unsafeMetadata: {}, update: updateClerkUser }
    : null;
  const react = {
    createContext: () => ({ Provider: "provider" }),
    useContext: jest.fn(),
    useCallback: (fn) => fn,
    useMemo: (fn) => fn(),
    useEffect: () => {},
    useState: () => [
      code ? { id: "b1", name: "Barangay 1", code } : null,
      setBarangay,
    ],
  };
  const deps = {
    react,
    "react/jsx-runtime": { jsx: (type, props) => ({ type, props }) },
    "@clerk/expo": {
      useAuth: () => ({
        isSignedIn: google,
        isLoaded: true,
        signOut: jest.fn(),
        getToken: jest.fn(),
      }),
      useUser: () => ({ user: clerkUser, isLoaded: true }),
      useSSO: () => ({ startSSOFlow: jest.fn() }),
      useClerk: () => ({
        client: {
          sessions: [
            {
              id: "session-1",
              getToken: jest.fn().mockResolvedValue("session-token"),
            },
          ],
        },
      }),
    },
    "@clerk/expo/legacy": {
      useSignIn: () => ({ signIn: {}, setActive: jest.fn(), isLoaded: true }),
      useSignUp: () => ({
        signUp: { update: updateSignUp },
        setActive,
        isLoaded: true,
      }),
    },
    "expo-web-browser": { maybeCompleteAuthSession: jest.fn() },
    "expo-linking": {},
    "expo-router": { useRouter: () => router },
    "@/types": {},
    "@/lib/auth-token": { setAuthTokenGetter: jest.fn() },
    "@/lib/socket": { disconnectSocket: jest.fn() },
    "@/lib/logger": {
      createLogger: () => ({
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      }),
    },
    "@/api/user.api": { userApi },
  };
  const filename = path.join(__dirname, "../src/context/auth-context.tsx");
  const moduleRef = { exports: {} };
  const codeText = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;
  vm.runInNewContext(
    codeText,
    {
      module: moduleRef,
      exports: moduleRef.exports,
      require: (name) => deps[name] ?? require(name),
    },
    { filename },
  );
  const context = moduleRef.exports.AuthProvider({ children: null }).props
    .value;
  return {
    context,
    userApi,
    updateClerkUser,
    updateSignUp,
    setActive,
    setBarangay,
    router,
  };
}

test("email signup rechecks the code with the new authenticated session", async () => {
  const { context, userApi, setActive } = setup();
  await expect(
    context.completeSignUp(
      "Juan",
      "Cruz",
      "01/01/2000",
      "b1",
      "Barangay 1",
      "password",
    ),
  ).resolves.toBe(true);
  expect(setActive).toHaveBeenCalledWith({ session: "session-1" });
  expect(userApi.assignBarangay).toHaveBeenCalledWith(
    "A1B2C3",
    "session-token",
  );
  expect(userApi.updateProfile).toHaveBeenCalledWith(
    { firstName: "Juan", lastName: "Cruz", birthday: "01/01/2000" },
    "session-token",
  );
});

test("Google signup rechecks the code for the authenticated user", async () => {
  const { context, userApi, updateClerkUser } = setup({ google: true });
  await expect(
    context.completeSignUp("Juan", "Cruz", "01/01/2000", "b1", "Barangay 1"),
  ).resolves.toBe(true);
  expect(updateClerkUser).toHaveBeenCalled();
  expect(userApi.assignBarangay).toHaveBeenCalledWith("A1B2C3");
});

test("a rotated code stops signup before updating the database profile", async () => {
  const { context, userApi } = setup({ google: true });
  userApi.assignBarangay.mockRejectedValue(new Error("Invalid barangay code"));
  await expect(
    context.completeSignUp("Juan", "Cruz", "01/01/2000", "b1", "Barangay 1"),
  ).rejects.toThrow("Invalid barangay code");
  expect(userApi.updateProfile).not.toHaveBeenCalled();
});

test("an incomplete email session clears the code before returning to login", async () => {
  const { context, setBarangay, router, userApi } = setup({ sessionId: null });
  await expect(
    context.completeSignUp(
      "Juan",
      "Cruz",
      "01/01/2000",
      "b1",
      "Barangay 1",
      "password",
    ),
  ).resolves.toBe(false);
  expect(setBarangay).toHaveBeenCalledWith(null);
  expect(router.replace).toHaveBeenCalledWith("/(auth)/sign-in");
  expect(userApi.assignBarangay).not.toHaveBeenCalled();
});
