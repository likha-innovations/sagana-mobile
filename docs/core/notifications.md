# In-App & Push Notifications

Sagana Mobile implements a multi-channel notification subsystem combining real-time **Socket.IO** events, local device push alerts via **Expo Notifications** (`expo-notifications`), and TanStack Query cache synchronization.

---

## 🏗️ Architecture & Notification Pipeline

```
[Hardware Event / MQTT / API Trigger]
                │
                ▼
      [NestJS Backend Gateway]
                │  emit('notification', payload)
                ▼
      [Sagana Mobile / useSocket]
        ├── 1. Optimistic Query Cache Prepend (scoped to current user)
        ├── 2. TanStack Invalidation (unread-count query)
        └── 3. Local Push Notification (scheduleNotificationAsync via Expo)
                │
                ▼
        [Operating System Banner]
                │  User taps notification
                ▼
        [Deep Link Navigation: /(app)/notifications]
```

---

## 📱 Expo Notifications Configuration (`src/lib/notifications.ts`)

Notification capabilities are initialized and managed through `src/lib/notifications.ts`.

### 1. Foreground Presentation Handler

By default, mobile OS environments suppress local notification banners when an app is foregrounded. Sagana Mobile configures `Notifications.setNotificationHandler` to display banners and play alert sounds even while active:

```typescript
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    priority: Notifications.AndroidNotificationPriority.HIGH,
  }),
});
```

### 2. Permissions & Device Registration

The app requests permissions via `requestNotificationPermissions()` upon user sign-in:

```typescript
export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
}
```

### 3. Scheduling Local Foreground Alerts

When real-time alerts arrive over the active Socket.IO connection, `presentLocalNotification()` dispatches a high-priority local notification:

```typescript
export async function presentLocalNotification(params: {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: params.title,
      body: params.body,
      data: params.data ?? {},
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: null, // Displays immediately
  });
}
```

---

## 🚀 Cold Start & Response Handling

When a user taps a notification while the mobile application is killed or in the background:

1. **Cold Launch Intake**:
   - `Notifications.getLastNotificationResponseAsync()` checks for stored launch intents.
   - The intent is processed once authentication and navigation layouts are fully mounted.
   - `Notifications.clearLastNotificationResponseAsync()` clears the handled intent to prevent duplicate redirect loops.
2. **Subsequent Response Listener**:
   - `Notifications.addNotificationResponseReceivedListener()` listens for subsequent foreground or background notification interactions while the app is alive.
   - Handlers extract payload metadata (e.g., target route) and navigate to `/(app)/notifications`.

---

## ⚡ Real-Time Socket.IO Synchronization (`src/hooks/use-socket.ts`)

The `useSocket` hook listens for the `'notification'` event broadcast by the backend `/telemetry` gateway:

```typescript
socket.on('notification', async (notification: NotificationItem) => {
  // 1. Optimistically update only list queries for the authenticated user
  if (user?.id) {
    queryClient.setQueriesData(
      { queryKey: notificationKeys.lists(user.id) },
      (oldData: unknown) => {
        if (!Array.isArray(oldData)) return oldData;
        return [notification, ...oldData];
      },
    );
  }

  // 2. Invalidate unread badge counter query
  queryClient.invalidateQueries({
    queryKey: notificationKeys.unreadCount(user?.id),
  });

  // 3. Trigger local device push alert
  await presentLocalNotification({
    title: notification.title,
    body: notification.message,
    data: {
      id: notification.id,
      type: notification.type,
      url: '/(app)/notifications',
    },
  });
});
```

::: tip 🛡️ Cache Segregation
Optimistic updates use `notificationKeys.lists(userId)` (`['notifications', userId, 'list']`) to ensure list updates never overwrite or corrupt the scalar integer stored in `unreadCount` (`['notifications', userId, 'unread-count']`).
:::

---

## 🔔 UI Integration: Header Notification Bell

The `NotificationBell` component (`src/components/navigation/notification-bell.tsx`) displays in the dashboard header:

- **Unread Badge**: Uses `useUnreadNotificationCount()` to fetch the active unread total.
- **Styling**: Rendered using 100% pure **Uniwind** Tailwind v4 classes with relative container sizing (`w-6 h-6 items-center justify-center`) and absolute badge anchoring (`-top-1 -right-1.5`).
- **Touch Interaction**: Tapping redirects directly to `/(app)/notifications`.
