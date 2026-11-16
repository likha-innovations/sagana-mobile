import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { isToday, differenceInCalendarDays } from "date-fns";
import { notificationsApi } from "@/api/notifications.api";
import { useAuthContext } from "@/context/auth-context";
import type {
  NotificationItem,
  NotificationSection,
} from "@/types/notification";

export const notificationKeys = {
  all: ["notifications"] as const,
  list: (unreadOnly?: boolean) =>
    ["notifications", "list", { unreadOnly }] as const,
  unreadCount: () => ["notifications", "unread-count"] as const,
};

export function groupNotificationsByDate(
  items: NotificationItem[],
): NotificationSection[] {
  const today: NotificationItem[] = [];
  const last7Days: NotificationItem[] = [];
  const earlier: NotificationItem[] = [];

  const now = new Date();

  for (const item of items) {
    const itemDate = new Date(item.createdAt);
    if (isNaN(itemDate.getTime())) {
      earlier.push(item);
      continue;
    }

    if (isToday(itemDate)) {
      today.push(item);
    } else {
      const diffDays = differenceInCalendarDays(now, itemDate);
      if (diffDays <= 7 && diffDays >= 0) {
        last7Days.push(item);
      } else {
        earlier.push(item);
      }
    }
  }

  const sections: NotificationSection[] = [];
  if (today.length > 0) {
    sections.push({ title: "Today", data: today });
  }
  if (last7Days.length > 0) {
    sections.push({ title: "Last 7 days", data: last7Days });
  }
  if (earlier.length > 0) {
    sections.push({ title: "Earlier", data: earlier });
  }

  return sections;
}

export function useNotifications(unreadOnly = false) {
  const { isSignedIn, isLoaded } = useAuthContext();

  return useQuery({
    queryKey: notificationKeys.list(unreadOnly),
    enabled: isLoaded && isSignedIn,
    queryFn: () => notificationsApi.getNotifications({ unreadOnly }),
    staleTime: 30_000,
  });
}

export function useUnreadNotificationsCount() {
  const { isSignedIn, isLoaded } = useAuthContext();

  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    enabled: isLoaded && isSignedIn,
    queryFn: () => notificationsApi.getUnreadCount(),
    staleTime: 30_000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.all });

      queryClient.setQueriesData<NotificationItem[]>(
        { queryKey: notificationKeys.all },
        (old) => {
          if (!old || !Array.isArray(old)) return old;
          return old.map((n) => (n.id === id ? { ...n, isRead: true } : n));
        },
      );

      queryClient.setQueryData<number>(
        notificationKeys.unreadCount(),
        (prev) => (prev && prev > 0 ? prev - 1 : 0),
      );
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.all });

      queryClient.setQueriesData<NotificationItem[]>(
        { queryKey: notificationKeys.all },
        (old) => {
          if (!old || !Array.isArray(old)) return old;
          return old.map((n) => ({ ...n, isRead: true }));
        },
      );

      queryClient.setQueryData<number>(notificationKeys.unreadCount(), 0);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}
