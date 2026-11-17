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
      URLSearchParams,
      encodeURIComponent,
    },
    { filename },
  );
  return module.exports;
}

describe("notificationsApi", () => {
  test("getNotifications resolves array and propagates request failures", async () => {
    let shouldFail = false;
    let requestedUrl = "";

    const { notificationsApi } = load("src/api/notifications.api.ts", {
      "./client": {
        api: {
          get: async (url) => {
            requestedUrl = url;
            if (shouldFail) throw new Error("Network error");
            return [{ id: "n1", title: "Test" }];
          },
        },
      },
      "@/types/notification": {},
    });

    const result = await notificationsApi.getNotifications({
      unreadOnly: true,
      limit: 10,
    });
    expect(requestedUrl).toBe("/notifications?unreadOnly=true&limit=10");
    expect(result).toEqual([{ id: "n1", title: "Test" }]);

    shouldFail = true;
    await expect(notificationsApi.getNotifications()).rejects.toThrow(
      "Network error",
    );
  });

  test("getNotifications preserves successful empty response when response is not array", async () => {
    const { notificationsApi } = load("src/api/notifications.api.ts", {
      "./client": {
        api: {
          get: async () => null,
        },
      },
      "@/types/notification": {},
    });

    const result = await notificationsApi.getNotifications();
    expect(result).toEqual([]);
  });

  test("getUnreadCount resolves unread count and propagates request failures", async () => {
    let shouldFail = false;

    const { notificationsApi } = load("src/api/notifications.api.ts", {
      "./client": {
        api: {
          get: async () => {
            if (shouldFail) throw new Error("Unauthorized");
            return { unreadCount: 5 };
          },
        },
      },
      "@/types/notification": {},
    });

    const count = await notificationsApi.getUnreadCount();
    expect(count).toBe(5);

    shouldFail = true;
    await expect(notificationsApi.getUnreadCount()).rejects.toThrow(
      "Unauthorized",
    );
  });

  test("markAsRead calls endpoint and propagates failures", async () => {
    let calledUrl = "";
    let shouldFail = false;

    const { notificationsApi } = load("src/api/notifications.api.ts", {
      "./client": {
        api: {
          patch: async (url) => {
            calledUrl = url;
            if (shouldFail) throw new Error("Server error");
          },
        },
      },
      "@/types/notification": {},
    });

    await notificationsApi.markAsRead("abc/123");
    expect(calledUrl).toBe("/notifications/abc%2F123/read");

    shouldFail = true;
    await expect(notificationsApi.markAsRead("abc/123")).rejects.toThrow(
      "Server error",
    );
  });

  test("markAllAsRead calls endpoint and propagates failures", async () => {
    let calledUrl = "";
    let shouldFail = false;

    const { notificationsApi } = load("src/api/notifications.api.ts", {
      "./client": {
        api: {
          patch: async (url) => {
            calledUrl = url;
            if (shouldFail) throw new Error("Server error");
          },
        },
      },
      "@/types/notification": {},
    });

    await notificationsApi.markAllAsRead();
    expect(calledUrl).toBe("/notifications/read-all");

    shouldFail = true;
    await expect(notificationsApi.markAllAsRead()).rejects.toThrow(
      "Server error",
    );
  });
});

describe("notificationKeys", () => {
  test("scopes list and unreadCount by user ID while keeping all broad", () => {
    const { notificationKeys } = load("src/hooks/use-notifications.ts", {
      "@tanstack/react-query": {},
      "date-fns": { isToday: () => false, differenceInCalendarDays: () => 0 },
      "@/api/notifications.api": {},
      "@/context/auth-context": {},
      "@/types/notification": {},
    });

    expect(notificationKeys.all).toEqual(["notifications"]);
    expect(notificationKeys.list("user_1", true)).toEqual([
      "notifications",
      "user_1",
      "list",
      { unreadOnly: true },
    ]);
    expect(notificationKeys.list("user_2", false)).toEqual([
      "notifications",
      "user_2",
      "list",
      { unreadOnly: false },
    ]);
    expect(notificationKeys.unreadCount("user_1")).toEqual([
      "notifications",
      "user_1",
      "unread-count",
    ]);
  });
});

describe("notifications lib & routing", () => {
  test("handleNotificationResponse routes to batchId, machineId, route or fallback", () => {
    const pushedRoutes = [];
    const routerMock = {
      push: (route) => pushedRoutes.push(route),
    };

    const { handleNotificationResponse } = load("src/lib/notifications.ts", {
      "expo-notifications": {
        setNotificationHandler: jest.fn(),
        getPermissionsAsync: jest.fn(),
        requestPermissionsAsync: jest.fn(),
        scheduleNotificationAsync: jest.fn(),
        addNotificationResponseReceivedListener: jest.fn(),
      },
      "expo-router": { router: routerMock },
      "@/types/notification": {},
      "@/lib/logger": {
        createLogger: () => ({ info: jest.fn(), warn: jest.fn() }),
      },
    });

    // 1. route in metadata
    handleNotificationResponse({
      notification: {
        request: {
          content: { data: { route: "/(app)/edit-profile" } },
        },
      },
    });
    expect(pushedRoutes[pushedRoutes.length - 1]).toBe("/(app)/edit-profile");

    // 2. batchId
    handleNotificationResponse({
      notification: {
        request: {
          content: { data: { batchId: "batch_abc" } },
        },
      },
    });
    expect(pushedRoutes[pushedRoutes.length - 1]).toBe("/history/batch_abc");

    // 3. machineId
    handleNotificationResponse({
      notification: {
        request: {
          content: { data: { machineId: "mach_xyz" } },
        },
      },
    });
    expect(pushedRoutes[pushedRoutes.length - 1]).toBe("/machines/mach_xyz");

    // 4. Fallback
    handleNotificationResponse({
      notification: {
        request: { content: { data: {} } },
      },
    });
    expect(pushedRoutes[pushedRoutes.length - 1]).toBe("/notifications");
  });

  test("scheduleLocalNotification schedules immediate notification", async () => {
    let scheduled = null;
    const { scheduleLocalNotification } = load("src/lib/notifications.ts", {
      "expo-notifications": {
        setNotificationHandler: jest.fn(),
        scheduleNotificationAsync: async (opts) => {
          scheduled = opts;
        },
        addNotificationResponseReceivedListener: jest.fn(),
      },
      "expo-router": { router: {} },
      "@/types/notification": {},
      "@/lib/logger": {
        createLogger: () => ({ info: jest.fn(), warn: jest.fn() }),
      },
    });

    await scheduleLocalNotification({
      id: "n1",
      title: "Alert",
      message: "Test message",
      type: "machine",
      severity: "warning",
      machineId: "m1",
    });

    expect(scheduled).toEqual({
      content: {
        title: "Alert",
        body: "Test message",
        data: {
          id: "n1",
          machineId: "m1",
          batchId: undefined,
          route: undefined,
          type: "machine",
          severity: "warning",
        },
      },
      trigger: null,
    });
  });

  test("setupNotificationListeners processes and clears stored initial notification response", async () => {
    let cleared = false;
    let handled = null;

    const storedResponse = {
      notification: {
        request: {
          content: { data: { machineId: "m-cold-1" } },
        },
      },
    };

    const { setupNotificationListeners } = load("src/lib/notifications.ts", {
      "expo-notifications": {
        setNotificationHandler: jest.fn(),
        getLastNotificationResponse: () => storedResponse,
        clearLastNotificationResponse: () => {
          cleared = true;
        },
        addNotificationResponseReceivedListener: jest.fn(() => ({
          remove: jest.fn(),
        })),
      },
      "expo-router": {
        router: {
          push: (route) => {
            handled = route;
          },
        },
      },
      "@/types/notification": {},
      "@/lib/logger": {
        createLogger: () => ({ info: jest.fn(), warn: jest.fn() }),
      },
    });

    const cleanup = setupNotificationListeners();
    expect(handled).toBe("/machines/m-cold-1");
    expect(cleared).toBe(true);
    cleanup();
  });

  test("notificationKeys.lists provides list-scoped prefix without matching unreadCount", () => {
    const { notificationKeys } = load("src/hooks/use-notifications.ts", {
      "@tanstack/react-query": {},
      "date-fns": { isToday: () => false, differenceInCalendarDays: () => 0 },
      "@/api/notifications.api": {},
      "@/context/auth-context": {},
      "@/types/notification": {},
    });

    const listsKey = notificationKeys.lists("user_123");
    const listKey = notificationKeys.list("user_123", true);
    const unreadKey = notificationKeys.unreadCount("user_123");

    expect(listsKey).toEqual(["notifications", "user_123", "list"]);
    expect(listKey[0]).toBe(listsKey[0]);
    expect(listKey[1]).toBe(listsKey[1]);
    expect(listKey[2]).toBe(listsKey[2]);
    // unreadCount does not match list prefix
    expect(unreadKey[2]).toBe("unread-count");
  });
});
