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
  list: (userId?: string, unreadOnly?: boolean) =>
    ["notifications", userId, "list", { unreadOnly }] as const,
  unreadCount: (userId?: string) =>
    ["notifications", userId, "unread-count"] as const,
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
  const { user, isSignedIn, isLoaded } = useAuthContext();

  return useQuery({
    queryKey: notificationKeys.list(user?.id, unreadOnly),
    enabled: isLoaded && isSignedIn && !!user?.id,
    queryFn: () => notificationsApi.getNotifications({ unreadOnly }),
    staleTime: 30_000,
  });
}

export function useUnreadNotificationsCount() {
  const { user, isSignedIn, isLoaded } = useAuthContext();

  return useQuery({
    queryKey: notificationKeys.unreadCount(user?.id),
    enabled: isLoaded && isSignedIn && !!user?.id,
    queryFn: () => notificationsApi.getUnreadCount(),
    staleTime: 30_000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();

  return useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.all });

      const previousQueries = queryClient.getQueriesData<NotificationItem[]>({
        queryKey: notificationKeys.all,
      });
      const previousUnreadCount = queryClient.getQueryData<number>(
        notificationKeys.unreadCount(user?.id),
      );

      queryClient.setQueriesData<NotificationItem[]>(
        { queryKey: notificationKeys.all },
        (old) => {
          if (!old || !Array.isArray(old)) return old;
          return old.map((n) => (n.id === id ? { ...n, isRead: true } : n));
        },
      );

      queryClient.setQueryData<number>(
        notificationKeys.unreadCount(user?.id),
        (prev) => (prev && prev > 0 ? prev - 1 : 0),
      );

      return { previousQueries, previousUnreadCount };
    },
    onError: (_err, _id, context) => {
      if (context?.previousQueries) {
        for (const [queryKey, data] of context.previousQueries) {
          queryClient.setQueryData(queryKey, data);
        }
      }
      if (context?.previousUnreadCount !== undefined) {
        queryClient.setQueryData(
          notificationKeys.unreadCount(user?.id),
          context.previousUnreadCount,
        );
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();

  return useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.all });

      const previousQueries = queryClient.getQueriesData<NotificationItem[]>({
        queryKey: notificationKeys.all,
      });
      const previousUnreadCount = queryClient.getQueryData<number>(
        notificationKeys.unreadCount(user?.id),
      );

      queryClient.setQueriesData<NotificationItem[]>(
        { queryKey: notificationKeys.all },
        (old) => {
          if (!old || !Array.isArray(old)) return old;
          return old.map((n) => ({ ...n, isRead: true }));
        },
      );

      queryClient.setQueryData<number>(
        notificationKeys.unreadCount(user?.id),
        0,
      );

      return { previousQueries, previousUnreadCount };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousQueries) {
        for (const [queryKey, data] of context.previousQueries) {
          queryClient.setQueryData(queryKey, data);
        }
      }
      if (context?.previousUnreadCount !== undefined) {
        queryClient.setQueryData(
          notificationKeys.unreadCount(user?.id),
          context.previousUnreadCount,
        );
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}
