const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

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
  const getSessionToken = jest.fn().mockResolvedValue("session-token");
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
              getToken: getSessionToken,
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
    "@/types": { ApiError },
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
    getSessionToken,
    InvalidBarangayCodeError: moduleRef.exports.InvalidBarangayCodeError,
    MissingSignupRequirementsError:
      moduleRef.exports.MissingSignupRequirementsError,
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

test("missing requirements preserve the signup and validated barangay", async () => {
  const {
    context,
    updateSignUp,
    setBarangay,
    router,
    MissingSignupRequirementsError,
  } = setup();
  updateSignUp.mockResolvedValue({
    status: "missing_requirements",
    createdSessionId: null,
    missingFields: ["phone_number"],
    unverifiedFields: [],
  });
  await expect(
    context.completeSignUp(
      "Juan",
      "Cruz",
      "01/01/2000",
      "b1",
      "Barangay 1",
      "password",
    ),
  ).rejects.toBeInstanceOf(MissingSignupRequirementsError);
  expect(setBarangay).not.toHaveBeenCalled();
  expect(router.replace).not.toHaveBeenCalled();
});

test.each(["assignBarangay", "updateProfile"])(
  "refreshes the same session once after a 401 on %s",
  async (method) => {
    const { context, userApi, getSessionToken } = setup();
    getSessionToken
      .mockResolvedValueOnce("session-token")
      .mockResolvedValueOnce("fresh-token");
    userApi[method]
      .mockRejectedValueOnce(new ApiError(401, "expired"))
      .mockResolvedValueOnce({});
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
    expect(getSessionToken).toHaveBeenLastCalledWith({ skipCache: true });
    expect(userApi[method].mock.calls[1][1]).toBe("fresh-token");
  },
);

test("does not retry non-401 writes or a failed refresh", async () => {
  const first = setup();
  first.userApi.assignBarangay.mockRejectedValue(new ApiError(500, "server"));
  await expect(
    first.context.completeSignUp(
      "Juan",
      "Cruz",
      "01/01/2000",
      "b1",
      "Barangay 1",
    ),
  ).rejects.toThrow("server");
  expect(first.getSessionToken).toHaveBeenCalledTimes(1);
  const second = setup();
  second.userApi.assignBarangay.mockRejectedValue(new ApiError(401, "expired"));
  second.getSessionToken
    .mockResolvedValueOnce("session-token")
    .mockResolvedValueOnce(null);
  await expect(
    second.context.completeSignUp(
      "Juan",
      "Cruz",
      "01/01/2000",
      "b1",
      "Barangay 1",
    ),
  ).rejects.toThrow("expired");
  expect(second.userApi.assignBarangay).toHaveBeenCalledTimes(1);
});

test("only an assignment 400 is identified as an invalid code", async () => {
  const flow = setup();
  flow.userApi.assignBarangay.mockRejectedValue(
    new ApiError(400, "changed wording"),
  );
  await expect(
    flow.context.completeSignUp(
      "Juan",
      "Cruz",
      "01/01/2000",
      "b1",
      "Barangay 1",
    ),
  ).rejects.toBeInstanceOf(flow.InvalidBarangayCodeError);
  const other = setup();
  other.userApi.updateProfile.mockRejectedValue(
    new ApiError(400, "bad profile"),
  );
  await expect(
    other.context.completeSignUp(
      "Juan",
      "Cruz",
      "01/01/2000",
      "b1",
      "Barangay 1",
    ),
  ).rejects.toThrow("bad profile");
});
