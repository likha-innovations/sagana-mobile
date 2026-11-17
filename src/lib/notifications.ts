import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import type { NotificationItem } from '@/types/notification';
import { createLogger } from '@/lib/logger';

const logger = createLogger('Notifications');

// Configure foreground presentation handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Request notification permissions from OS.
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    logger.info(`Notification permission status: ${finalStatus}`);
    return finalStatus === 'granted';
  } catch (err) {
    logger.warn('Failed to request notification permissions', err);
    return false;
  }
}

/**
 * Fires an immediate foreground local OS notification banner.
 */
export async function scheduleLocalNotification(
  item: NotificationItem,
): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: item.title,
        body: item.message,
        data: {
          id: item.id,
          machineId: item.machineId,
          batchId: item.batchId,
          route: (item.metadata as Record<string, unknown> | undefined)?.route,
          type: item.type,
          severity: item.severity,
        },
      },
      trigger: null,
    });
  } catch (err) {
    logger.warn('Failed to schedule local notification', err);
  }
}

/**
 * Route user on banner tap.
 */
export function handleNotificationResponse(
  response: Notifications.NotificationResponse,
) {
  const data = response?.notification?.request?.content?.data as
    | {
        route?: string;
        batchId?: string;
        machineId?: string;
      }
    | undefined;

  logger.info('User responded to notification banner', data);

  if (data?.route && typeof data.route === 'string') {
    router.push(data.route as any);
  } else if (data?.batchId) {
    router.push(`/history/${data.batchId}` as any);
  } else if (data?.machineId) {
    router.push(`/machines/${data.machineId}` as any);
  } else {
    router.push('/notifications' as any);
  }
}

/**
 * Subscribes to notification response events (taps on banners)
 * and processes any stored initial notification response from cold launch.
 */
export function setupNotificationListeners(): () => void {
  // Retrieve and handle stored initial response (cold launch) once setup is invoked
  void (async () => {
    try {
      const initialResponse =
        typeof Notifications.getLastNotificationResponse === 'function'
          ? Notifications.getLastNotificationResponse()
          : await Notifications.getLastNotificationResponseAsync?.();

      if (initialResponse) {
        handleNotificationResponse(initialResponse);
        if (typeof Notifications.clearLastNotificationResponse === 'function') {
          Notifications.clearLastNotificationResponse();
        } else if (
          typeof Notifications.clearLastNotificationResponseAsync === 'function'
        ) {
          await Notifications.clearLastNotificationResponseAsync();
        }
      }
    } catch (err) {
      logger.warn('Failed to retrieve initial notification response', err);
    }
  })();

  // Keep listener registered for subsequent taps while app is running
  const subscription =
    Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse,
    );

  return () => {
    subscription.remove();
  };
}
